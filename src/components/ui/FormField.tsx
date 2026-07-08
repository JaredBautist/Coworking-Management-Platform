import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from './Label'

interface FormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

/**
 * Composes label + control + inline error/hint. Unifies the label+input+error
 * pattern that was duplicated (with inconsistent colors) across forms.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
