import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VerificationCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  accentColor?: string
}

export function VerificationCard({ icon: Icon, title, description, href, accentColor }: VerificationCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className={cn(
          'flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
          accentColor || 'bg-primary/10 text-primary'
        )}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
        <Button onClick={() => navigate(href)} className="mt-2 w-full">
          Get Started
        </Button>
      </CardContent>
    </Card>
  )
}
