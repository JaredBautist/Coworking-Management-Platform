import { cn } from '@/lib/utils'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-border bg-surface p-4',
        className
      )}
    >
      <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
      <div className="mb-2 h-8 w-1/2 rounded bg-muted" />
      <div className="h-3 w-1/4 rounded bg-muted" />
    </div>
  )
}
