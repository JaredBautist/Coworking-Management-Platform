import { useState, useMemo } from 'react'
import {
  useAllReservations,
  useCreateReservation,
  useReservationAttendees,
  useDayReservations,
} from '@/features/reservations/hooks'
import { useSpaces } from '@/features/spaces/hooks'
import { useTeamMembers } from '@/features/team/hooks'
import { toUtcISOString } from '@/lib/utils'
import { AddToCalendar } from '@/components/shared/AddToCalendar'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import type { SpaceType } from '@/types'
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
  const { data: reservations, isLoading } = useAllReservations()
  const { data: spaces } = useSpaces()
  const { data: orgMembers } = useTeamMembers()
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
    userId?: string
    spaceName?: string
    spaceType?: SpaceType
  } | null>(null)

  const [formSpace, setFormSpace] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formStart, setFormStart] = useState('09:00')
  const [formEnd, setFormEnd] = useState('10:00')
  const [formAttendees, setFormAttendees] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: eventAttendees } = useReservationAttendees(selectedEvent?.id ?? null)

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
            userId: r.user_id,
          },
        }
      })
  }, [reservations, profile?.id])

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const dateStr = selectInfo.startStr.split('T')[0]
    // In week/day view the selection carries a time; in month view it does not.
    // Seed the editable time fields from the slot when available, else default.
    const startTime = selectInfo.startStr.split('T')[1]?.slice(0, 5)
    const endTime = selectInfo.endStr.split('T')[1]?.slice(0, 5)
    setSelectedSlot({
      date: dateStr,
      startStr: selectInfo.startStr,
      endStr: selectInfo.endStr,
    })
    setFormStart(startTime || '09:00')
    setFormEnd(endTime && endTime !== startTime ? endTime : '10:00')
    setFormSpace('')
    setFormSummary('')
    setFormAttendees([])
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
      userId: props.userId,
      spaceName: props.spaceName,
      spaceType: props.spaceType,
    })
    setSelectedSlot(null)
  }

  const handleCreateReservation = async () => {
    if (!selectedSlot || !formSpace) return
    if (formEnd <= formStart) {
      addToast({ type: 'error', message: t('validation.endAfterStart') })
      return
    }
    setIsSubmitting(true)
    try {
      await createReservation.mutateAsync({
        spaceId: formSpace,
        date: selectedSlot.date,
        startTime: formStart,
        endTime: formEnd,
        summary: formSummary || undefined,
        attendeeIds: formAttendees.length > 0 ? formAttendees : undefined,
      })
      addToast({ type: 'success', message: t('calendar.reservationCreated') })
      setSelectedSlot(null)
      setFormSpace('')
      setFormSummary('')
      setFormAttendees([])
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
    } catch {
      addToast({ type: 'error', message: t('calendar.reservationError') })
    }
    setIsSubmitting(false)
  }

  // All reservations (any company) on the clicked day — fresh query per day.
  const { data: dayReservationsData } = useDayReservations(
    selectedSlot?.date ?? null
  )
  const dayReservations = dayReservationsData ?? []

  const availableSpaces = useMemo(() => {
    if (!spaces || !selectedSlot || formEnd <= formStart) return []
    const startISO = toUtcISOString(selectedSlot.date, formStart)
    const endISO = toUtcISOString(selectedSlot.date, formEnd)
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
  }, [spaces, selectedSlot, reservations, formStart, formEnd])

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
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  {t('calendar.yourReservations')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-secondary" />
                  {t('calendar.otherReservations')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface" />
                  {t('calendar.availableHours')}
                </span>
              </div>
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
          <Card className="panel-enter w-full lg:w-80 lg:shrink-0 lg:self-start">
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
                    {new Date(`${selectedSlot.date}T00:00`).toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('calendar.dayReservations')}
                  </p>
                  {dayReservations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('calendar.dayFree')}</p>
                  ) : (
                    <ul className="max-h-40 space-y-1.5 overflow-y-auto">
                      {dayReservations.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                              {r.space?.name ?? '—'}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {new Date(r.start_time).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            –
                            {new Date(r.end_time).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('calendar.start')} htmlFor="calendar-start">
                    <Input
                      id="calendar-start"
                      type="time"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                    />
                  </FormField>
                  <FormField
                    label={t('calendar.end')}
                    htmlFor="calendar-end"
                    error={formEnd <= formStart ? t('validation.endAfterStart') : undefined}
                  >
                    <Input
                      id="calendar-end"
                      type="time"
                      value={formEnd}
                      invalid={formEnd <= formStart}
                      onChange={(e) => setFormEnd(e.target.value)}
                    />
                  </FormField>
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

                {orgMembers && orgMembers.length > 1 && (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('calendar.inviteAttendees')}
                    </p>
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      {t('calendar.attendeesHint')}
                    </p>
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                      {orgMembers
                        .filter((m) => m.id !== profile?.id)
                        .map((m) => (
                          <label
                            key={m.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
                          >
                            <input
                              type="checkbox"
                              checked={formAttendees.includes(m.id)}
                              onChange={(e) =>
                                setFormAttendees((prev) =>
                                  e.target.checked
                                    ? [...prev, m.id]
                                    : prev.filter((id) => id !== m.id)
                                )
                              }
                              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="truncate text-foreground">{m.full_name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={handleCreateReservation}
                  disabled={!formSpace || formEnd <= formStart}
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
          <Card className="panel-enter w-full lg:w-80 lg:shrink-0 lg:self-start">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{t('calendar.details')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)} aria-label={t('common.close')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Coworking compartido: todos ven los detalles completos. */}
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('calendar.space')}</span>
                  <p className="font-medium text-foreground">
                    {selectedEvent.spaceName || selectedEvent.title}
                  </p>
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
                {eventAttendees && eventAttendees.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">{t('calendar.attendees')}</span>
                    <ul className="mt-1 space-y-0.5">
                      {eventAttendees.map((a) => (
                        <li key={a.id} className="text-foreground">
                          {a.full_name}
                          {a.id === profile?.id && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {t('common.you')}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t('calendar.status')}</span>
                  <div className="mt-1">
                    <Badge tone="success">{t('calendar.confirmed')}</Badge>
                  </div>
                </div>
                <div className="pt-1">
                  <AddToCalendar
                    event={{
                      id: selectedEvent.id,
                      title: selectedEvent.spaceName || selectedEvent.title,
                      start: selectedEvent.start,
                      end: selectedEvent.end,
                      details: selectedEvent.summary,
                      location: selectedEvent.spaceName,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
