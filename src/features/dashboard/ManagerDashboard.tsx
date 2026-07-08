import { useI18n } from '@/lib/i18n'
import { useSpaces } from '@/features/spaces/hooks'
import { useOrgReservations } from '@/features/reservations/hooks'
import { Link } from 'react-router-dom'
import { SkeletonCard } from '@/components/shared/SkeletonCard'

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
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4" style={{ animationDelay: '0ms' }}>
          <p className="text-sm text-muted-foreground">{t('dashboard.activeSpaces')}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{activeSpaces}</p>
        </div>
        <div className="card p-4" style={{ animationDelay: '80ms' }}>
          <p className="text-sm text-muted-foreground">{t('dashboard.todayReservations')}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {todayReservations.length}
          </p>
        </div>
        <div className="card p-4" style={{ animationDelay: '160ms' }}>
          <p className="text-sm text-muted-foreground">{t('dashboard.occupancyToday')}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{occupancyRate}%</p>
        </div>
      </div>
      <div className="mt-6">
        <Link
          to="/app/reports"
          className="btn-ghost gap-2"
        >
          {t('dashboard.viewReports')}
        </Link>
      </div>
    </div>
  )
}
