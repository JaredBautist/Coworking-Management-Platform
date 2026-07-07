import { cn } from '@/lib/utils'

export function SkeletonCalendar({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="mb-4 flex gap-2">
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}
