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
import { Search as SearchIcon } from 'lucide-react'
import type { Space } from '@/types'
import {
  PageHeader,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Button,
  EmptyState,
} from '@/components/ui'

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

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && searchParams && availableSpaces?.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title={t('search.noResults')}
          description={t('search.noResultsHint')}
        />
      )}

      {!isLoading && availableSpaces && availableSpaces.length > 0 && !selectedSpace && (
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
                <Button
                  fullWidth
                  className="mt-3"
                  onClick={() => setSelectedSpace(space)}
                >
                  {t('search.book')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
              <Row label={`${t('search.startTime')}:`} value={searchParams.start_time} />
              <Row label={`${t('search.endTime')}:`} value={searchParams.end_time} />
              <Row
                label={`${t('common.capacity')}:`}
                value={`${selectedSpace.capacity} ${t('common.persons')}`}
              />
            </dl>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedSpace(null)}
                disabled={isCreating}
              >
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
