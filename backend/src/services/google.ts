import { OAuth2Client } from 'google-auth-library'
import { config } from '../config'
import { logger } from '../utils/logger'
import { storeOAuthSession, consumeOAuthSession } from './redis'
import crypto from 'crypto'

function getClient(): OAuth2Client {
  return new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI,
  )
}

/**
 * Generate a Google OAuth 2.0 authorization URL.
 */
export async function generateGoogleAuthUrl(
  identityKey: string,
): Promise<{ url: string; state: string }> {
  const client = getClient()
  const state = crypto.randomBytes(16).toString('hex')

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  })

  await storeOAuthSession(state, { codeVerifier: '', identityKey })

  logger.info({ identityKey, state }, 'Google OAuth URL generated')
  return { url, state }
}

/**
 * Handle the Google OAuth 2.0 callback.
 * Returns the user's email, display name, profile photo, and identityKey.
 */
export async function handleGoogleCallback(
  code: string,
  state: string,
): Promise<{ email: string; name: string; profilePhoto: string; identityKey: string }> {
  const session = await consumeOAuthSession(state)
  if (!session) {
    throw Object.assign(new Error('Invalid or expired OAuth session'), { statusCode: 400 })
  }

  const client = getClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  // Fetch user info from Google's userinfo endpoint
  const res = await client.request<{
    email: string
    name: string
    picture: string
    email_verified: boolean
  }>({ url: 'https://www.googleapis.com/oauth2/v3/userinfo' })

  const { email, name, picture, email_verified } = res.data

  if (!email_verified) {
    throw Object.assign(new Error('Google email is not verified'), { statusCode: 400 })
  }

  logger.info({ identityKey: session.identityKey, email }, 'Google verification successful')

  return {
    email,
    name: name || '',
    profilePhoto: picture || '',
    identityKey: session.identityKey,
  }
}
