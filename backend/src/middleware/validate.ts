import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Creates a validation middleware for request body using a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(result.error)
      return
    }
    req.body = result.data
    next()
  }
}

/**
 * Creates a validation middleware for query parameters using a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      next(result.error)
      return
    }
    req.query = result.data
    next()
  }
}
