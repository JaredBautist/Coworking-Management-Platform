import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

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

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>
          <h1 className="mb-4 text-2xl font-semibold text-primary">
            {t('auth.forgot.sentTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.forgot.sentBody')}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-primary hover:underline"
          >
            {t('auth.forgot.back')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-primary">
          {t('auth.forgot.title')}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('auth.forgot.subtitle')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted-foreground"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline"
          >
            {t('auth.forgot.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
