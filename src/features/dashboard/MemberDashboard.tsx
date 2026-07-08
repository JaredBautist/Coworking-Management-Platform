import { useI18n } from '@/lib/i18n'
import { useMyReservations } from '@/features/reservations/hooks'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CalendarClock, Search } from 'lucide-react'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import {
  Card,
  CardContent,
  Button,
  Input,
  EmptyState,
  buttonVariants,
} from '@/components/ui'

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
    <div className="space-y-8">
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {t('dashboard.quickSearch')}
          </h2>
          <form onSubmit={handleQuickSearch} className="flex gap-3">
            <Input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit">
              <Search className="h-4 w-4" />
              {t('common.search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t('dashboard.upcomingReservations')}
          </h2>
          <Link
            to="/app/calendar"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
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
          <EmptyState
            icon={CalendarClock}
            title={t('dashboard.noUpcomingReservations')}
            description={t('dashboard.upcomingHint')}
            action={
              <Link
                to="/app/reservations/search"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('dashboard.searchAvailableSpaces')}
              </Link>
            }
          />
        )}

        {!isLoading && upcoming.length > 0 && (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <Card key={r.id} interactive>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {r.space?.name ?? 'Space'}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
