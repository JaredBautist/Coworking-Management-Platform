import { useI18n } from '@/lib/i18n'
import { Select } from '@/components/ui'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <Select
      value={language}
      onChange={(event) => setLanguage(event.target.value as 'en' | 'es')}
      aria-label={t('common.language')}
      className="h-8 w-auto py-1 pr-8 text-xs"
    >
      <option value="en">{t('common.english')}</option>
      <option value="es">{t('common.spanish')}</option>
    </Select>
  )
}
