import { Request } from 'express'

/**
 * Augment the Express Request type globally to include BSV auth middleware fields
 * and our requestId middleware field.
 */
declare global {
  namespace Express {
    interface Request {
      auth: {
        identityKey: string
      }
    }
  }
}

/**
 * Type alias for authenticated requests (same as Express.Request after augmentation)
 */
export type AuthRequest = Request

/**
 * Certificate type definition
 */
export interface CertificateTypeDefinition {
  name: string
  fields: string[]
  definition: Record<string, string>
}

/**
 * Stored verification record
 */
export interface VerificationRecord {
  identityKey: string
  verifiedAttributes: Record<string, string>
  createdAt: Date
}

/**
 * Stored certification record
 */
export interface CertificationRecord {
  identityKey: string
  serialNumber: string
  signedCertificate: Record<string, unknown>
  createdAt: Date
}

/**
 * OAuth session stored in Redis
 */
export interface OAuthSession {
  state: string
  codeVerifier: string
  identityKey: string
  createdAt: number
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  status: 'error'
  message: string
  requestId?: string
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  status: 'success'
  data: T
  requestId?: string
}
