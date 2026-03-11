import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

interface WalletPromptProps {
  open: boolean
  onClose: () => void
}

export function WalletPrompt({ open, onClose }: WalletPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">BRC-100 Wallet Required</DialogTitle>
          <DialogDescription className="text-center">
            SocialCert requires a BRC-100 compatible wallet to verify your identity
            and manage certificates. Please install a compatible wallet extension
            to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button onClick={onClose}>I understand</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
