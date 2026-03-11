import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

/**
 * Assigns a unique request ID to each incoming request.
 * The ID is set on req.requestId and as the X-Request-ID response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID()
  req.requestId = id
  res.setHeader('X-Request-ID', id)
  next()
}
