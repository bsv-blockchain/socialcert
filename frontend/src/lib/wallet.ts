import { WalletClient, AuthFetch, IdentityClient } from '@bsv/sdk'

let walletClient: WalletClient | null = null

export function getWalletClient(): WalletClient {
  if (!walletClient) {
    walletClient = new WalletClient()
  }
  return walletClient
}

export function getAuthFetch(): AuthFetch {
  return new AuthFetch(getWalletClient())
}

export function getIdentityClient(): IdentityClient {
  return new IdentityClient(getWalletClient())
}
