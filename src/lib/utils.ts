import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PostgrestError } from '@supabase/supabase-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseSupabaseError(error: PostgrestError): string {
  const map: Record<string, string> = {
    '23505': 'Ya existe un registro con esos datos.',
    '23503': 'El elemento relacionado no existe.',
    '23514': 'Alguno de los valores no cumple las restricciones del servidor.',
    '23P01': 'El espacio ya no está disponible para ese horario.',
    '42501': 'No tienes permisos para realizar esta acción.',
    'PGRST116': 'No se encontraron resultados.',
  }
  return map[error.code] ?? `Error del servidor: ${error.message}`
}

/**
 * Builds a timezone-correct UTC ISO string from a local date (YYYY-MM-DD)
 * and a local wall-clock time (HH:mm). The user picks a local time; this
 * converts it to the exact UTC instant so it round-trips through a
 * TIMESTAMPTZ column without offset drift.
 */
export function toUtcISOString(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString()
}
