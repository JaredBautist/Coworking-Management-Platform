import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SpaceFormSchema, type SpaceFormValues } from './schemas'
import { useSpaces, useCreateSpace, useUpdateSpace } from './hooks'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'

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
        addToast({ type: 'success', message: t('spaces.deactivatedSuccess') })
      } else {
        await createSpace.mutateAsync(values)
        addToast({ type: 'success', message: t('spaces.deactivatedSuccess') })
      }
      navigate('/app/spaces')
    } catch {
      addToast({ type: 'error', message: 'Error del servidor. Intenta de nuevo.' })
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">
        {isEditing ? t('spaces.edit') : t('spaces.new')}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="card space-y-4 p-6"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            {t('spaces.nameLabel')}
          </label>
          <input
            id="name"
            {...register('name')}
            className="input-field mt-1.5"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-foreground"
          >
            {t('spaces.typeLabel')}
          </label>
          <select
            id="type"
            {...register('type')}
            className="input-field mt-1.5"
          >
            <option value="">{t('spaces.selectType')}</option>
            <option value="desk">{t('spaceType.desk')}</option>
            <option value="meeting_room">{t('spaceType.meetingRoom')}</option>
            <option value="phone_booth">{t('spaceType.phoneBooth')}</option>
            <option value="event_space">{t('spaceType.eventSpace')}</option>
          </select>
          {errors.type && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.type.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-foreground"
          >
            {t('spaces.capacityLabel')}
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            max={500}
            {...register('capacity')}
            className="input-field mt-1.5"
          />
          {errors.capacity && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.capacity.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label
            htmlFor="is_active"
            className="text-sm font-medium text-foreground"
          >
            {t('spaces.activeLabel')}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/app/spaces')}
            className="btn-ghost"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear espacio'}
          </button>
        </div>
      </form>
    </div>
  )
}
