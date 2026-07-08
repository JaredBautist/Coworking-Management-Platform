import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 ease-out focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        invalid
          ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
          : 'border-input focus:border-primary/50 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
