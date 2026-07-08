import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/lib/i18n'
import { AuthShell } from './AuthShell'
import { FormField, Input, Button } from '@/components/ui'

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
      <AuthShell
        title={t('auth.signup.successTitle')}
        subtitle={t('auth.signup.successBody')}
        center
        footer={
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t('auth.signup.signIn')}
            </Link>
          </div>
        }
      >
        <span className="sr-only">{t('auth.signup.successTitle')}</span>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.signup.title')}
      subtitle={t('auth.signup.subtitle')}
      maxWidth="md"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {t('auth.signup.signIn')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t('auth.fullName')} htmlFor="full-name" error={errors.fullName?.message}>
          <Input
            id="full-name"
            type="text"
            autoComplete="name"
            invalid={!!errors.fullName}
            {...register('fullName')}
          />
        </FormField>

        <FormField label={t('auth.organizationName')} htmlFor="organization-name" error={errors.organizationName?.message}>
          <Input
            id="organization-name"
            type="text"
            autoComplete="organization"
            invalid={!!errors.organizationName}
            {...register('organizationName')}
          />
        </FormField>

        <FormField label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        {serverError && (
          <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
