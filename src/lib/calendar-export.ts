// Lightweight calendar integration: "Add to Google Calendar" links and .ics
// export (works with Google Calendar, Apple Calendar, Outlook, etc.).
// No OAuth required — covers the Google Calendar suggested API cheaply.

export interface CalendarEventInput {
  title: string
  start: string // ISO
  end: string // ISO
  details?: string
  location?: string
  id?: string
}

/** ISO → iCalendar UTC stamp: 20260709T140000Z */
function toICalStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Deep link that opens Google Calendar's "create event" screen pre-filled. */
export function googleCalendarUrl(e: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toICalStamp(e.start)}/${toICalStamp(e.end)}`,
  })
  if (e.details) params.set('details', e.details)
  if (e.location) params.set('location', e.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function escapeICal(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Builds a valid single-event .ics document. */
export function buildIcs(e: CalendarEventInput): string {
  const uid = `${e.id ?? toICalStamp(e.start)}@coworking-manager`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Coworking Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICalStamp(new Date().toISOString())}`,
    `DTSTART:${toICalStamp(e.start)}`,
    `DTEND:${toICalStamp(e.end)}`,
    `SUMMARY:${escapeICal(e.title)}`,
    e.details ? `DESCRIPTION:${escapeICal(e.details)}` : '',
    e.location ? `LOCATION:${escapeICal(e.location)}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return lines.join('\r\n')
}

/** Triggers a download of the reservation as an .ics file. */
export function downloadIcs(e: CalendarEventInput): void {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(e.title || 'reservation').replace(/\s+/g, '-').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
