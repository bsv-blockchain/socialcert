import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ComponentType, type SVGProps } from 'react'
import { Phone, Trash2, Loader2, Globe, Lock } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import { type CertificateInfo } from '@/hooks/useCertificates'
import { CERTIFICATE_TYPES } from '@/lib/constants'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const typeIcons: Record<string, ComponentType<SVGProps<SVGSVGElement> & { className?: string }>> = {
  [CERTIFICATE_TYPES.google]: GoogleLogo,
  [CERTIFICATE_TYPES.phone]: Phone,
  [CERTIFICATE_TYPES.x]: XLogo,
}

interface CertificateCardProps {
  certificate: CertificateInfo
  onDelete: (cert: CertificateInfo) => Promise<void>
  onTogglePublic: (cert: CertificateInfo) => Promise<void>
}

export function CertificateCard({ certificate, onDelete, onTogglePublic }: CertificateCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPublic, setIsTogglingPublic] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const Icon = typeIcons[certificate.type] || Mail

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    try {
      await onDelete(certificate)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true)
    try {
      await onTogglePublic(certificate)
    } finally {
      setIsTogglingPublic(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          {/* Top row: avatar/icon + details */}
          <div className="flex items-center gap-4">
            {certificate.fields.profilePhoto ? (
              <img
                src={certificate.fields.profilePhoto}
                alt={certificate.displayValue}
                className="h-11 w-11 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary">{certificate.typeLabel} Certificate</p>
                {certificate.isPublic ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Public
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Private
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{certificate.displayValue}</p>
            </div>
          </div>

          {/* Bottom row: actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublic}
              disabled={isTogglingPublic || isDeleting}
              className="flex-1"
            >
              {isTogglingPublic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : certificate.isPublic ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              {certificate.isPublic ? 'Make Private' : 'Make Public'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting || isTogglingPublic}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certificate</DialogTitle>
            <DialogDescription>
              {certificate.isPublic
                ? `Your public ${certificate.typeLabel.toLowerCase()} attestation will be revoked and the certificate deleted from your wallet.`
                : `This certificate will be deleted from your wallet.`}{' '}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
