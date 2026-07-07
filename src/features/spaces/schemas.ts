import { z } from 'zod'

export const SpaceFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre debe tener máximo 100 caracteres'),
  type: z.enum(['desk', 'meeting_room', 'phone_booth', 'event_space'], {
    required_error: 'Selecciona un tipo de espacio',
    invalid_type_error: 'Tipo de espacio inválido',
  }),
  capacity: z.coerce.number().int('Debe ser un número entero').min(1, 'La capacidad mínima es 1').max(500, 'La capacidad máxima es 500'),
  is_active: z.boolean(),
})

export type SpaceFormValues = z.infer<typeof SpaceFormSchema>
