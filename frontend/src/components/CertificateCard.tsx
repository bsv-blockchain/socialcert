import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ComponentType, type SVGProps } from 'react'
import { Mail, Phone, Unlink, Loader2 } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { type CertificateInfo } from '@/hooks/useCertificates'
import { CERTIFICATE_TYPES } from '@/lib/constants'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const typeIcons: Record<string, ComponentType<SVGProps<SVGSVGElement> & { className?: string }>> = {
  [CERTIFICATE_TYPES.email]: Mail,
  [CERTIFICATE_TYPES.phone]: Phone,
  [CERTIFICATE_TYPES.x]: XLogo,
}

interface CertificateCardProps {
  certificate: CertificateInfo
  onUnlink: (cert: CertificateInfo) => Promise<void>
}

export function CertificateCard({ certificate, onUnlink }: CertificateCardProps) {
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const Icon = typeIcons[certificate.type] || Mail

  const handleUnlink = async () => {
    setIsUnlinking(true)
    setShowConfirm(false)
    try {
      await onUnlink(certificate)
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary">{certificate.typeLabel} Certificate</p>
                <Badge variant="success">Linked</Badge>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{certificate.displayValue}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={isUnlinking}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {isUnlinking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlink className="h-3.5 w-3.5" />
            )}
            Unlink
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Certificate</DialogTitle>
            <DialogDescription>
              This will remove your publicly revealed {certificate.typeLabel.toLowerCase()} identity
              and delete the certificate from your wallet. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleUnlink}>Unlink Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
