import { z } from 'zod'
import type { Space } from '@/types'

export const ReservationSearchSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
    space_type: z
      .enum(['desk', 'meeting_room', 'phone_booth', 'event_space'])
      .optional(),
    min_capacity: z.coerce.number().int().min(1).max(999).optional(),
  })
  .refine(
    (d) => {
      return d.end_time > d.start_time
    },
    { message: 'La hora de fin debe ser posterior a la hora de inicio', path: ['end_time'] }
  )
  .refine(
    (d) => {
      return new Date(d.date) >= new Date(new Date().toDateString())
    },
    { message: 'La fecha no puede ser anterior a hoy', path: ['date'] }
  )

export type ReservationSearchValues = z.infer<typeof ReservationSearchSchema>

// Búsqueda en Find Spaces: solo la fecha es obligatoria; hora y tipo son
// filtros opcionales (cadena vacía = sin filtro). Con solo la fecha se listan
// todas las reservas del día.
export const SearchFilterSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
      .or(z.literal('')),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido')
      .or(z.literal('')),
    end_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido')
      .or(z.literal('')),
    space_type: z
      .enum(['desk', 'meeting_room', 'phone_booth', 'event_space'])
      .or(z.literal('')),
  })
  .refine((d) => !d.start_time || !d.end_time || d.end_time > d.start_time, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['end_time'],
  })

export type SearchFilterValues = z.infer<typeof SearchFilterSchema>

export function filterAvailableSpaces(
  allSpaces: Space[],
  occupiedSpaceIds: string[],
  params: ReservationSearchValues
): Space[] {
  return allSpaces.filter((space) => {
    if (!space.is_active) return false
    if (occupiedSpaceIds.includes(space.id)) return false
    if (params.space_type && space.type !== params.space_type) return false
    if (
      params.min_capacity !== undefined &&
      params.min_capacity >= 1 &&
      params.min_capacity <= 999 &&
      space.capacity < params.min_capacity
    )
      return false
    return true
  })
}

export function hasOverlap(
  existingStart: string,
  existingEnd: string,
  requestedStart: string,
  requestedEnd: string
): boolean {
  return existingStart < requestedEnd && existingEnd > requestedStart
}
