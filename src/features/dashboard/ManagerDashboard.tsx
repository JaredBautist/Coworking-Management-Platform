import { type LucideIcon, Building2, CalendarCheck, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useSpaces } from '@/features/spaces/hooks'
import { useOrgReservations } from '@/features/reservations/hooks'
import { Link } from 'react-router-dom'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { Card, buttonVariants } from '@/components/ui'

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  )
}

export function ManagerDashboard() {
  const { t } = useI18n()
  const { data: spaces, isLoading: spacesLoading } = useSpaces()
  const { data: reservations, isLoading: resLoading } = useOrgReservations()

  const isLoading = spacesLoading || resLoading

  const today = new Date().toISOString().split('T')[0]
  const todayReservations =
    reservations?.filter(
      (r) =>
        r.status === 'confirmed' &&
        r.start_time.startsWith(today)
    ) ?? []

  const activeSpaces = spaces?.filter((s) => s.is_active).length ?? 0

  const totalHours = 12
  const dailyCapacityHours = activeSpaces * totalHours
  const totalReservedHours = todayReservations.reduce((acc, r) => {
    const start = new Date(r.start_time)
    const end = new Date(r.end_time)
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, 0)
  const occupancyRate =
    dailyCapacityHours > 0
      ? ((totalReservedHours / dailyCapacityHours) * 100).toFixed(1)
      : '0.0'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Building2}
          label={t('dashboard.activeSpaces')}
          value={activeSpaces}
          tone="bg-primary/10 text-primary"
        />
        <MetricCard
          icon={CalendarCheck}
          label={t('dashboard.todayReservations')}
          value={todayReservations.length}
          tone="bg-secondary/10 text-secondary"
        />
        <MetricCard
          icon={TrendingUp}
          label={t('dashboard.occupancyToday')}
          value={`${occupancyRate}%`}
          tone="bg-success/10 text-success"
        />
      </div>
      <div>
        <Link to="/app/reports" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          {t('dashboard.viewReports')}
        </Link>
      </div>
    </div>
  )
}
