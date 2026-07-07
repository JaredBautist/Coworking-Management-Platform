import { useState } from 'react'
import { useMyReservations, useCancelReservation } from './hooks'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('reservations.myReservations')}</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'upcoming'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t('reservations.upcoming')} ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'past'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t('reservations.past')} ({past.length})
        </button>
      </div>

      {isLoading && <SkeletonTable rows={5} />}

      {!isLoading && currentList.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted-foreground">
            {tab === 'upcoming'
              ? t('reservations.noUpcoming')
              : t('reservations.noPast')}
          </p>
        </div>
      )}

      {!isLoading &&
        currentList.map((reservation) => {
          const isFuture = reservation.start_time > now
          const isConfirmed = reservation.status === 'confirmed'
          const canCancel = isFuture && isConfirmed

          return (
            <div
              key={reservation.id}
              className="mb-3 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {reservation.space?.name ?? t('reports.space')}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(reservation.start_time).toLocaleDateString(
                      'es-ES',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}{' '}
                    ·{' '}
                    {new Date(reservation.start_time).toLocaleTimeString(
                      'es-ES',
                      { hour: '2-digit', minute: '2-digit' }
                    )}{' '}
                    -{' '}
                    {new Date(reservation.end_time).toLocaleTimeString(
                      'es-ES',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      reservation.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {reservation.status === 'confirmed'
                      ? t('reservations.confirmed')
                      : t('reservations.cancelled')}
                  </span>
                </div>
                {canCancel && (
                  <button
                    onClick={() =>
                      handleCancel(reservation.id, reservation.start_time)
                    }
                    disabled={cancelReservation.isPending}
                    className="rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    {t('reservations.cancel')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}
