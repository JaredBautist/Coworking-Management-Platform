import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/lib/i18n'

const STEP_KEY = 'onboarding-step'

const orgNameSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres'),
})

const firstSpaceSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres'),
  type: z.enum(['desk', 'meeting_room', 'phone_booth', 'event_space'], {
    required_error: 'Selecciona un tipo de espacio',
  }),
})

type OrgNameData = z.infer<typeof orgNameSchema>
type FirstSpaceData = z.infer<typeof firstSpaceSchema>

export default function OnboardingPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_KEY)
    return saved ? Number(saved) : 0
  })
  const { t } = useI18n()
  const [serverError, setServerError] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    sessionStorage.setItem(STEP_KEY, String(step))
  }, [step])

  const orgForm = useForm<OrgNameData>({
    resolver: zodResolver(orgNameSchema),
    defaultValues: { name: '' },
  })

  const spaceForm = useForm<FirstSpaceData>({
    resolver: zodResolver(firstSpaceSchema),
    defaultValues: { name: '', type: undefined },
  })

  const handleOrgSubmit = useCallback(
    async (data: OrgNameData) => {
      setServerError('')
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({ name: data.name })
        .select()
        .single()

      if (error || !org) {
        setServerError(t('onboarding.error'))
        return
      }

      setOrgId(org.id)

      if (profile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ org_id: org.id })
          .eq('id', profile.id)

        if (!updateError) {
          setProfile({ ...profile, org_id: org.id })
        }
      }

      setStep(1)
    },
    [profile, setProfile]
  )

  const handleSpaceSubmit = useCallback(
    async (data: FirstSpaceData) => {
      if (!orgId && !profile?.org_id) return

      setServerError('')
      const targetOrgId = orgId ?? profile!.org_id

      const { error } = await supabase.from('spaces').insert({
        org_id: targetOrgId,
        name: data.name,
        type: data.type,
        capacity: 1,
        is_active: true,
      })

      if (error) {
        setServerError(t('onboarding.error'))
        return
      }

      sessionStorage.removeItem(STEP_KEY)
      navigate('/app/dashboard', { replace: true })
    },
    [orgId, profile, navigate]
  )

  if (!profile) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('onboarding.step', { current: String(step), total: '2' })}</span>
            <span>{step === 0 ? t('onboarding.orgNameTitle') : t('onboarding.spaceTitle')}</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: step === 0 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {step === 0 && (
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-primary">
              {t('onboarding.orgNameTitle')}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              ¿Cómo se llama tu organización?
            </p>

            <form
              onSubmit={orgForm.handleSubmit(handleOrgSubmit)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="org-name"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  {t('auth.organizationName')}
                </label>
                <input
                  id="org-name"
                  {...orgForm.register('name')}
                  placeholder={t('onboarding.orgNamePlaceholder')}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                {orgForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">
                    {orgForm.formState.errors.name.message}
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
                disabled={orgForm.formState.isSubmitting}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {orgForm.formState.isSubmitting
                  ? t('onboarding.submitting')
                  : t('onboarding.submit')}
              </button>
            </form>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-primary">
              {t('onboarding.spaceTitle')}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Agrega un espacio de trabajo para comenzar.
            </p>

            <form
              onSubmit={spaceForm.handleSubmit(handleSpaceSubmit)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="space-name"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  {t('onboarding.spaceNameLabel')}
                </label>
                <input
                  id="space-name"
                  {...spaceForm.register('name')}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                {spaceForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-destructive">
                    {spaceForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="space-type"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  {t('onboarding.spaceTypeLabel')}
                </label>
                <select
                  id="space-type"
                  {...spaceForm.register('type')}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('onboarding.spaceTypePlaceholder')}</option>
                  <option value="desk">{t('spaceType.desk')}</option>
                  <option value="meeting_room">{t('spaceType.meeting_room')}</option>
                  <option value="phone_booth">{t('spaceType.phone_booth')}</option>
                  <option value="event_space">{t('spaceType.event_space')}</option>
                </select>
                {spaceForm.formState.errors.type && (
                  <p className="mt-1 text-xs text-destructive">
                    {spaceForm.formState.errors.type.message}
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
                disabled={spaceForm.formState.isSubmitting}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {spaceForm.formState.isSubmitting
                  ? t('onboarding.submitting')
                  : t('onboarding.submit')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
