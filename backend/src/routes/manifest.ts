import { Router, Request, Response } from 'express'
import { certifierPublicKeyHex } from '../certifier'
import { config } from '../config'

const router = Router()

/**
 * BRC-0068: Publish trust anchor details at /manifest.json
 * Allows users to add this service as a Trust Certifier by entering the domain name.
 *
 * @see https://bsv.brc.dev/peer-to-peer/0068
 */
router.get('/manifest.json', (_req: Request, res: Response) => {
  const iconUrl = `${config.HOSTING_DOMAIN}/icon.png`

  res.json({
    name: 'SocialCert',
    metanet: {
      trust: {
        name: 'SocialCert',
        note: 'Certifies email, phone, and X account ownership',
        icon: iconUrl,
        publicKey: certifierPublicKeyHex,
      },
    },
  })
})

export default router
