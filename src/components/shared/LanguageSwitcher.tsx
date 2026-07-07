import { useI18n } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t('common.language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'es')}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary"
        aria-label={t('common.language')}
      >
        <option value="en">{t('common.english')}</option>
        <option value="es">{t('common.spanish')}</option>
      </select>
    </label>
  )
}
