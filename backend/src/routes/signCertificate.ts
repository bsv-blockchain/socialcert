import { Router, Response } from 'express'
import { Certificate, MasterCertificate, Utils, WERR } from '@bsv/sdk'
import { AuthRequest } from '../types'
import { certificateTypes, certifierPublicKeyHex } from '../certifier'
import { findVerification, writeSignedCertificate } from '../db/mongo'
import { logger } from '../utils/logger'

const { verifyNonce, createNonce } = Utils

const router = Router()

/**
 * Sign a certificate after the user has verified their identity.
 * This is called by the BSV SDK's acquireCertificate flow.
 */
router.post(
  '/api/sign-certificate',
  async (req: AuthRequest, res: Response) => {
    try {
      const { clientNonce, type, fields, masterKeyring } = req.body
      const identityKey = req.auth.identityKey

      // Validate required arguments
      if (!clientNonce) throw new WERR('Missing client nonce!', 'ERR_INVALID_PARAMETER', 400)
      if (!type) throw new WERR('Missing certificate type!', 'ERR_INVALID_PARAMETER', 400)
      if (!fields) throw new WERR('Missing certificate fields to sign!', 'ERR_INVALID_PARAMETER', 400)
      if (!masterKeyring) throw new WERR('Missing masterKeyring to decrypt fields!', 'ERR_INVALID_PARAMETER', 400)

      // Verify the certificate type is supported
      const certType = certificateTypes[type]
      if (!certType) {
        throw new WERR(`Unsupported certificate type: ${type}`, 'ERR_INVALID_PARAMETER', 400)
      }

      // Import server from global context (set during startup)
      const { getServerWallet } = await import('../server')
      const wallet = getServerWallet()

      // Verify the client nonce
      await verifyNonce(clientNonce, wallet, identityKey)

      // Create a server nonce
      const serverNonce = await createNonce(wallet, identityKey)

      // Compute the serial number as an HMAC
      const serialNumber = Utils.toBase64(
        await wallet.createHmac({
          data: Utils.toArray(clientNonce + serverNonce, 'utf8'),
          protocolID: [2, 'certificate issuance'],
          keyID: serverNonce + clientNonce,
          counterparty: identityKey,
        })
      )

      // Decrypt the submitted fields
      const masterCert = new MasterCertificate(
        '1',          // version
        serialNumber,
        type,
        identityKey,  // subject
        certifierPublicKeyHex,
        fields,
        masterKeyring
      )
      const decryptedFields = await MasterCertificate.decryptFields(wallet, masterCert, identityKey)

      // Validate the decrypted fields match expected cert type fields
      const expectedFields = certType.fields
      const actualFields = Object.keys(decryptedFields)
      for (const field of expectedFields) {
        if (!actualFields.includes(field)) {
          throw new WERR(`Missing required field: ${field}`, 'ERR_INVALID_PARAMETER', 400)
        }
      }

      // Check that a matching verification exists in MongoDB
      const verification = await findVerification(identityKey, decryptedFields)
      if (!verification) {
        throw new WERR(
          'No matching verification found. Please verify your identity first.',
          'ERR_VERIFICATION_NOT_FOUND',
          400
        )
      }

      // Use a dummy revocation outpoint (no on-chain revocation)
      const revocationOutpoint =
        '0000000000000000000000000000000000000000000000000000000000000000.0'

      // Create and sign the certificate
      const certificate = new Certificate(
        type,
        serialNumber,
        identityKey,
        certifierPublicKeyHex,
        revocationOutpoint,
        fields
      )
      const signedCertificate = await certificate.sign(wallet)

      // Store the signed certificate
      await writeSignedCertificate(
        identityKey,
        serialNumber,
        signedCertificate as unknown as Record<string, unknown>
      )

      logger.info({ identityKey, type, serialNumber }, 'Certificate signed and issued')

      res.json(signedCertificate)
    } catch (err: any) {
      logger.error({ err }, 'Certificate signing failed')
      const statusCode = err.statusCode || err.code || 500
      res.status(typeof statusCode === 'number' ? statusCode : 500).json({
        status: 'error',
        message: err.message || 'Certificate signing failed',
        requestId: req.requestId,
      })
    }
  }
)

export default router
