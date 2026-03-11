import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface CodeInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export function CodeInput({ length = 6, onComplete, disabled = false }: CodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newValues = [...values]
    newValues[index] = value.slice(-1)
    setValues(newValues)

    if (value && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }

    const code = newValues.join('')
    if (code.length === length && !newValues.includes('')) {
      onComplete(code)
    }
  }, [values, length, onComplete])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }, [values])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const newValues = Array(length).fill('')
    pasted.split('').forEach((char, i) => { newValues[i] = char })
    setValues(newValues)
    if (pasted.length === length) {
      onComplete(pasted)
    } else {
      inputs.current[pasted.length]?.focus()
    }
  }, [length, onComplete])

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className={cn(
            'h-14 w-12 rounded-lg border-2 border-border bg-white text-center text-2xl font-semibold text-text-primary',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value && 'border-primary/30'
          )}
        />
      ))}
    </div>
  )
}
