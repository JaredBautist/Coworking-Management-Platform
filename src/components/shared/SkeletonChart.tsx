import { cn } from '@/lib/utils'

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-border bg-surface p-4',
        className
      )}
    >
      <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
      <div className="h-[300px] rounded bg-muted" />
    </div>
  )
}
