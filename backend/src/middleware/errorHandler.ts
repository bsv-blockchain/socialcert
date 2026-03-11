import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { ZodError } from 'zod'

/**
 * Global error handler middleware.
 * Returns structured JSON error responses with the request ID.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown'

  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.flatten().fieldErrors
    logger.warn({ requestId, details }, 'Validation error')
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      details,
      requestId,
    })
    return
  }

  // Known application errors with status codes
  if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
    const statusCode = (err as any).statusCode
    logger.warn({ requestId, err: err.message }, `Application error (${statusCode})`)
    res.status(statusCode).json({
      status: 'error',
      message: err.message,
      requestId,
    })
    return
  }

  // Unexpected errors
  logger.error({ requestId, err }, 'Unhandled error')
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    requestId,
  })
}
