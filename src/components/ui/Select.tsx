import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

/**
 * Styled native <select>. Kept native (not Radix) so existing
 * react-hook-form `register` / value / onChange wiring keeps working unchanged.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'block w-full appearance-none rounded-lg border bg-surface px-3 py-2 pr-9 text-sm text-foreground transition-all duration-150 ease-out focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          invalid
            ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
            : 'border-input focus:border-primary/50 focus:ring-primary/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
)
Select.displayName = 'Select'
