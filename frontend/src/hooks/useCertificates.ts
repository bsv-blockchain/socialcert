import { useState, useCallback } from 'react'
import { getWalletClient } from '@/lib/wallet'
import { getCertifierConfig, CERTIFICATE_TYPES, CERT_TYPE_LABELS, CERT_TYPE_FIELDS } from '@/lib/constants'
import { toast } from 'sonner'
import { VerifiableCertificate } from '@bsv/sdk'
import {
  isCertificatePublic,
  publiclyRevealCertificate,
  revokeCertificateRevelation,
} from '@/lib/overlay'

export interface CertificateInfo {
  type: string
  typeLabel: string
  serialNumber: string
  fields: Record<string, string>
  displayValue: string
  certifier: string
  isPublic: boolean
  raw: any
}

export function useCertificates() {
  const [certificates, setCertificates] = useState<CertificateInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadCertificates = useCallback(async () => {
    setIsLoading(true)
    try {
      const wallet = getWalletClient()
      const { certifierPublicKey } = await getCertifierConfig()

      const certTypes = Object.values(CERTIFICATE_TYPES)
      const allCerts: CertificateInfo[] = []

      const { publicKey: myIdentityKey } = await wallet.getPublicKey({ identityKey: true })

      for (const certType of certTypes) {
        try {
          const result = await wallet.listCertificates({
            certifiers: [certifierPublicKey],
            types: [certType],
          })
          for (const cert of result.certificates) {
            const typeLabel = CERT_TYPE_LABELS[cert.type] || 'Unknown'
            const fieldNames = Object.keys(cert.fields || [])

            // Decrypt fields by proving to ourselves
            let fields: Record<string, string> = {}
            try {
              const { keyringForVerifier } = await wallet.proveCertificate({
                certificate: cert,
                fieldsToReveal: fieldNames,
                verifier: myIdentityKey,
              })
              const vc = VerifiableCertificate.fromCertificate(cert, keyringForVerifier)
              fields = await vc.decryptFields(wallet as any)
            } catch {
              fields = cert.fields || {}
            }

            let displayValue = ''
            if (fields.userName) displayValue = `@${fields.userName}`
            else if (fields.phoneNumber) displayValue = fields.phoneNumber
            else if (fields.email) displayValue = fields.email

            // Check the identity overlay for a live UTXO — if one exists, the cert is public
            const isPublic = await isCertificatePublic(cert.serialNumber)

            allCerts.push({
              type: cert.type,
              typeLabel,
              serialNumber: cert.serialNumber,
              fields,
              displayValue,
              certifier: cert.certifier,
              isPublic,
              raw: cert,
            })
          }
        } catch {
          // Certificate type may not have any issued certs
        }
      }

      setCertificates(allCerts)
    } catch (err) {
      console.error('Failed to load certificates:', err)
      toast.error('Failed to load certificates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteCertificate = useCallback(async (cert: CertificateInfo) => {
    const wallet = getWalletClient()

    if (cert.isPublic) {
      try {
        await revokeCertificateRevelation(cert.serialNumber)
      } catch (err: any) {
        const msg = err?.message || String(err)
        toast.error(`Failed to revoke public attestation: ${msg}`)
        throw err
      }
    }

    try {
      await wallet.relinquishCertificate({
        type: cert.type,
        serialNumber: cert.serialNumber,
        certifier: cert.certifier,
      })
    } catch (err: any) {
      const msg = err?.message || String(err)
      toast.error(`Failed to delete certificate: ${msg}`)
      throw err
    }

    await loadCertificates()
  }, [loadCertificates])

  const togglePublic = useCallback(async (cert: CertificateInfo) => {
    try {
      if (cert.isPublic) {
        await revokeCertificateRevelation(cert.serialNumber)
      } else {
        const fieldNames = CERT_TYPE_FIELDS[cert.type] || Object.keys(cert.fields)
        await publiclyRevealCertificate(cert.raw, fieldNames)
      }
    } catch (err: any) {
      const msg = err?.message || String(err)
      toast.error(`Failed to ${cert.isPublic ? 'revoke' : 'publish'} certificate: ${msg}`)
      throw err
    }

    await loadCertificates()
  }, [loadCertificates])

  return { certificates, isLoading, loadCertificates, deleteCertificate, togglePublic }
}
