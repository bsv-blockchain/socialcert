import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { toast } from 'sonner'
import { getAuthFetch } from '@/lib/wallet'
import { getApiBaseUrl } from '@/lib/constants'
import { motion } from 'framer-motion'

export default function XVerification() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { handleSignIn() }, [])

  const handleSignIn = async () => {
    setIsSubmitting(true)
    try {
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
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5 sm:p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 mx-auto mb-6">
                {isSubmitting ? <Loader2 className="h-7 w-7 animate-spin" /> : <XLogo className="h-7 w-7" />}
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {isSubmitting ? 'Redirecting to X...' : 'Verify your X account'}
              </h2>
              <p className="text-sm text-text-secondary">
                {isSubmitting
                  ? 'You\'ll be sent to X to authorize access.'
                  : 'Connect your X account to your blockchain identity.'}
              </p>
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
