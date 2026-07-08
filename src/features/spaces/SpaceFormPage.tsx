import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SpaceFormSchema, type SpaceFormValues } from './schemas'
import { useSpaces, useCreateSpace, useUpdateSpace } from './hooks'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import {
  PageHeader,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  Label,
  Button,
} from '@/components/ui'

export default function SpaceFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const { data: spaces } = useSpaces()
  const createSpace = useCreateSpace()
  const updateSpace = useUpdateSpace()
  const addToast = useUIStore((s) => s.addToast)
  const { t } = useI18n()

  const editingSpace = isEditing
    ? spaces?.find((s) => s.id === id)
    : null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(SpaceFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      capacity: 1,
      is_active: true,
    },
  })

  useEffect(() => {
    if (editingSpace) {
      reset({
        name: editingSpace.name,
        type: editingSpace.type,
        capacity: editingSpace.capacity,
        is_active: editingSpace.is_active,
      })
    }
  }, [editingSpace, reset])

  const onSubmit = async (values: SpaceFormValues) => {
    try {
      if (isEditing && id) {
        await updateSpace.mutateAsync({ id, values })
        addToast({ type: 'success', message: t('spaces.updatedSuccess') })
      } else {
        await createSpace.mutateAsync(values)
        addToast({ type: 'success', message: t('spaces.createdSuccess') })
      }
      navigate('/app/spaces')
    } catch {
      addToast({ type: 'error', message: t('spaces.serverError') })
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={isEditing ? t('spaces.edit') : t('spaces.new')} />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label={t('spaces.nameLabel')}
              htmlFor="name"
              error={errors.name?.message}
            >
              <Input id="name" invalid={!!errors.name} {...register('name')} />
            </FormField>

            <FormField
              label={t('spaces.typeLabel')}
              htmlFor="type"
              error={errors.type?.message}
            >
              <Select id="type" invalid={!!errors.type} {...register('type')}>
                <option value="">{t('spaces.selectType')}</option>
                <option value="desk">{t('spaceType.desk')}</option>
                <option value="meeting_room">{t('spaceType.meeting_room')}</option>
                <option value="phone_booth">{t('spaceType.phone_booth')}</option>
                <option value="event_space">{t('spaceType.event_space')}</option>
              </Select>
            </FormField>

            <FormField
              label={t('spaces.capacityLabel')}
              htmlFor="capacity"
              error={errors.capacity?.message}
            >
              <Input
                id="capacity"
                type="number"
                min={1}
                max={500}
                invalid={!!errors.capacity}
                {...register('capacity')}
              />
            </FormField>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20"
              />
              <Label htmlFor="is_active" className="font-medium">
                {t('spaces.activeLabel')}
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/app/spaces')}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting
                  ? t('spaces.saving')
                  : isEditing
                    ? t('spaces.save')
                    : t('spaces.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
