import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { CertificateCard } from '@/components/CertificateCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollText, Plus, Loader2, Globe, Lock, Trash2 } from 'lucide-react'
import { useCertificates } from '@/hooks/useCertificates'
import { motion } from 'framer-motion'

export default function Certificates() {
  const navigate = useNavigate()
  const { certificates, isLoading, loadCertificates, deleteCertificate, togglePublic } = useCertificates()

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">My Certificates</h1>
              <p className="text-sm text-text-secondary mt-1">Manage your verified identity certificates</p>
            </div>
            <Button onClick={() => navigate('/')} size="sm">
              <Plus className="h-4 w-4" /> New Verification
            </Button>
          </div>

          {/* Visibility controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <Globe className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-text-primary mb-0.5">Make it public</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Apps across the BSV ecosystem show your name instead of a raw key.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 mb-2">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-text-primary mb-0.5">Keep it private</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Stays in your wallet. Only visible to people you share it with directly.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 mb-2">
                <Trash2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-text-primary mb-0.5">Change your mind</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Unpublish anytime, or delete entirely — removed from your wallet and the network.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-text-secondary mb-4">
                  <ScrollText className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">No certificates yet</h3>
                <p className="text-sm text-text-secondary mb-6">Verify your identity to get started</p>
                <Button onClick={() => navigate('/')}>Start Verification</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <motion.div
                  key={cert.serialNumber}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CertificateCard certificate={cert} onDelete={deleteCertificate} onTogglePublic={togglePublic} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Shell>
  )
}
