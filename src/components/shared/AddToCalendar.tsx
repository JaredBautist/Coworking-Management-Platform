import { CalendarPlus, Download } from 'lucide-react'
import {
  googleCalendarUrl,
  downloadIcs,
  type CalendarEventInput,
} from '@/lib/calendar-export'
import { buttonVariants, Button } from '@/components/ui'
import { useI18n } from '@/lib/i18n'

export function AddToCalendar({ event }: { event: CalendarEventInput }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a
        href={googleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        {t('calendar.addToGoogle')}
      </a>
      <Button variant="ghost" size="sm" onClick={() => downloadIcs(event)}>
        <Download className="h-3.5 w-3.5" />
        {t('calendar.downloadIcs')}
      </Button>
    </div>
  )
}
