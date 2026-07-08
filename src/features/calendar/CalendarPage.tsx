import { useState, useMemo } from 'react'
import { useOrgReservations, useCreateReservation } from '@/features/reservations/hooks'
import { useSpaces } from '@/features/spaces/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useRole } from '@/hooks/useRole'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import {
  PageHeader,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Button,
  Badge,
} from '@/components/ui'

export default function CalendarPage() {
  const { t } = useI18n()
  const profile = useAuthStore((s) => s.profile)
  const { isOfficeManager } = useRole()
  const { data: reservations, isLoading } = useOrgReservations()
  const { data: spaces } = useSpaces()
  const createReservation = useCreateReservation()
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    startStr: string
    endStr: string
  } | null>(null)

  const [selectedEvent, setSelectedEvent] = useState<{
    id: string
    title: string
    start: string
    end: string
    summary?: string
    userName?: string
    userId?: string
    spaceName?: string
    spaceType?: string
  } | null>(null)

  const [formSpace, setFormSpace] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const events = useMemo(() => {
    if (!reservations) return []
    return reservations
      .filter((r) => r.status === 'confirmed')
      .map((r) => {
        const isOwn = r.user_id === profile?.id
        return {
          id: r.id,
          title: r.space?.name ?? 'Space',
          start: r.start_time,
          end: r.end_time,
          classNames: [isOwn ? 'fc-event-own' : 'fc-event-other'],
          extendedProps: {
            spaceName: r.space?.name,
            spaceType: r.space?.type,
            summary: r.summary,
            userName: r.profile?.full_name,
            userId: r.user_id,
          },
        }
      })
  }, [reservations, profile?.id])

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const dateStr = selectInfo.startStr.split('T')[0]
    setSelectedSlot({
      date: dateStr,
      startStr: selectInfo.startStr,
      endStr: selectInfo.endStr,
    })
    setFormSpace('')
    setFormSummary('')
    setSelectedEvent(null)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      summary: props.summary,
      userName: props.userName,
      userId: props.userId,
      spaceName: props.spaceName,
      spaceType: props.spaceType,
    })
    setSelectedSlot(null)
  }

  const handleCreateReservation = async () => {
    if (!selectedSlot || !formSpace) return
    setIsSubmitting(true)
    try {
      await createReservation.mutateAsync({
        spaceId: formSpace,
        date: selectedSlot.date,
        startTime: selectedSlot.startStr.split('T')[1]?.slice(0, 5) || '09:00',
        endTime: selectedSlot.endStr.split('T')[1]?.slice(0, 5) || '10:00',
        summary: formSummary || undefined,
      })
      addToast({ type: 'success', message: t('calendar.reservationCreated') })
      setSelectedSlot(null)
      setFormSpace('')
      setFormSummary('')
      queryClient.invalidateQueries({ queryKey: ['org-reservations'] })
    } catch {
      addToast({ type: 'error', message: t('calendar.reservationError') })
    }
    setIsSubmitting(false)
  }

  const availableSpaces = useMemo(() => {
    if (!spaces || !selectedSlot) return []
    const startISO = selectedSlot.startStr
    const endISO = selectedSlot.endStr
    const occupiedIds =
      reservations
        ?.filter(
          (r) =>
            r.status === 'confirmed' &&
            r.start_time < endISO &&
            r.end_time > startISO
        )
        .map((r) => r.space_id) ?? []
    return spaces.filter(
      (s) => s.is_active && !occupiedIds.includes(s.id)
    )
  }, [spaces, selectedSlot, reservations])

  const locale = t('calendar.mon') === 'Mon' ? 'en-US' : 'es-ES'

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('calendar.title')} />
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <Card>
            <CardContent className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                  startTime: '08:00',
                  endTime: '20:00',
                }}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                nowIndicator
                selectable
                selectMirror
                dayMaxEvents
                weekends
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="auto"
                locale={t('calendar.mon') === 'Mon' ? 'en' : 'es'}
                buttonText={{
                  today: t('calendar.day') === 'Day' ? 'today' : 'hoy',
                  month: t('calendar.month'),
                  week: t('calendar.week'),
                  day: t('calendar.day'),
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Create reservation panel */}
        {selectedSlot && (
          <Card className="panel-enter w-80 shrink-0 self-start">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{t('calendar.newReservation')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedSlot(null)} aria-label={t('common.close')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium text-foreground">
                    {new Date(selectedSlot.date).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {selectedSlot.startStr.split('T')[1]?.slice(0, 5) || '--'} -{' '}
                    {selectedSlot.endStr.split('T')[1]?.slice(0, 5) || '--'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('calendar.organizer')}
                  </p>
                  <p className="mt-0.5 text-foreground">{profile?.full_name || profile?.email}</p>
                </div>

                <FormField
                  label={t('calendar.selectSpace')}
                  htmlFor="calendar-space"
                  error={availableSpaces.length === 0 ? t('calendar.noSpaces') : undefined}
                >
                  <Select
                    id="calendar-space"
                    value={formSpace}
                    onChange={(e) => setFormSpace(e.target.value)}
                  >
                    <option value="">-- {t('calendar.selectSpace')} --</option>
                    {availableSpaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({t(`spaceType.${s.type}`)})
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label={t('calendar.summary')} htmlFor="calendar-summary">
                  <Input
                    id="calendar-summary"
                    type="text"
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder={t('calendar.summaryPlaceholder')}
                  />
                </FormField>

                <Button
                  fullWidth
                  onClick={handleCreateReservation}
                  disabled={!formSpace}
                  loading={isSubmitting}
                >
                  {isSubmitting ? t('calendar.saving') : t('calendar.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event detail panel */}
        {selectedEvent && !selectedSlot && (
          <Card className="panel-enter w-80 shrink-0 self-start">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{t('calendar.details')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)} aria-label={t('common.close')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('calendar.space')}</span>
                  <p className="font-medium text-foreground">{selectedEvent.spaceName || selectedEvent.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('calendar.schedule')}</span>
                  <p className="font-medium text-foreground">
                    {new Date(selectedEvent.start).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedEvent.end).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {selectedEvent.summary && (
                  <div>
                    <span className="text-muted-foreground">{t('calendar.summary')}</span>
                    <p className="text-foreground">{selectedEvent.summary}</p>
                  </div>
                )}
                {selectedEvent.userName && (
                  <div>
                    <span className="text-muted-foreground">{t('calendar.reservedBy')}</span>
                    <p className="text-foreground">{selectedEvent.userName}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t('calendar.status')}</span>
                  <div className="mt-1">
                    <Badge tone="success">{t('calendar.confirmed')}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
