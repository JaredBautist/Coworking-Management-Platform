import { useI18n } from '@/lib/i18n'
import { useMyReservations } from '@/features/reservations/hooks'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { SkeletonCard } from '@/components/shared/SkeletonCard'

export function MemberDashboard() {
  const { t } = useI18n()
  const { data: reservations, isLoading } = useMyReservations()
  const navigate = useNavigate()
  const [quickDate, setQuickDate] = useState('')

  const now = new Date().toISOString()
  const upcoming =
    reservations
      ?.filter((r) => r.status === 'confirmed' && r.start_time > now)
      .slice(0, 5) ?? []

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickDate) {
      navigate(`/app/reservations/search`)
    }
  }

  return (
    <div>
      <div className="mb-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t('dashboard.quickSearch')}
        </h2>
        <form onSubmit={handleQuickSearch} className="flex gap-3">
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            className="block rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t('common.search')}
          </button>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('dashboard.upcomingReservations')}</h2>
        <Link
          to="/app/calendar"
          className="text-sm text-primary hover:underline"
        >
          {t('dashboard.viewCalendar')}
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && upcoming.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted-foreground">{t('dashboard.noUpcomingReservations')}</p>
          <Link
            to="/app/reservations/search"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            {t('dashboard.searchAvailableSpaces')}
          </Link>
        </div>
      )}

      {!isLoading &&
        upcoming.map((r) => (
          <div
            key={r.id}
            className="mb-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">
                  {r.space?.name ?? 'Espacio'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(r.start_time).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  ·{' '}
                  {new Date(r.start_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(r.end_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
