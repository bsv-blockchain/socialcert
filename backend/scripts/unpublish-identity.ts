/**
 * Spend a public identity overlay token so ls_identity stops resolving it.
 *
 * Who I Am publishes certificates to tm_identity as a 1-sat PushDrop UTXO.
 * This script spends that UTXO (same path as IdentityClient.revokeCertificateRevelation
 * in the UI) and submits the spend to the overlay.
 *
 * The signing wallet MUST be the identity that originally published the certificate.
 * The certifier server key cannot unpublish someone else's token.
 *
 * List public records for your wallet:
 *   npx tsx scripts/unpublish-identity.ts list
 *
 * Unpublish one serial:
 *   npx tsx scripts/unpublish-identity.ts unpublish --serial '<base64 serial>'
 *
 * Unpublish every public token for this identity:
 *   npx tsx scripts/unpublish-identity.ts unpublish --all
 *
 * Wallet (pick one):
 *   toolbox   IDENTITY_PRIVATE_KEY (hex or WIF) plus optional WALLET_STORAGE_URL
 *             for fee UTXOs. Defaults to storage.babbage.systems / staging-storage.
 *   json-api  Metanet Desktop JSON API (http://localhost:3321)
 *
 * Env: IDENTITY_PRIVATE_KEY, WALLET_STORAGE_URL, BSV_NETWORK=main|test
 * Run from backend/ so @bsv/* resolves. Loads ../.env and ./.env if present.
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import {
  HTTPWalletJSON,
  IdentityClient,
  LookupResolver,
  PrivateKey,
  ProtoWallet,
  PushDrop,
  Transaction,
  Utils,
  VerifiableCertificate,
  type WalletInterface,
} from '@bsv/sdk'
import { Setup } from '@bsv/wallet-toolbox'

dotenv.config({ path: resolve(process.cwd(), '.env') })
dotenv.config({ path: resolve(process.cwd(), '../.env') })

const CERT_TYPE_LABELS: Record<string, string> = {
  'Kz3dpnvTRO+LzCF+X4zI1GQqRhVmgLGPWZQqG+vhVig=': 'Google',
  'mffUklUzxbHr65xLohn0hRL0Tq2GjW1GYF/OPfzqJ6A=': 'Phone',
  'vdDWvftf1H+5+ZprUw123kjHlywH+v20aPQTuXgMpNc=': 'X',
  'exOl3KM0dIJ04EW5pZgbZmPag6MdJXd3/a1enmUU/BA=': 'Email',
}

type Chain = 'main' | 'test'
type WalletMode = 'toolbox' | 'json-api' | 'auto'
type OverlayPreset = 'mainnet' | 'testnet'
type Command = 'list' | 'unpublish' | 'help'

interface Args {
  command: Command
  serials: string[]
  all: boolean
  identityKey?: string
  network: Chain
  wallet: WalletMode
  dryRun: boolean
  yes: boolean
  originator: string
  jsonApiUrl: string
  storageUrl?: string
  privateKey?: string
}

interface PublicRecord {
  serialNumber: string
  type: string
  typeLabel: string
  subject: string
  certifier: string
  displayValue: string
  fields: Record<string, string>
  txid: string
  outputIndex: number
}

function printHelp(): void {
  console.log(`Usage:
  npx tsx scripts/unpublish-identity.ts list [options]
  npx tsx scripts/unpublish-identity.ts unpublish --serial <base64> [options]
  npx tsx scripts/unpublish-identity.ts unpublish --all [options]

Spends the tm_identity overlay UTXO for a publicly revealed certificate so
ls_identity no longer returns it. Does not delete the certificate from the wallet.

Options:
  --serial <base64>       Certificate serial to look up or unpublish (repeatable)
  --all                   Unpublish every public token for this identity
  --identity-key <hex>    Overlay lookup identity key (list without a wallet)
  --network main|test     Default: BSV_NETWORK or main
  --wallet toolbox|json-api
                          toolbox = IDENTITY_PRIVATE_KEY + wallet storage
                          json-api = Metanet Desktop at --json-api-url
  --json-api-url <url>    Default: http://localhost:3321
  --originator <host>     Required by json-api in Node. Default: localhost
  --storage-url <url>     Wallet storage for toolbox fee UTXOs
  --private-key <hex|wif> Overrides IDENTITY_PRIVATE_KEY
  --dry-run               Print targets; do not spend or broadcast
  --yes                   Skip the --all confirmation prompt
  -h, --help              Show this help

Env:
  IDENTITY_PRIVATE_KEY    Hex or WIF of the identity that published the token
  WALLET_STORAGE_URL      e.g. https://storage.babbage.systems
  BSV_NETWORK             main | test
`)
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: 'list',
    serials: [],
    all: false,
    network: (process.env.BSV_NETWORK === 'test' ? 'test' : 'main') as Chain,
    wallet: 'auto',
    dryRun: false,
    yes: false,
    originator: 'localhost',
    jsonApiUrl: 'http://localhost:3321',
    storageUrl: process.env.WALLET_STORAGE_URL,
    privateKey: process.env.IDENTITY_PRIVATE_KEY || process.env.PRIVATE_KEY,
  }

  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    const next = () => {
      const value = argv[++i]
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for ${token}`)
      }
      return value
    }
    switch (token) {
      case '-h':
      case '--help':
        args.command = 'help'
        break
      case '--serial':
        args.serials.push(next())
        break
      case '--all':
        args.all = true
        break
      case '--identity-key':
        args.identityKey = next()
        break
      case '--network': {
        const value = next()
        if (value !== 'main' && value !== 'test') {
          throw new Error('--network must be main or test')
        }
        args.network = value
        break
      }
      case '--wallet': {
        const value = next()
        if (value !== 'toolbox' && value !== 'json-api') {
          throw new Error('--wallet must be toolbox or json-api')
        }
        args.wallet = value
        break
      }
      case '--json-api-url':
        args.jsonApiUrl = next()
        break
      case '--originator':
        args.originator = next()
        break
      case '--storage-url':
        args.storageUrl = next()
        break
      case '--private-key':
        args.privateKey = next()
        break
      case '--dry-run':
        args.dryRun = true
        break
      case '--yes':
        args.yes = true
        break
      default:
        if (token.startsWith('-')) {
          throw new Error(`Unknown option: ${token}`)
        }
        positional.push(token)
    }
  }

  if (positional.length > 1) {
    throw new Error(`Unexpected arguments: ${positional.slice(1).join(' ')}`)
  }
  if (positional[0] === 'help' || positional[0] === 'list' || positional[0] === 'unpublish') {
    args.command = positional[0]
  } else if (positional[0]) {
    throw new Error(`Unknown command: ${positional[0]}`)
  } else if (args.all || args.serials.length > 0) {
    args.command = 'unpublish'
  }

  return args
}

function overlayPreset(network: Chain): OverlayPreset {
  return network === 'main' ? 'mainnet' : 'testnet'
}

function resolver(network: Chain): LookupResolver {
  const memory = new Map<string, string>()
  return new LookupResolver({
    networkPreset: overlayPreset(network),
    reputationStorage: {
      get: (key) => memory.get(key) ?? null,
      set: (key, value) => {
        memory.set(key, value)
      },
    },
  })
}

function parsePrivateKey(raw: string): string {
  const trimmed = raw.trim()
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return trimmed.toLowerCase()
  return PrivateKey.fromWif(trimmed).toHex()
}

async function openWallet(
  args: Args,
): Promise<{ wallet: WalletInterface; identityKey: string; originator?: string }> {
  const mode: Exclude<WalletMode, 'auto'> =
    args.wallet === 'auto' ? (args.privateKey ? 'toolbox' : 'json-api') : args.wallet

  if (mode === 'toolbox') {
    if (!args.privateKey) {
      throw new Error(
        'toolbox wallet needs IDENTITY_PRIVATE_KEY or --private-key (hex or WIF) of the identity that published the overlay token.',
      )
    }
    const rootKeyHex = parsePrivateKey(args.privateKey)
    const wallet = await Setup.createWalletClientNoEnv({
      chain: args.network,
      rootKeyHex,
      storageUrl: args.storageUrl,
    })
    const { publicKey } = await wallet.getPublicKey({ identityKey: true })
    return { wallet: wallet as unknown as WalletInterface, identityKey: publicKey }
  }

  const wallet = new HTTPWalletJSON(args.originator, args.jsonApiUrl)
  const { publicKey } = await wallet.getPublicKey({ identityKey: true })
  const { network } = await wallet.getNetwork({})
  const expected = overlayPreset(args.network)
  if (network !== expected) {
    throw new Error(
      `Wallet reports ${network} but --network is ${args.network}. Pass --network ${network === 'mainnet' ? 'main' : 'test'}.`,
    )
  }
  return { wallet, identityKey: publicKey, originator: args.originator }
}

function displayValue(fields: Record<string, string>, type: string): string {
  if (fields.userName) return `@${fields.userName.replace(/^@/, '')}`
  if (fields.email) return fields.email
  if (fields.phoneNumber) return fields.phoneNumber
  if (fields.name) return fields.name
  return CERT_TYPE_LABELS[type] || type.slice(0, 12)
}

async function parseOutput(beef: number[], outputIndex: number): Promise<PublicRecord | null> {
  try {
    const tx = Transaction.fromBEEF(beef)
    const output = tx.outputs[outputIndex]
    if (!output?.lockingScript) return null
    const decoded = PushDrop.decode(output.lockingScript)
    const certificate = JSON.parse(Utils.toUTF8(decoded.fields[0])) as {
      type: string
      serialNumber: string
      subject: string
      certifier: string
      revocationOutpoint: string
      fields: Record<string, string>
      keyring?: Record<string, string>
      signature?: string
    }
    let fields: Record<string, string> = {}
    try {
      const verifiable = new VerifiableCertificate(
        certificate.type,
        certificate.serialNumber,
        certificate.subject,
        certificate.certifier,
        certificate.revocationOutpoint,
        certificate.fields,
        certificate.keyring ?? {},
        certificate.signature,
      )
      fields = await verifiable.decryptFields(new ProtoWallet('anyone'))
    } catch {
      fields = {}
    }
    return {
      serialNumber: certificate.serialNumber,
      type: certificate.type,
      typeLabel: CERT_TYPE_LABELS[certificate.type] || 'Unknown',
      subject: certificate.subject,
      certifier: certificate.certifier,
      displayValue: displayValue(fields, certificate.type),
      fields,
      txid: tx.id('hex'),
      outputIndex,
    }
  } catch {
    return null
  }
}

async function lookupRecords(
  network: Chain,
  query: { serialNumber?: string; identityKey?: string },
): Promise<PublicRecord[]> {
  if (!query.serialNumber && !query.identityKey) {
    throw new Error('Overlay lookup needs --serial or an identity key')
  }
  const answer = await resolver(network).query(
    { service: 'ls_identity', query },
    15000,
    { graceMs: 300 },
  )
  if (answer.type !== 'output-list') {
    throw new Error(`Unexpected ls_identity answer type: ${answer.type}`)
  }
  const records: PublicRecord[] = []
  const seen = new Set<string>()
  for (const output of answer.outputs) {
    const record = await parseOutput(output.beef, output.outputIndex)
    if (!record) continue
    if (seen.has(record.serialNumber)) continue
    seen.add(record.serialNumber)
    records.push(record)
  }
  return records
}

function printRecords(records: PublicRecord[]): void {
  if (records.length === 0) {
    console.log('No public identity tokens found on ls_identity.')
    return
  }
  console.log(`Found ${records.length} public identity token(s):\n`)
  for (const [i, record] of records.entries()) {
    console.log(`  ${i + 1}. ${record.typeLabel.padEnd(8)} ${record.displayValue}`)
    console.log(`     serial     ${record.serialNumber}`)
    console.log(`     subject    ${record.subject}`)
    console.log(`     outpoint   ${record.txid}.${record.outputIndex}`)
  }
}

async function confirmAll(count: number, identityKey: string, skip: boolean): Promise<boolean> {
  if (skip) return true
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(
      `\nUnpublish ${count} public identity token(s) for ${identityKey}? [y/N] `,
    )
    return /^y(es)?$/i.test(answer.trim())
  } finally {
    rl.close()
  }
}

function explainError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (/insufficient/i.test(message)) {
    return `${message}\nThe spend still needs a fee input from this wallet. Fund the identity (toolbox: WALLET_STORAGE_URL must hold UTXOs for this key).`
  }
  if (/no wallet available|ECONNREFUSED|fetch failed/i.test(message)) {
    return `${message}\nStart Metanet Desktop (json-api) or pass IDENTITY_PRIVATE_KEY with --wallet toolbox.`
  }
  if (/Failed to get lookup result/i.test(message) || /Failed to get locking script/i.test(message)) {
    return `${message}\nls_identity did not return a live UTXO for that serial — it may already be unpublished.`
  }
  return message
}

async function unpublishSerials(
  wallet: WalletInterface,
  network: Chain,
  serials: string[],
  dryRun: boolean,
  originator?: string,
): Promise<void> {
  const identity = new IdentityClient(wallet, { networkPreset: overlayPreset(network) }, originator)
  for (const serial of serials) {
    console.log(`\n${dryRun ? 'Would spend' : 'Spending'} overlay token for serial ${serial}`)
    if (dryRun) continue
    try {
      await identity.revokeCertificateRevelation(serial)
    } catch (err) {
      throw new Error(explainError(err))
    }
    const remaining = await lookupRecords(network, { serialNumber: serial })
    if (remaining.length === 0) {
      console.log('Overlay lookup is empty. This certificate is no longer public.')
    } else {
      console.log(
        'Spend submitted, but ls_identity still returned the token. Overlay hosts can lag; wait and list again.',
      )
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.command === 'help') {
    printHelp()
    return
  }

  if (args.command === 'unpublish' && !args.all && args.serials.length === 0) {
    throw new Error('unpublish requires --serial <base64> or --all')
  }

  const needsWallet =
    args.command === 'unpublish' || (!args.identityKey && args.serials.length === 0)

  let wallet: WalletInterface | undefined
  let walletIdentityKey: string | undefined
  let originator: string | undefined
  if (needsWallet) {
    const opened = await openWallet(args)
    wallet = opened.wallet
    walletIdentityKey = opened.identityKey
    originator = opened.originator
    console.log(`Wallet identity key: ${walletIdentityKey}`)
  }

  console.log(`Network: ${overlayPreset(args.network)}`)

  if (args.command === 'list') {
    const query =
      args.serials.length === 1
        ? { serialNumber: args.serials[0] }
        : args.serials.length > 1
          ? undefined
          : { identityKey: args.identityKey || walletIdentityKey }
    if (query) {
      printRecords(await lookupRecords(args.network, query))
      return
    }
    const collected: PublicRecord[] = []
    for (const serial of args.serials) {
      collected.push(...(await lookupRecords(args.network, { serialNumber: serial })))
    }
    printRecords(collected)
    return
  }

  if (!wallet) {
    throw new Error('A wallet is required to spend the overlay token.')
  }

  let targets: PublicRecord[]
  if (args.all) {
    targets = await lookupRecords(args.network, {
      identityKey: args.identityKey || walletIdentityKey,
    })
  } else {
    targets = []
    for (const serial of args.serials) {
      const found = await lookupRecords(args.network, { serialNumber: serial })
      if (found.length === 0) {
        throw new Error(`No live tm_identity UTXO for serial ${serial}`)
      }
      targets.push(...found)
    }
  }

  printRecords(targets)
  if (targets.length === 0) return

  const foreign = targets.filter((record) => walletIdentityKey && record.subject !== walletIdentityKey)
  if (foreign.length > 0) {
    throw new Error(
      `These tokens belong to a different subject than the connected wallet:\n${foreign
        .map((r) => `  ${r.serialNumber} subject=${r.subject}`)
        .join('\n')}`,
    )
  }

  if (args.all && !(await confirmAll(targets.length, walletIdentityKey || '', args.yes))) {
    console.log('Aborted.')
    return
  }

  await unpublishSerials(
    wallet,
    args.network,
    targets.map((record) => record.serialNumber),
    args.dryRun,
    originator,
  )
}

main().catch((err) => {
  console.error(explainError(err))
  process.exit(1)
})
