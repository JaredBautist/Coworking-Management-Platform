import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  SearchFilterSchema,
  type SearchFilterValues,
  type ReservationSearchValues,
} from './schemas'
import {
  useAvailableSpaces,
  useCreateReservation,
  useAlternativeSlots,
  useSearchReservations,
  type AlternativeSlot,
} from './hooks'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { Search as SearchIcon, CalendarClock } from 'lucide-react'
import type { Space } from '@/types'
import {
  PageHeader,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Button,
  Badge,
  EmptyState,
} from '@/components/ui'

export default function SearchPage() {
  const { t } = useI18n()
  const addToast = useUIStore((s) => s.addToast)
  const [searchParams, setSearchParams] = useState<SearchFilterValues | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const createReservation = useCreateReservation()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SearchFilterValues>({
    resolver: zodResolver(SearchFilterSchema),
    defaultValues: { date: '', start_time: '', end_time: '', space_type: '' },
  })

  // Coordination view: all bookings across companies, filtered by date/type
  // only when provided. With no filters, Search brings everything.
  const searchQuery = searchParams
    ? { date: searchParams.date || undefined, spaceType: searchParams.space_type || undefined }
    : null
  const { data: dayReservations, isLoading: dayLoading } =
    useSearchReservations(searchQuery)

  // Booking flow only when a concrete date + time window is given.
  const hasWindow = !!(
    searchParams?.date &&
    searchParams?.start_time &&
    searchParams?.end_time
  )
  const availableParams: ReservationSearchValues | null =
    hasWindow && searchParams
      ? {
          date: searchParams.date,
          start_time: searchParams.start_time,
          end_time: searchParams.end_time,
          space_type: searchParams.space_type || undefined,
        }
      : null

  const { data: availableSpaces, isLoading: availLoading } =
    useAvailableSpaces(availableParams)

  const noAvailable =
    hasWindow && !availLoading && availableSpaces?.length === 0
  const { data: alternatives } = useAlternativeSlots(availableParams, !!noAvailable)

  const onSubmit = (data: SearchFilterValues) => {
    setSelectedSpace(null)
    setSearchParams(data)
  }

  const applyAlternative = (slot: AlternativeSlot) => {
    setValue('date', slot.date)
    setValue('start_time', slot.start_time)
    setValue('end_time', slot.end_time)
    setSelectedSpace(null)
    setSearchParams((prev) => ({ ...(prev ?? {}), ...slot } as SearchFilterValues))
  }

  const handleConfirm = async () => {
    if (!selectedSpace || !searchParams?.start_time || !searchParams?.end_time) return
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

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <PageHeader title={t('search.title')} />

      <Card className="mb-8">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField label={t('search.date')} error={errors.date?.message}>
                <Input type="date" invalid={!!errors.date} {...register('date')} />
              </FormField>
              <FormField label={t('search.startTime')} error={errors.start_time?.message}>
                <Input type="time" invalid={!!errors.start_time} {...register('start_time')} />
              </FormField>
              <FormField label={t('search.endTime')} error={errors.end_time?.message}>
                <Input type="time" invalid={!!errors.end_time} {...register('end_time')} />
              </FormField>
              <FormField label={t('search.spaceType')}>
                <Select {...register('space_type')}>
                  <option value="">{t('search.allTypes')}</option>
                  <option value="desk">{t('spaceType.desk')}</option>
                  <option value="meeting_room">{t('spaceType.meeting_room')}</option>
                  <option value="phone_booth">{t('spaceType.phone_booth')}</option>
                  <option value="event_space">{t('spaceType.event_space')}</option>
                </Select>
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" loading={isSubmitting}>
                <SearchIcon className="h-4 w-4" />
                {t('search.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchParams && (
        <div className="space-y-8">
          {/* Coordination view: all bookings that day, across companies */}
          <section>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                {t('search.resultsTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('search.resultsHint')}
              </p>
            </div>

            {dayLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : dayReservations && dayReservations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dayReservations.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">
                          {r.space?.name ?? '—'}
                        </h3>
                        {r.space?.type && (
                          <Badge tone="neutral">{t(`spaceType.${r.space.type}`)}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {fmtTime(r.start_time)} – {fmtTime(r.end_time)}
                      </p>
                      {r.profile?.full_name && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t('search.reservedByLabel')}:{' '}
                          <span className="text-foreground">{r.profile.full_name}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title={t('search.noReservationsDay')}
              />
            )}
          </section>

          {/* Booking: available spaces for the given window */}
          {hasWindow && !selectedSpace && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {t('search.availableToBook')}
              </h2>

              {availLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : availableSpaces && availableSpaces.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableSpaces.map((space) => (
                    <Card key={space.id} interactive>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-foreground">{space.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t(`spaceType.${space.type}` as const) ?? space.type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('common.capacity')}: {space.capacity}
                        </p>
                        <Button fullWidth className="mt-3" onClick={() => setSelectedSpace(space)}>
                          {t('search.book')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <EmptyState
                    icon={SearchIcon}
                    title={t('search.noResults')}
                    description={t('search.noResultsHint')}
                  />
                  {alternatives && alternatives.length > 0 && (
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-center text-sm font-medium text-foreground">
                        {t('search.alternativesTitle')}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {alternatives.map((slot) => (
                          <Button
                            key={`${slot.date}-${slot.start_time}`}
                            variant="outline"
                            size="sm"
                            onClick={() => applyAlternative(slot)}
                          >
                            {new Date(`${slot.date}T${slot.start_time}`).toLocaleDateString(undefined, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            · {slot.start_time}–{slot.end_time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Confirmation panel */}
          {selectedSpace && searchParams && (
            <Card className="mx-auto max-w-md">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {t('search.confirmTitle')}
                </h2>
                <dl className="space-y-2 text-sm">
                  <Row label={`${t('calendar.space')}`} value={selectedSpace.name} />
                  <Row
                    label={`${t('calendar.type')}`}
                    value={t(`spaceType.${selectedSpace.type}` as const) ?? selectedSpace.type}
                  />
                  <Row label={`${t('search.date')}:`} value={searchParams.date} />
                  <Row label={`${t('search.startTime')}:`} value={searchParams.start_time ?? ''} />
                  <Row label={`${t('search.endTime')}:`} value={searchParams.end_time ?? ''} />
                  <Row
                    label={`${t('common.capacity')}:`}
                    value={`${selectedSpace.capacity} ${t('common.persons')}`}
                  />
                </dl>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setSelectedSpace(null)} disabled={isCreating}>
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleConfirm} loading={isCreating}>
                    {isCreating ? t('search.confirming') : t('search.confirmSubmit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
