import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types'
import { rateLimiter } from '../middleware/rateLimiter'
import { validateBody } from '../middleware/validate'
import { generateAuthUrl, handleCallback, shareCertification } from '../services/twitter'
import { writeVerifiedAttributes } from '../db/mongo'
import { config } from '../config'
import { logger } from '../utils/logger'

const router = Router()

// ─── Get X OAuth 2.0 authorization URL ─────────────────────────────────────

router.post(
  '/api/verify/x/auth-url',
  rateLimiter(10, 600),
  async (req: AuthRequest, res: Response) => {
    try {
      const identityKey = req.auth.identityKey
      const { url, state } = await generateAuthUrl(identityKey)

      res.json({
        status: 'success',
        data: { authUrl: url, state },
        requestId: req.requestId,
      })
    } catch (err: any) {
      logger.error({ err }, 'Failed to generate X auth URL')
      res.status(500).json({
        status: 'error',
        message: 'Failed to initiate X verification. Please try again.',
        requestId: req.requestId,
      })
    }
  }
)

// ─── X OAuth 2.0 callback (not authenticated — called by browser redirect) ─

router.get('/api/verify/x/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string }

    if (!code || !state) {
      res.redirect(`${config.FRONTEND_URL}/verify/x?error=missing_params`)
      return
    }

    const result = await handleCallback(code, state)

    // Store verified attributes
    await writeVerifiedAttributes(result.identityKey, {
      userName: result.userName,
      profilePhoto: result.profilePhoto,
    })

    logger.info({ identityKey: result.identityKey, userName: result.userName }, 'X callback successful')

    // Redirect back to frontend with success params
    const params = new URLSearchParams({
      success: 'true',
      userName: result.userName,
      profilePhoto: result.profilePhoto,
    })
    res.redirect(`${config.FRONTEND_URL}/verify/x/callback?${params.toString()}`)
  } catch (err: any) {
    logger.error({ err }, 'X OAuth callback failed')
    res.redirect(`${config.FRONTEND_URL}/verify/x?error=auth_failed`)
  }
})

// ─── Check X verification status ───────────────────────────────────────────

router.post(
  '/api/verify/x/check',
  async (req: AuthRequest, res: Response) => {
    try {
      const identityKey = req.auth.identityKey

      // Check if there's a verification record for this identity key with X attributes
      const { verificationsCollection } = await import('../db/mongo')
      const verification = await verificationsCollection().findOne({
        identityKey,
        'verifiedAttributes.userName': { $exists: true },
        'verifiedAttributes.profilePhoto': { $exists: true },
      })

      if (verification) {
        res.json({
          status: 'success',
          data: {
            verified: true,
            userName: verification.verifiedAttributes.userName,
            profilePhoto: verification.verifiedAttributes.profilePhoto,
          },
          requestId: req.requestId,
        })
      } else {
        res.json({
          status: 'success',
          data: { verified: false },
          requestId: req.requestId,
        })
      }
    } catch (err: any) {
      logger.error({ err }, 'Failed to check X verification')
      res.status(500).json({
        status: 'error',
        message: 'Failed to check verification status.',
        requestId: req.requestId,
      })
    }
  }
)

// ─── Share certification on X ──────────────────────────────────────────────

const shareSchema = z.object({
  certType: z.enum(['email', 'phone', 'x']),
})

router.post(
  '/api/x/share',
  rateLimiter(3, 3600), // 3 shares per hour
  validateBody(shareSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { certType } = req.body
      const identityKey = req.auth.identityKey

      const result = await shareCertification(identityKey, certType, config.FRONTEND_URL)

      res.json({
        status: 'success',
        data: result,
        requestId: req.requestId,
      })
    } catch (err: any) {
      logger.error({ err }, 'Failed to share on X')
      const statusCode = err.statusCode || 500
      res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Failed to share on X. Please try again.',
        requestId: req.requestId,
      })
    }
  }
)

export default router
