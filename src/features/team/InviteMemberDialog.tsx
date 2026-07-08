import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import { useInviteMember } from './hooks'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
  FormField,
  Input,
  Select,
} from '@/components/ui'

type InviteForm = { email: string; role: 'member' | 'office_manager' }

export function InviteMemberDialog() {
  const { t } = useI18n()
  const addToast = useUIStore((s) => s.addToast)
  const invite = useInviteMember()
  const [open, setOpen] = useState(false)

  const schema = z.object({
    email: z.string().email(t('validation.email')),
    role: z.enum(['member', 'office_manager']),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'member' },
  })

  const onSubmit = async (data: InviteForm) => {
    try {
      await invite.mutateAsync({ email: data.email, role: data.role })
      addToast({ type: 'success', message: t('team.inviteSuccess') })
      reset({ email: '', role: 'member' })
      setOpen(false)
    } catch {
      addToast({ type: 'error', message: t('team.inviteError') })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          {t('team.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('team.inviteTitle')}</DialogTitle>
        <DialogDescription>{t('team.inviteDescription')}</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <FormField label={t('common.email')} htmlFor="invite-email" error={errors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>
          <FormField label={t('common.role')} htmlFor="invite-role">
            <Select id="invite-role" {...register('role')}>
              <option value="member">{t('team.member')}</option>
              <option value="office_manager">{t('team.administrator')}</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t('team.inviteSending') : t('team.inviteSubmit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
