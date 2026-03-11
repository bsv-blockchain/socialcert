import { useState, useCallback } from 'react'
import { getWalletClient, getIdentityClient } from '@/lib/wallet'
import { getCertifierConfig, CERTIFICATE_TYPES, CERT_TYPE_LABELS, CERT_TYPE_FIELDS } from '@/lib/constants'
import { toast } from 'sonner'

export interface CertificateInfo {
  type: string
  typeLabel: string
  serialNumber: string
  fields: Record<string, string>
  displayValue: string
  certifier: string
  raw: any
}

export function useCertificates() {
  const [certificates, setCertificates] = useState<CertificateInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadCertificates = useCallback(async () => {
    setIsLoading(true)
    try {
      const wallet = getWalletClient()
      const { certifierPublicKey } = getCertifierConfig()

      const certTypes = Object.values(CERTIFICATE_TYPES)
      const allCerts: CertificateInfo[] = []

      for (const certType of certTypes) {
        try {
          const result = await wallet.listCertificates({
            certifiers: [certifierPublicKey],
            types: [certType],
          })
          for (const cert of result.certificates) {
            const typeLabel = CERT_TYPE_LABELS[cert.type] || 'Unknown'
            const fields = cert.fields || {}
            let displayValue = ''
            if (fields.email) displayValue = fields.email
            else if (fields.phoneNumber) displayValue = fields.phoneNumber
            else if (fields.userName) displayValue = `@${fields.userName}`

            allCerts.push({
              type: cert.type,
              typeLabel,
              serialNumber: cert.serialNumber,
              fields,
              displayValue,
              certifier: cert.certifier,
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

  const unlinkCertificate = useCallback(async (cert: CertificateInfo) => {
    try {
      const identityClient = getIdentityClient()
      const wallet = getWalletClient()

      // Step 1: Revoke the public revelation from the overlay
      toast.info('Revoking public revelation...')
      const fieldNames = CERT_TYPE_FIELDS[cert.type] || Object.keys(cert.fields)
      await identityClient.revokeCertificateRevelation(cert.raw, fieldNames)

      // Step 2: Relinquish the certificate from the wallet
      toast.info('Removing certificate from wallet...')
      await wallet.relinquishCertificate({
        type: cert.type,
        serialNumber: cert.serialNumber,
        certifier: cert.certifier,
      })

      toast.success('Certificate unlinked successfully')

      // Refresh the list
      await loadCertificates()
    } catch (err: any) {
      console.error('Failed to unlink certificate:', err)
      toast.error(err.message || 'Failed to unlink certificate')
    }
  }, [loadCertificates])

  return { certificates, isLoading, loadCertificates, unlinkCertificate }
}
