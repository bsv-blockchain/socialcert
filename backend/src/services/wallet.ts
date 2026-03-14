import { PrivateKey, KeyDeriver, WalletInterface } from "@bsv/sdk";
import {
  WalletStorageManager,
  Services,
  Wallet,
  StorageClient,
  WalletSigner,
} from "@bsv/wallet-toolbox";
import { config } from "../config";

let instance: WalletInterface | null = null;

export async function getWallet(): Promise<WalletInterface> {
  if (instance) return instance;

  const keyDeriver = new KeyDeriver(
    PrivateKey.fromHex(config.SERVER_PRIVATE_KEY),
  );
  const storageManager = new WalletStorageManager(keyDeriver.identityKey);
  const signer = new WalletSigner(
    config.BSV_NETWORK,
    keyDeriver,
    storageManager,
  );
  const services = new Services(config.BSV_NETWORK);
  const wallet = new Wallet(signer, services);

  if (config.WALLET_STORAGE_URL) {
    const client = new StorageClient(wallet, config.WALLET_STORAGE_URL);
    await client.makeAvailable();
    await storageManager.addWalletStorageProvider(client);
  }

  instance = wallet as unknown as WalletInterface;
  return instance;
}
