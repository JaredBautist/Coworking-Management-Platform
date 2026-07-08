import { useState } from 'react'
import { useMyReservations, useCancelReservation } from './hooks'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { CalendarClock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddToCalendar } from '@/components/shared/AddToCalendar'
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  EmptyState,
} from '@/components/ui'

export default function ReservationsPage() {
  const { t } = useI18n()
  const { data: reservations, isLoading } = useMyReservations()
  const cancelReservation = useCancelReservation()
  const addToast = useUIStore((s) => s.addToast)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const now = new Date().toISOString()

  const upcoming =
    reservations?.filter(
      (r) => r.status === 'confirmed' && r.start_time > now
    ) ?? []

  const past =
    reservations?.filter(
      (r) => r.status === 'cancelled' || r.start_time <= now
    ) ?? []

  const handleCancel = async (id: string, startTime: string) => {
    if (startTime <= now) {
      addToast({
        type: 'error',
        message: t('reservations.cannotCancelPast'),
      })
      return
    }

    try {
      await cancelReservation.mutateAsync(id)
      addToast({ type: 'success', message: t('reservations.cancelSuccess') })
    } catch {
      addToast({ type: 'error', message: t('reservations.cancelError') })
    }
  }

  const currentList = tab === 'upcoming' ? upcoming : past

  const tabs: Array<{ key: 'upcoming' | 'past'; label: string; count: number }> = [
    { key: 'upcoming', label: t('reservations.upcoming'), count: upcoming.length },
    { key: 'past', label: t('reservations.past'), count: past.length },
  ]

  return (
    <div>
      <PageHeader title={t('reservations.myReservations')} />

      <div className="mb-5 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {tabs.map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === tItem.key
                ? 'bg-surface text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tItem.label} ({tItem.count})
          </button>
        ))}
      </div>

      {isLoading && <SkeletonTable rows={5} />}

      {!isLoading && currentList.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title={
            tab === 'upcoming'
              ? t('reservations.noUpcoming')
              : t('reservations.noPast')
          }
          description={tab === 'upcoming' ? t('reservations.upcomingHint') : undefined}
        />
      )}

      {!isLoading && currentList.length > 0 && (
        <div className="space-y-3">
          {currentList.map((reservation) => {
            const isFuture = reservation.start_time > now
            const isConfirmed = reservation.status === 'confirmed'
            const canCancel = isFuture && isConfirmed

            return (
              <Card key={reservation.id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {reservation.space?.name ?? t('reports.space')}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(reservation.start_time).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      ·{' '}
                      {new Date(reservation.start_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(reservation.end_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Badge
                      tone={reservation.status === 'confirmed' ? 'success' : 'neutral'}
                      className="mt-2"
                    >
                      {reservation.status === 'confirmed'
                        ? t('reservations.confirmed')
                        : t('reservations.cancelled')}
                    </Badge>
                    {isConfirmed && isFuture && (
                      <div className="mt-3">
                        <AddToCalendar
                          event={{
                            id: reservation.id,
                            title: reservation.space?.name ?? t('reports.space'),
                            start: reservation.start_time,
                            end: reservation.end_time,
                            details: reservation.summary,
                            location: reservation.space?.name,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {canCancel && (
                    <Button
                      variant="destructive-ghost"
                      size="sm"
                      onClick={() =>
                        handleCancel(reservation.id, reservation.start_time)
                      }
                      disabled={cancelReservation.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('reservations.cancel')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
