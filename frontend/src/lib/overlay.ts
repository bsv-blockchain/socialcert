import {
  Certificate,
  DEFAULT_IDENTITY_CLIENT_OPTIONS,
  HTTPSOverlayBroadcastFacilitator,
  LookupResolver,
  PrivateKey,
  PushDrop,
  TopicBroadcaster,
  Transaction,
  Utils,
  withDoubleSpendRetry,
  type BroadcastFailure,
  type BroadcastResponse,
  type CertificateFieldNameUnder50Bytes,
  type LookupNetworkPreset,
  type LookupResolverConfig,
  type TaggedBEEF,
  type WalletCertificate,
} from '@bsv/sdk'
import { getWalletClient } from '@/lib/wallet'

export type OverlayNetworkPreset = Extract<LookupNetworkPreset, 'mainnet' | 'testnet'>

/**
 * Overlay lookup only understands `mainnet` | `testnet` | `teratestnet` | `local`.
 * Wallet-toolbox chain ids are `main` | `test`. Passing `main` through to
 * LookupResolver leaves `slapTrackers` undefined, so SHIP discovery throws
 * before any `/submit` runs.
 */
export function toOverlayNetworkPreset(network: string | undefined | null): OverlayNetworkPreset {
  const normalized = (network ?? '').trim().toLowerCase()
  if (normalized === 'test' || normalized === 'testnet') return 'testnet'
  return 'mainnet'
}

/** Known-good hosts that actually serve `ls_identity` / `ls_ship` / `tm_identity`. */
export const IDENTITY_OVERLAY_HOSTS: Record<OverlayNetworkPreset, string[]> = {
  mainnet: [
    'https://overlay-us-1.bsvb.tech',
    'https://overlay-eu-1.bsvb.tech',
    'https://overlay-ap-1.bsvb.tech',
    'https://users.bapp.dev',
  ],
  testnet: ['https://testnet-users.bapp.dev'],
}

const noopReputationStorage = {
  get: () => null,
  set: () => {},
}

export function identityLookupConfig(preset: OverlayNetworkPreset): LookupResolverConfig {
  const hosts = IDENTITY_OVERLAY_HOSTS[preset]
  return {
    networkPreset: preset,
    slapTrackers: hosts,
    hostOverrides: {
      ls_identity: hosts,
      ls_ship: hosts,
    },
    reputationStorage: noopReputationStorage,
  }
}

export function isPinnedIdentityOverlayHost(url: string, preset: OverlayNetworkPreset): boolean {
  return IDENTITY_OVERLAY_HOSTS[preset].some((host) => url === host || url.startsWith(`${host}/`))
}

export function createIdentityLookupResolver(preset: OverlayNetworkPreset): LookupResolver {
  return new LookupResolver(identityLookupConfig(preset))
}

const SUBMIT_TIMEOUT_MS = 15_000

class PinnedIdentityBroadcastFacilitator {
  constructor(private readonly preset: OverlayNetworkPreset) {}

  async send(url: string, taggedBEEF: TaggedBEEF) {
    if (!isPinnedIdentityOverlayHost(url, this.preset)) {
      throw new Error(`Skipping unpinned overlay host: ${url}`)
    }
    const controller = typeof AbortController === 'undefined' ? undefined : new AbortController()
    const timer = setTimeout(() => controller?.abort(), SUBMIT_TIMEOUT_MS)
    try {
      const inner = new HTTPSOverlayBroadcastFacilitator(async (input: RequestInfo | URL, init?: RequestInit) => {
        return await fetch(input, { ...init, signal: controller?.signal })
      })
      return await inner.send(url, taggedBEEF)
    } finally {
      clearTimeout(timer)
    }
  }
}

export function createIdentityBroadcaster(preset: OverlayNetworkPreset): TopicBroadcaster {
  return new TopicBroadcaster(['tm_identity'], {
    networkPreset: preset,
    resolver: createIdentityLookupResolver(preset),
    facilitator: new PinnedIdentityBroadcastFacilitator(preset),
  })
}

export function assertOverlayBroadcast(
  result: BroadcastResponse | BroadcastFailure,
): BroadcastResponse {
  if (result.status === 'success') return result
  throw new Error(`Overlay submit failed (${result.code}): ${result.description}`)
}

export async function resolveOverlayNetworkPreset(): Promise<OverlayNetworkPreset> {
  const { network } = await getWalletClient().getNetwork({})
  return toOverlayNetworkPreset(network)
}

/**
 * Publish selected certificate fields to `tm_identity`.
 *
 * Same token construction as IdentityClient.publiclyRevealAttributes, but the
 * overlay submit uses a resolver pinned to hosts that serve tm_identity instead
 * of discovering them through unfiltered SLAP ads (many of which are dead).
 */
