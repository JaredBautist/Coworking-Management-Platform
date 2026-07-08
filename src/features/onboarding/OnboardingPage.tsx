import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from '@/lib/i18n'
import {
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Button,
} from '@/components/ui'

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
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_KEY)
    return saved ? Number(saved) : 0
  })
  const { t } = useI18n()
  const [serverError, setServerError] = useState('')

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

      // The signup trigger already created the organization; here we just
      // rename it. (Creating a new org would orphan the trigger's org and is
      // blocked by RLS anyway.)
      if (!profile?.org_id) {
        setServerError(t('onboarding.error'))
        return
      }

      const { error } = await supabase
        .from('organizations')
        .update({ name: data.name })
        .eq('id', profile.org_id)

      if (error) {
        setServerError(t('onboarding.error'))
        return
      }

      setStep(1)
    },
    [profile, t]
  )

  const handleSpaceSubmit = useCallback(
    async (data: FirstSpaceData) => {
      if (!profile?.org_id) return

      setServerError('')

      const { error } = await supabase.from('spaces').insert({
        org_id: profile.org_id,
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
    [profile, navigate, t]
  )

  if (!profile) return null

  const serverErrorBanner = serverError && (
    <div
      role="alert"
      className="animate-fade-in rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {serverError}
    </div>
  )

  return (
    <div className="auth-gradient flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('onboarding.step', { current: String(step + 1), total: '2' })}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: step === 0 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {step === 0 && (
            <div className="animate-fade-in">
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
                {t('onboarding.orgNameTitle')}
              </h1>

              <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)} className="space-y-4">
                <FormField
                  label={t('auth.organizationName')}
                  htmlFor="org-name"
                  error={orgForm.formState.errors.name?.message}
                >
                  <Input
                    id="org-name"
                    placeholder={t('onboarding.orgNamePlaceholder')}
                    invalid={!!orgForm.formState.errors.name}
                    {...orgForm.register('name')}
                  />
                </FormField>

                {serverErrorBanner}

                <Button type="submit" fullWidth loading={orgForm.formState.isSubmitting}>
                  {orgForm.formState.isSubmitting
                    ? t('onboarding.submitting')
                    : t('onboarding.submit')}
                </Button>
              </form>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
                {t('onboarding.spaceTitle')}
              </h1>

              <form onSubmit={spaceForm.handleSubmit(handleSpaceSubmit)} className="space-y-4">
                <FormField
                  label={t('onboarding.spaceNameLabel')}
                  htmlFor="space-name"
                  error={spaceForm.formState.errors.name?.message}
                >
                  <Input
                    id="space-name"
                    placeholder={t('onboarding.spaceNamePlaceholder')}
                    invalid={!!spaceForm.formState.errors.name}
                    {...spaceForm.register('name')}
                  />
                </FormField>

                <FormField
                  label={t('onboarding.spaceTypeLabel')}
                  htmlFor="space-type"
                  error={spaceForm.formState.errors.type?.message}
                >
                  <Select
                    id="space-type"
                    invalid={!!spaceForm.formState.errors.type}
                    {...spaceForm.register('type')}
                  >
                    <option value="">{t('spaces.selectType')}</option>
                    <option value="desk">{t('spaceType.desk')}</option>
                    <option value="meeting_room">{t('spaceType.meeting_room')}</option>
                    <option value="phone_booth">{t('spaceType.phone_booth')}</option>
                    <option value="event_space">{t('spaceType.event_space')}</option>
                  </Select>
                </FormField>

                {serverErrorBanner}

                <Button type="submit" fullWidth loading={spaceForm.formState.isSubmitting}>
                  {spaceForm.formState.isSubmitting
                    ? t('onboarding.submitting')
                    : t('onboarding.submit')}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
