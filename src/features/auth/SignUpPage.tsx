import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

type SignUpFormData = {
  fullName: string
  organizationName: string
  email: string
  password: string
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const setSession = useAuthStore((s) => s.setSession)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [serverError, setServerError] = useState('')
  const [sent, setSent] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(2, t('validation.fullName')).max(100, t('validation.fullName')),
        organizationName: z
          .string()
          .trim()
          .min(2, t('validation.organizationName'))
          .max(100, t('validation.organizationName')),
        email: z.string().email(t('validation.email')),
        password: z.string().min(8, t('validation.passwordLength')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: SignUpFormData) => {
    setServerError('')

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          organization_name: data.organizationName,
        },
      },
    })

    if (error) {
      setServerError(error.message || t('auth.signup.error'))
      return
    }

    if (authData.session) {
      setSession(authData.session)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user?.id)
        .single()

      if (profile) setProfile(profile)
      navigate('/app/dashboard', { replace: true })
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>
          <h1 className="mb-4 text-2xl font-semibold text-primary">
            {t('auth.signup.successTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.signup.successBody')}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-primary hover:underline"
          >
            {t('auth.signup.signIn')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-primary">
          {t('auth.signup.title')}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('auth.signup.subtitle')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-muted-foreground">
              {t('auth.fullName')}
            </label>
            <input
              id="full-name"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="organization-name" className="block text-sm font-medium text-muted-foreground">
              {t('auth.organizationName')}
            </label>
            <input
              id="organization-name"
              type="text"
              autoComplete="organization"
              {...register('organizationName')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.organizationName && (
              <p className="mt-1 text-xs text-destructive">{errors.organizationName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
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
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {t('auth.signup.signIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