export async function publiclyRevealCertificate(
  certificate: WalletCertificate,
  fieldsToReveal: CertificateFieldNameUnder50Bytes[],
): Promise<BroadcastResponse> {
  const wallet = getWalletClient()
  const options = DEFAULT_IDENTITY_CLIENT_OPTIONS

  if (Object.keys(certificate.fields).length === 0) {
    throw new Error('Public reveal failed: Certificate has no fields to reveal!')
  }
  if (fieldsToReveal.length === 0) {
    throw new Error('Public reveal failed: You must reveal at least one field!')
  }

  try {
    const masterCert = new Certificate(
      certificate.type,
      certificate.serialNumber,
      certificate.subject,
      certificate.certifier,
      certificate.revocationOutpoint,
      certificate.fields,
      certificate.signature,
    )
    await masterCert.verify()
  } catch {
    throw new Error('Public reveal failed: Certificate verification failed!')
  }

  const { keyringForVerifier } = await wallet.proveCertificate({
    certificate,
    fieldsToReveal,
    verifier: new PrivateKey(1).toPublicKey().toString(),
  })

  const lockingScript = await new PushDrop(wallet).lock(
    [Utils.toArray(JSON.stringify({ ...certificate, keyring: keyringForVerifier }))],
    options.protocolID,
    options.keyID,
    'anyone',
    true,
    true,
  )

  const { tx } = await wallet.createAction({
    description: 'Create a new Identity Token',
    outputs: [
      {
        satoshis: options.tokenAmount,
        lockingScript: lockingScript.toHex(),
        outputDescription: 'Identity Token',
      },
    ],
    options: {
      randomizeOutputs: false,
    },
  })

  if (tx === undefined) {
    throw new Error(
      'Public reveal failed: wallet created the token but did not return a transaction to submit to the overlay.',
    )
  }

  const preset = await resolveOverlayNetworkPreset()
  const broadcaster = createIdentityBroadcaster(preset)
  return assertOverlayBroadcast(await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx)))
}

export async function revokeCertificateRevelation(serialNumber: string): Promise<void> {
  const wallet = getWalletClient()
  const options = DEFAULT_IDENTITY_CLIENT_OPTIONS
  const preset = await resolveOverlayNetworkPreset()
  const lookupResolver = createIdentityLookupResolver(preset)
  const result = await lookupResolver.query({
    service: 'ls_identity',
    query: { serialNumber },
  })

  if (result.type !== 'output-list' || result.outputs.length === 0) {
    throw new Error('Failed to find a live public identity token for this certificate.')
  }

  const topicBroadcaster = createIdentityBroadcaster(preset)

  await withDoubleSpendRetry(async () => {
    const tokenTx = Transaction.fromBEEF(result.outputs[0].beef)
    const outpoint = `${tokenTx.id('hex')}.${options.outputIndex}`
    const lockingScript = tokenTx.outputs[options.outputIndex]?.lockingScript
    if (lockingScript === undefined) {
      throw new Error('Failed to get locking script for revelation output!')
    }

    const { signableTransaction } = await wallet.createAction({
      description: 'Spend certificate revelation token',
      inputBEEF: result.outputs[0].beef,
      inputs: [
        {
          inputDescription: 'Revelation token',
          outpoint,
          unlockingScriptLength: 74,
        },
      ],
      options: {
        randomizeOutputs: false,
        acceptDelayedBroadcast: false,
        noSend: true,
      },
    })

    if (signableTransaction === undefined) {
      throw new Error('Failed to create signable transaction')
    }

    const partialTx = Transaction.fromBEEF(signableTransaction.tx)
    const unlocker = new PushDrop(wallet).unlock(options.protocolID, options.keyID, 'anyone')
    const unlockingScript = await unlocker.sign(partialTx, options.outputIndex)
    const { tx: signedTx } = await wallet.signAction({
      reference: signableTransaction.reference,
      spends: {
        [options.outputIndex]: {
          unlockingScript: unlockingScript.toHex(),
        },
      },
      options: {
        acceptDelayedBroadcast: false,
        noSend: true,
      },
    })

    if (signedTx === undefined) {
      throw new Error('Failed to sign transaction')
    }

    assertOverlayBroadcast(await topicBroadcaster.broadcast(Transaction.fromAtomicBEEF(signedTx)))
  }, topicBroadcaster)
}

export async function isCertificatePublic(serialNumber: string): Promise<boolean> {
  try {
    const preset = await resolveOverlayNetworkPreset()
    const resolver = createIdentityLookupResolver(preset)
    const answer = await resolver.query({ service: 'ls_identity', query: { serialNumber } })
    return answer.type === 'output-list' && answer.outputs.length > 0
  } catch (err) {
    console.error('Identity overlay lookup failed:', err)
    return false
  }
}
