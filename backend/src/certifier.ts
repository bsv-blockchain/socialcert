import { PrivateKey, PublicKey } from '@bsv/sdk'
import { config } from './config'
import { CertificateTypeDefinition } from './types'
import { emailCertificate, EMAIL_CERT_TYPE } from './certificates/emailcert'
import { phoneCertificate, PHONE_CERT_TYPE } from './certificates/phonecert'
import { xCertificate, X_CERT_TYPE } from './certificates/xcert'

// Derive the certifier's public key from the server private key
export const certifierPrivateKey = PrivateKey.fromString(config.SERVER_PRIVATE_KEY, 'hex')
export const certifierPublicKey = PublicKey.fromPrivateKey(certifierPrivateKey)
export const certifierPublicKeyHex = certifierPublicKey.toString()

/**
 * Registry of all certificate types this certifier can issue.
 * Keyed by the base64-encoded certificate type identifier.
 */
export const certificateTypes: Record<string, CertificateTypeDefinition> = {
  [EMAIL_CERT_TYPE]: emailCertificate,
  [PHONE_CERT_TYPE]: phoneCertificate,
  [X_CERT_TYPE]: xCertificate,
}
