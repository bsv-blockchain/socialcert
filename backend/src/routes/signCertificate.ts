import { Router, Request, Response } from 'express'
import { Certificate, MasterCertificate, Utils, createNonce, verifyNonce, WalletError } from '@bsv/sdk'
import { certificateTypes, certifierPublicKeyHex } from '../certifier'
import { findVerification, writeSignedCertificate } from '../db/mongo'
import { logger } from '../utils/logger'

const router = Router()

/**
 * Sign a certificate after the user has verified their identity.
 * This is called by the BSV SDK's acquireCertificate flow.
 */
router.post(
  '/api/sign-certificate',
  async (req: Request, res: Response) => {
    try {
      const { clientNonce, type, fields, masterKeyring } = req.body
      const identityKey = req.auth?.identityKey

      // Validate required arguments
      if (!identityKey) {
        res.status(401).json({ status: 'error', message: 'Authentication required' })
        return
      }
      if (!clientNonce) {
        res.status(400).json({ status: 'error', message: 'Missing client nonce!' })
        return
      }
      if (!type) {
        res.status(400).json({ status: 'error', message: 'Missing certificate type!' })
        return
      }
      if (!fields) {
        res.status(400).json({ status: 'error', message: 'Missing certificate fields to sign!' })
        return
      }
      if (!masterKeyring) {
        res.status(400).json({ status: 'error', message: 'Missing masterKeyring to decrypt fields!' })
        return
      }

      // Verify the certificate type is supported
      const certType = certificateTypes[type]
      if (!certType) {
        res.status(400).json({ status: 'error', message: `Unsupported certificate type: ${type}` })
        return
      }

      // Import server from global context (set during startup)
      const { getServerWallet } = await import('../server')
      const wallet = getServerWallet()

      // Verify the client nonce
      await verifyNonce(clientNonce, wallet, identityKey)

      // Create a server nonce
      const serverNonce = await createNonce(wallet, identityKey)

      // Compute the serial number as an HMAC
      const hmacResult = await wallet.createHmac({
        data: Utils.toArray(clientNonce + serverNonce, 'utf8'),
        protocolID: [2, 'certificate issuance'],
        keyID: serverNonce + clientNonce,
        counterparty: identityKey,
      })
      const serialNumber = Utils.toBase64(hmacResult.hmac)

      // Decrypt the submitted fields using the static method
      const decryptedFields = await MasterCertificate.decryptFields(
        wallet,
        masterKeyring,
        fields,
        identityKey
      )

      // Validate the decrypted fields match expected cert type fields
      const expectedFields = certType.fields
      const actualFields = Object.keys(decryptedFields)
      for (const field of expectedFields) {
        if (!actualFields.includes(field)) {
          res.status(400).json({ status: 'error', message: `Missing required field: ${field}` })
          return
        }
      }

      // Check that a matching verification exists in MongoDB
      const verification = await findVerification(identityKey, decryptedFields)
      if (!verification) {
        res.status(400).json({
          status: 'error',
          message: 'No matching verification found. Please verify your identity first.',
        })
        return
      }

      // Use MasterCertificate.issueCertificateForSubject for proper certificate issuance
      const masterCertificate = await MasterCertificate.issueCertificateForSubject(
        wallet,
        identityKey,
        decryptedFields,
        type
      )

      // Store the signed certificate
      await writeSignedCertificate(
        identityKey,
        masterCertificate.serialNumber,
        masterCertificate as unknown as Record<string, unknown>
      )

      logger.info({ identityKey, type, serialNumber: masterCertificate.serialNumber }, 'Certificate signed and issued')

      res.json(masterCertificate)
    } catch (err: any) {
      logger.error({ err }, 'Certificate signing failed')
      const statusCode = err.code && typeof err.code === 'number' ? err.code : 500
      res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Certificate signing failed',
        requestId: req.requestId,
      })
    }
  }
)

export default router
