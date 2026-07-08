import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

type LoginFormData = {
  email: string
  password: string
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const setSession = useAuthStore((s) => s.setSession)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [serverError, setServerError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.email')),
        password: z.string().min(1, t('validation.password')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!lockoutUntil) return
    const update = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now())
      setCountdown(Math.ceil(remaining / 1000))
      if (remaining <= 0) {
        setLockoutUntil(null)
        setAttempts(0)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      if (isLocked) return

      setServerError('')

      const { data: authData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

      if (error || !authData.session) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS)
          setServerError(t('auth.login.lockedInitial'))
        } else {
          setServerError(t('auth.login.invalid'))
        }
        return
      }

      setSession(authData.session)
      setAttempts(0)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profile) setProfile(profile)

      navigate('/app/dashboard', { replace: true })
    },
    [attempts, isLocked, navigate, setSession, setProfile, t]
  )

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#FAFBFC_0%,#EEF2FF_100%)] p-4">
      <div className="animate-fade-in-up w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-elevated">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-1 text-2xl font-semibold text-foreground">
          {t('auth.login.title')}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('app.name')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLocked}
              {...register('email')}
              className="input-field mt-1.5"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLocked}
              {...register('password')}
              className="input-field mt-1.5"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div
              role="alert"
              className="animate-fade-in rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {isLocked && countdown > 0
                ? t('auth.login.locked', { time: formatCountdown(countdown) })
                : serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="btn-primary w-full"
          >
            {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t('auth.login.forgot')}
          </Link>
        </div>
        <div className="mt-3 text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link to="/signup" className="text-primary hover:underline">
            {t('auth.login.createAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
