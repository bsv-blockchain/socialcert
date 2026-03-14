import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthFetch } from '@/lib/wallet'
import { getApiBaseUrl } from '@/lib/constants'
import { motion } from 'framer-motion'

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function GoogleVerification() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { handleSignIn() }, [])

  const handleSignIn = async () => {
    setIsSubmitting(true)
    try {
      const authFetch = getAuthFetch()
      const res = await authFetch.fetch(`${getApiBaseUrl()}/api/verify/google/auth-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (data.status === 'success' && data.data.authUrl) {
        window.location.href = data.data.authUrl
      } else {
        toast.error('Failed to initiate Google verification')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect to Google')
      setIsSubmitting(false)
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5 sm:p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-border mx-auto mb-6">
                {isSubmitting ? <Loader2 className="h-7 w-7 animate-spin text-text-secondary" /> : <GoogleLogo className="h-7 w-7" />}
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {isSubmitting ? 'Redirecting to Google...' : 'Verify with Google'}
              </h2>
              <p className="text-sm text-text-secondary">
                {isSubmitting
                  ? "You'll be sent to Google to authorize access."
                  : 'Connect your Google account to your blockchain identity.'}
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
