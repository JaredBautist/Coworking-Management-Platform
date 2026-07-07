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
      <h1 className="mb-6 text-2xl font-semibold">
        {isEditing ? t('spaces.edit') : t('spaces.new')}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-muted-foreground"
          >
            {t('spaces.nameLabel')}
          </label>
          <input
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-muted-foreground"
          >
            {t('spaces.typeLabel')}
          </label>
          <select
            id="type"
            {...register('type')}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('spaces.selectType')}</option>
            <option value="desk">{t('spaceType.desk')}</option>
            <option value="meeting_room">{t('spaceType.meetingRoom')}</option>
            <option value="phone_booth">{t('spaceType.phoneBooth')}</option>
            <option value="event_space">{t('spaceType.eventSpace')}</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-destructive">
              {errors.type.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-muted-foreground"
          >
            {t('spaces.capacityLabel')}
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            max={500}
            {...register('capacity')}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.capacity && (
            <p className="mt-1 text-xs text-destructive">
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
            className="text-sm font-medium text-muted-foreground"
          >
            {t('spaces.activeLabel')}
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/spaces')}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
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
