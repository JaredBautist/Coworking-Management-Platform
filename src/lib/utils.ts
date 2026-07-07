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
    '42501': 'No tienes permisos para realizar esta acción.',
    'PGRST116': 'No se encontraron resultados.',
  }
  return map[error.code] ?? `Error del servidor: ${error.message}`
}
