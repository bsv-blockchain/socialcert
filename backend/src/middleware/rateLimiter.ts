import { Response, NextFunction } from 'express'
import { checkRateLimit } from '../services/redis'
import { AuthRequest } from '../types'

/**
 * Creates a rate limiter middleware for authenticated routes.
 * Limits by identity key from BSV auth.
 */
export function rateLimiter(maxRequests: number = 30, windowSeconds: number = 60) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identityKey = req.auth?.identityKey
      if (!identityKey) {
        // If no auth, fall through — the auth middleware will catch it
        next()
        return
      }

      const key = `${identityKey}:${req.path}`
      const result = await checkRateLimit(key, maxRequests, windowSeconds)

      res.setHeader('X-RateLimit-Limit', maxRequests)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', result.resetIn)

      if (!result.allowed) {
        res.status(429).json({
          status: 'error',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.resetIn,
          requestId: req.requestId,
        })
        return
      }

      next()
    } catch (err) {
      // If Redis is down, don't block the request
      next()
    }
  }
}
