import { config } from './config'
import { logger } from './utils/logger'
import { connectToMongoDB, closeMongoConnection } from './db/mongo'
import { connectToRedis, closeRedisConnection } from './services/redis'
import { createApp } from './server'
import { SetupWallet } from '@bsv/wallet-toolbox'

async function main() {
  logger.info({ env: config.NODE_ENV }, 'Starting SocialCert backend...')

  // Connect to infrastructure
  await connectToMongoDB()
  connectToRedis()

  // Initialize BSV wallet
  logger.info('Initializing BSV wallet...')
  const wallet = await SetupWallet({
    env: config.BSV_NETWORK === 'main' ? 'mainnet' : 'testnet',
    rootKeyHex: config.SERVER_PRIVATE_KEY,
    ...(config.WALLET_STORAGE_URL ? { storageUrl: config.WALLET_STORAGE_URL } : {}),
  })
  logger.info('BSV wallet initialized')

  // Create and start the Express app
  const app = createApp(wallet)
  const server = app.listen(config.HTTP_PORT, () => {
    logger.info(
      { port: config.HTTP_PORT, domain: config.HOSTING_DOMAIN },
      `SocialCert backend listening on port ${config.HTTP_PORT}`
    )
  })

  // ─── Graceful shutdown ──────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...')

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed')

      try {
        await closeMongoConnection()
        await closeRedisConnection()
        logger.info('All connections closed. Exiting.')
        process.exit(0)
      } catch (err) {
        logger.error({ err }, 'Error during shutdown')
        process.exit(1)
      }
    })

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 30000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection')
  })

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception')
    process.exit(1)
  })
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start SocialCert backend')
  process.exit(1)
})
