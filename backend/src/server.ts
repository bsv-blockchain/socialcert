import express, { Request, Response, NextFunction } from 'express'
import { WalletInterface } from '@bsv/sdk'
import { createAuthMiddleware } from '@bsv/auth-express-middleware'
import { config } from './config'
import { requestIdMiddleware } from './middleware/requestId'
import { errorHandler } from './middleware/errorHandler'
import { httpRequestDuration, httpRequestsTotal } from './routes/metrics'
import {
  healthRouter,
  metricsRouter,
  manifestRouter,
  emailVerificationRouter,
  phoneVerificationRouter,
  xVerificationRouter,
  signCertificateRouter,
} from './routes'
import { logger } from './utils/logger'

let serverWallet: WalletInterface

export function getServerWallet(): WalletInterface {
  return serverWallet
}

export function createApp(wallet: WalletInterface) {
  serverWallet = wallet
  const app = express()

  // ─── Global middleware ──────────────────────────────────────────────────

  // Body parsing
  app.use(express.json({ limit: '10mb' }))

  // Request ID
  app.use(requestIdMiddleware)

  // CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin
    const allowedOrigins = [config.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
    }
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset')
    res.header('Access-Control-Allow-Private-Network', 'true')

    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
      return
    }
    next()
  })

  // Request metrics (for Prometheus)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000
      const route = req.route?.path || req.path
      const method = req.method
      const statusCode = res.statusCode.toString()

      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration)
      httpRequestsTotal.inc({ method, route, status_code: statusCode })
    })
    next()
  })

  // ─── Public routes (no auth required) ──────────────────────────────────

  app.use(healthRouter)
  app.use(metricsRouter)
  app.use(manifestRouter)

  // X OAuth callback is a browser redirect, not an authenticated API call
  // It's registered inside xVerificationRouter but handled before auth middleware
  // by checking the route path
  app.get('/api/verify/x/callback', (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for this route — it's handled by the xVerification router
    next()
  })

  // ─── BSV Auth middleware ───────────────────────────────────────────────

  app.use(createAuthMiddleware({
    wallet,
    logger: {
      log: (msg: string) => logger.debug(msg),
      error: (msg: string) => logger.error(msg),
      warn: (msg: string) => logger.warn(msg),
      info: (msg: string) => logger.info(msg),
      debug: (msg: string) => logger.debug(msg),
    } as any,
    logLevel: config.NODE_ENV === 'development' ? 'debug' : 'info',
  }))

  // ─── Authenticated routes ─────────────────────────────────────────────

  app.use(emailVerificationRouter)
  app.use(phoneVerificationRouter)
  app.use(xVerificationRouter)
  app.use(signCertificateRouter)

  // ─── Error handler (must be last) ─────────────────────────────────────

  app.use(errorHandler)

  return app
}
