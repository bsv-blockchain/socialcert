import { Router, Request, Response } from 'express'
import { rateLimiter } from '../middleware/rateLimiter'
import { generateGoogleAuthUrl } from '../services/google'
import { logger } from '../utils/logger'

const router = Router()

// ─── Get Google OAuth 2.0 authorization URL ─────────────────────────────────

router.post(
  '/api/verify/google/auth-url',
  rateLimiter(10, 600),
  async (req: Request, res: Response) => {
    try {
      const identityKey = req.auth.identityKey
      const { url, state } = await generateGoogleAuthUrl(identityKey)

      res.json({
        status: 'success',
        data: { authUrl: url, state },
        requestId: req.requestId,
      })
    } catch (err: any) {
      logger.error({ err }, 'Failed to generate Google auth URL')
      res.status(500).json({
        status: 'error',
        message: 'Failed to initiate Google verification. Please try again.',
        requestId: req.requestId,
      })
    }
  }
)

export default router
