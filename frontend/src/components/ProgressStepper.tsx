import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                  ? 'bg-primary text-white ring-4 ring-primary/20'
                  : 'bg-surface text-text-secondary border border-border'
            )}>
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={cn(
              'text-sm font-medium hidden sm:block',
              index <= currentStep ? 'text-text-primary' : 'text-text-secondary'
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'h-0.5 w-8 rounded-full transition-colors duration-300',
              index < currentStep ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
