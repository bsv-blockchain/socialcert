import Twilio from 'twilio'
import { config } from '../config'
import { logger } from '../utils/logger'

const client = Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
const serviceSid = config.TWILIO_SERVICE_SID

/**
 * Retry wrapper with exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 500
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      if (attempt === maxAttempts) throw err
      const delay = baseDelay * Math.pow(2, attempt - 1)
      logger.warn(
        { attempt, maxAttempts, delay, error: err.message },
        'Twilio call failed, retrying...'
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}

/**
 * Send a verification code to an email address via Twilio Verify.
 */
export async function sendEmailVerification(email: string): Promise<{ sent: boolean; to: string }> {
  const verification = await withRetry(() =>
    client.verify.v2.services(serviceSid).verifications.create({
      to: email,
      channel: 'email',
    })
  )
  logger.info({ to: email, status: verification.status }, 'Email verification sent')
  return { sent: verification.status === 'pending', to: email }
}

/**
 * Check an email verification code via Twilio Verify.
 */
export async function checkEmailVerification(
  email: string,
  code: string
): Promise<{ verified: boolean }> {
  const check = await withRetry(() =>
    client.verify.v2.services(serviceSid).verificationChecks.create({
      to: email,
      code,
    })
  )
  logger.info({ to: email, status: check.status }, 'Email verification checked')
  return { verified: check.status === 'approved' }
}

/**
 * Send a verification code to a phone number via Twilio Verify (SMS).
 */
export async function sendPhoneVerification(phoneNumber: string): Promise<{ sent: boolean; to: string }> {
  const verification = await withRetry(() =>
    client.verify.v2.services(serviceSid).verifications.create({
      to: phoneNumber,
      channel: 'sms',
    })
  )
  logger.info({ to: phoneNumber, status: verification.status }, 'Phone verification sent')
  return { sent: verification.status === 'pending', to: phoneNumber }
}

/**
 * Check a phone verification code via Twilio Verify.
 */
export async function checkPhoneVerification(
  phoneNumber: string,
  code: string
): Promise<{ verified: boolean }> {
  const check = await withRetry(() =>
    client.verify.v2.services(serviceSid).verificationChecks.create({
      to: phoneNumber,
      code,
    })
  )
  logger.info({ to: phoneNumber, status: check.status }, 'Phone verification checked')
  return { verified: check.status === 'approved' }
}
