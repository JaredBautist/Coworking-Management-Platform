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
      <div className="card mb-8 p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t('dashboard.quickSearch')}
        </h2>
        <form onSubmit={handleQuickSearch} className="flex gap-3">
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            className="input-field"
          />
          <button
            type="submit"
            className="btn-primary"
          >
            {t('common.search')}
          </button>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t('dashboard.upcomingReservations')}</h2>
        <Link
          to="/app/calendar"
          className="btn-ghost"
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
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">{t('dashboard.noUpcomingReservations')}</p>
          <Link
            to="/app/reservations/search"
            className="btn-ghost mt-2"
          >
            {t('dashboard.searchAvailableSpaces')}
          </Link>
        </div>
      )}

      {!isLoading &&
        upcoming.map((r) => (
          <div
            key={r.id}
            className="card mb-3 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground">
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
