import { cn } from '@/lib/utils'

export function SkeletonTable({
  rows = 5,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="mb-4 flex gap-4">
        <div className="h-8 flex-1 rounded bg-muted" />
        <div className="h-8 flex-1 rounded bg-muted" />
        <div className="h-8 flex-1 rounded bg-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border py-3">
          <div className="h-4 flex-1 rounded bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
