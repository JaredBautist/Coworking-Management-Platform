import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Table = forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
    <div className="overflow-x-auto">
      <table ref={ref} className={cn('w-full text-sm', className)} {...props} />
    </div>
  </div>
))
Table.displayName = 'Table'

export const THead = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-muted/60', className)} {...props} />
))
THead.displayName = 'THead'

export const TBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
))
TBody.displayName = 'TBody'

export const TR = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }
>(({ className, hoverable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border last:border-0',
      hoverable && 'transition-colors hover:bg-muted/40',
      className
    )}
    {...props}
  />
))
TR.displayName = 'TR'

export const TH = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground',
      className
    )}
    {...props}
  />
))
TH.displayName = 'TH'

export const TD = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3 text-foreground', className)} {...props} />
))
TD.displayName = 'TD'
