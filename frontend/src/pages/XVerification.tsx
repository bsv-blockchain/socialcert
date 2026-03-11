import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Twitter, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthFetch } from '@/lib/wallet'
import { getApiBaseUrl } from '@/lib/constants'
import { useVerificationStore } from '@/stores/verification'
import { motion } from 'framer-motion'

export default function XVerification() {
  const navigate = useNavigate()
  const { shouldRevealPublicly, setShouldRevealPublicly } = useVerificationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignIn = async () => {
    setIsSubmitting(true)
    try {
      // Save reveal preference before redirect
      localStorage.setItem('shouldRevealPublicly', shouldRevealPublicly.toString())

      const authFetch = getAuthFetch()
      const res = await authFetch.fetch(`${getApiBaseUrl()}/api/verify/x/auth-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (data.status === 'success' && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error('Failed to initiate X verification')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect to X')
      setIsSubmitting(false)
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 mx-auto mb-6">
                <Twitter className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Verify your X account</h2>
              <p className="text-sm text-text-secondary mb-8">
                Connect your X (Twitter) account to your blockchain identity. You'll be redirected to X to authorize.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldRevealPublicly}
                      onChange={(e) => setShouldRevealPublicly(e.target.checked)}
                      className="rounded border-border"
                    />
                    Publicly reveal certificate
                  </label>
                </div>

                <Button onClick={handleSignIn} disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting to X...
                    </>
                  ) : (
                    <>
                      <Twitter className="h-4 w-4" />
                      Connect with X
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Go back
          </Button>
        </div>
      </div>
    </Shell>
  )
}
