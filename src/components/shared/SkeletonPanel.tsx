import { cn } from '@/lib/utils'

export function SkeletonPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-border bg-surface p-6',
        className
      )}
    >
      <div className="mb-4 h-5 w-1/2 rounded bg-muted" />
      <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  )
}
