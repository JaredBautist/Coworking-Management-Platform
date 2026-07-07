import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ReservationSearchSchema,
  type ReservationSearchValues,
} from './schemas'
import { useAvailableSpaces, useCreateReservation } from './hooks'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import type { Space } from '@/types'

export default function SearchPage() {
  const { t } = useI18n()
  const addToast = useUIStore((s) => s.addToast)
  const [searchParams, setSearchParams] =
    useState<ReservationSearchValues | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReservationSearchValues>({
    resolver: zodResolver(ReservationSearchSchema),
  })

  const { data: availableSpaces, isLoading } = useAvailableSpaces(searchParams)

  const onSubmit = (data: ReservationSearchValues) => {
    setSelectedSpace(null)
    setSearchParams(data)
  }

  const handleConfirm = async () => {
    if (!selectedSpace || !searchParams) return
    setIsCreating(true)

    try {
      await createReservation.mutateAsync({
        spaceId: selectedSpace.id,
        date: searchParams.date,
        startTime: searchParams.start_time,
        endTime: searchParams.end_time,
      })
      addToast({ type: 'success', message: t('search.bookingSuccess') })
      setSelectedSpace(null)
      setSearchParams(null)
    } catch (err) {
      if (err instanceof Error && err.message === 'El espacio ya no está disponible') {
        addToast({ type: 'error', message: t('search.spaceUnavailable') })
        setSelectedSpace(null)
      } else {
        addToast({ type: 'error', message: t('search.bookingError') })
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('search.title')}</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 rounded-lg border border-border bg-surface p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t('search.date')}
            </label>
            <input
              type="date"
              {...register('date')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-destructive">
                {errors.date.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t('search.startTime')}
            </label>
            <input
              type="time"
              {...register('start_time')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.start_time && (
              <p className="mt-1 text-xs text-destructive">
                {errors.start_time.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t('search.endTime')}
            </label>
            <input
              type="time"
              {...register('end_time')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.end_time && (
              <p className="mt-1 text-xs text-destructive">
                {errors.end_time.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t('search.spaceType')}
            </label>
            <select
              {...register('space_type')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('search.allTypes')}</option>
              <option value="desk">{t('spaceType.desk')}</option>
              <option value="meeting_room">{t('spaceType.meeting_room')}</option>
              <option value="phone_booth">{t('spaceType.phone_booth')}</option>
              <option value="event_space">{t('spaceType.event_space')}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t('search.submit')}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && searchParams && availableSpaces?.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted-foreground">
            {t('search.noResults')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('search.noResultsHint')}
          </p>
        </div>
      )}

      {!isLoading && availableSpaces && availableSpaces.length > 0 && !selectedSpace && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableSpaces.map((space) => (
            <div
              key={space.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <h3 className="font-medium">{space.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`spaceType.${space.type}` as const) ?? space.type}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('common.capacity')}: {space.capacity}
              </p>
              <button
                onClick={() => setSelectedSpace(space)}
                className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {t('search.book')}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedSpace && searchParams && (
        <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('search.confirmTitle')}</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('calendar.space')}:</span>{' '}
              {selectedSpace.name}
            </p>
            <p>
              <span className="text-muted-foreground">{t('calendar.type')}:</span>{' '}
              {t(`spaceType.${selectedSpace.type}` as const) ?? selectedSpace.type}
            </p>
            <p>
              <span className="text-muted-foreground">{t('search.date')}:</span>{' '}
              {searchParams.date}
            </p>
            <p>
              <span className="text-muted-foreground">{t('search.startTime')}:</span>{' '}
              {searchParams.start_time}
            </p>
            <p>
              <span className="text-muted-foreground">{t('search.endTime')}:</span>{' '}
              {searchParams.end_time}
            </p>
            <p>
              <span className="text-muted-foreground">{t('common.capacity')}:</span>{' '}
              {selectedSpace.capacity} {t('common.persons')}
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setSelectedSpace(null)}
              disabled={isCreating}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {t('common.back')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isCreating}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreating ? t('search.confirming') : t('search.confirmSubmit')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
