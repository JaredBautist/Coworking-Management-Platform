import { useState, useMemo } from 'react'
import { useOrgReservations, useCreateReservation } from '@/features/reservations/hooks'
import { useSpaces } from '@/features/spaces/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'

export default function CalendarPage() {
  const { t } = useI18n()
  const profile = useAuthStore((s) => s.profile)
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
    spaceName?: string
  } | null>(null)

  const [formSpace, setFormSpace] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const events = useMemo(() => {
    if (!reservations) return []
    return reservations
      .filter((r) => r.status === 'confirmed')
      .map((r) => ({
        id: r.id,
        title: r.space?.name ?? 'Space',
        start: r.start_time,
        end: r.end_time,
        extendedProps: {
          spaceName: r.space?.name,
          spaceType: r.space?.type,
          summary: r.summary,
          userName: r.profile?.full_name,
        },
      }))
  }, [reservations])

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
      spaceName: props.spaceName,
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

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">{t('calendar.title')}</h1>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
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
        </div>
      </div>

      {/* Create reservation panel */}
      {selectedSlot && (
        <div className="w-80 shrink-0 rounded-lg border border-border bg-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t('calendar.newReservation')}</h2>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t('common.close')}
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">
                {new Date(selectedSlot.date).toLocaleDateString(
                  t('calendar.mon') === 'Mon' ? 'en-US' : 'es-ES',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Horario:</span>
              <p className="font-medium">
                {selectedSlot.startStr.split('T')[1]?.slice(0, 5) || '--'} -{' '}
                {selectedSlot.endStr.split('T')[1]?.slice(0, 5) || '--'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t('calendar.organizer')}
              </label>
              <p className="mt-1 text-sm">{profile?.full_name || profile?.email}</p>
            </div>

            <div>
              <label
                htmlFor="calendar-space"
                className="block text-sm font-medium text-muted-foreground"
              >
                {t('calendar.selectSpace')}
              </label>
              <select
                id="calendar-space"
                value={formSpace}
                onChange={(e) => setFormSpace(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- {t('calendar.selectSpace')} --</option>
                {availableSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({t(`spaceType.${s.type}`)})
                  </option>
                ))}
              </select>
              {availableSpaces.length === 0 && (
                <p className="mt-1 text-xs text-destructive">
                  {t('calendar.noSpaces')}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="calendar-summary"
                className="block text-sm font-medium text-muted-foreground"
              >
                {t('calendar.summary')}
              </label>
              <input
                id="calendar-summary"
                type="text"
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder={t('calendar.summaryPlaceholder')}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleCreateReservation}
              disabled={!formSpace || isSubmitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? t('calendar.saving') : t('calendar.save')}
            </button>
          </div>
        </div>
      )}

      {/* Event detail panel */}
      {selectedEvent && !selectedSlot && (
        <div className="w-80 shrink-0 rounded-lg border border-border bg-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t('calendar.details')}</h2>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t('common.close')}
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">{t('calendar.space')}</span>
              <p className="font-medium">{selectedEvent.spaceName || selectedEvent.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('calendar.schedule')}</span>
              <p className="font-medium">
                {new Date(selectedEvent.start).toLocaleTimeString(
                  t('calendar.mon') === 'Mon' ? 'en-US' : 'es-ES',
                  { hour: '2-digit', minute: '2-digit' }
                )}{' '}
                -{' '}
                {new Date(selectedEvent.end).toLocaleTimeString(
                  t('calendar.mon') === 'Mon' ? 'en-US' : 'es-ES',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </p>
            </div>
            {selectedEvent.summary && (
              <div>
                <span className="text-muted-foreground">{t('calendar.summary')}</span>
                <p>{selectedEvent.summary}</p>
              </div>
            )}
            {selectedEvent.userName && (
              <div>
                <span className="text-muted-foreground">{t('calendar.reservedBy')}</span>
                <p>{selectedEvent.userName}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t('calendar.status')}</span>
              <p>{t('calendar.confirmed')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
