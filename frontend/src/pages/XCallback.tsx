import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Twitter, Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { getWalletClient, getAuthFetch, getIdentityClient } from '@/lib/wallet'
import { getCertifierConfig, getApiBaseUrl, CERTIFICATE_TYPES } from '@/lib/constants'
import { motion } from 'framer-motion'

export default function XCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [userName, setUserName] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    async function process() {
      const success = searchParams.get('success')
      const error = searchParams.get('error')
      const uName = searchParams.get('userName')
      const profilePhoto = searchParams.get('profilePhoto')

      if (error) {
        toast.error('X verification failed')
        setStatus('error')
        return
      }

      if (success === 'true' && uName) {
        setUserName(uName)
        try {
          const wallet = getWalletClient()
          const { certifierPublicKey, certifierUrl } = getCertifierConfig()

          const newCert = await wallet.acquireCertificate({
            certifier: certifierPublicKey,
            certifierUrl,
            type: CERTIFICATE_TYPES.x,
            acquisitionProtocol: 'issuance',
            fields: {
              userName: uName,
              profilePhoto: profilePhoto || '',
            },
          })

          const shouldReveal = localStorage.getItem('shouldRevealPublicly') !== 'false'
          if (shouldReveal) {
            try {
              await getIdentityClient().publiclyRevealAttributes(newCert, ['userName', 'profilePhoto'])
            } catch {
              toast.warning('Certificate issued but public revelation failed')
            }
          }

          setStatus('success')
          toast.success('X account verified!')
        } catch (err: any) {
          console.error('Certificate acquisition failed:', err)
          toast.error('Failed to issue certificate')
          setStatus('error')
        }
      } else {
        setStatus('error')
      }
    }

    process()
  }, [searchParams])

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const authFetch = getAuthFetch()
      const res = await authFetch.fetch(`${getApiBaseUrl()}/api/x/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certType: 'x' }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        toast.success('Posted to X!')
        if (data.data.tweetUrl) window.open(data.data.tweetUrl, '_blank')
      } else {
        toast.error(data.message || 'Failed to share')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to share on X')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-6 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="p-8 text-center">
              {status === 'loading' && (
                <div className="py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-text-secondary">Processing your X verification...</p>
                </div>
              )}

              {status === 'success' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-4">
                    <Twitter className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">X Account Verified!</h2>
                  <p className="text-sm text-text-secondary mb-6">
                    @{userName} is now linked to your blockchain identity.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={handleShare} disabled={isSharing} variant="outline">
                      {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                      Share on X
                    </Button>
                    <Button onClick={() => navigate('/certificates')}>View Certificates</Button>
                    <Button variant="ghost" onClick={() => navigate('/')}>Verify Another</Button>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto mb-4">
                    <Twitter className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Verification Failed</h2>
                  <p className="text-sm text-text-secondary mb-6">
                    Something went wrong during X verification. Please try again.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => navigate('/verify/x')}>Try Again</Button>
                    <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Shell>
  )
}
