import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { AuthShell } from './AuthShell'
import { FormField, Input, Button } from '@/components/ui'

type ForgotFormData = {
  email: string
}

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const forgotSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.email')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setServerError('')
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      setServerError(t('auth.forgot.error'))
      return
    }

    setSent(true)
  }

  const backLink = (
    <div className="text-center">
      <Link to="/login" className="text-sm text-primary hover:underline">
        {t('auth.forgot.back')}
      </Link>
    </div>
  )

  if (sent) {
    return (
      <AuthShell
        title={t('auth.forgot.sentTitle')}
        subtitle={t('auth.forgot.sentBody')}
        center
        footer={backLink}
      >
        <span className="sr-only">{t('auth.forgot.sentTitle')}</span>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={backLink}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        {serverError && (
          <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
