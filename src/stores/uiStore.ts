import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface UIState {
  toasts: Toast[]
  filters: Record<string, unknown>
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setFilters: (key: string, filters: unknown) => void
  clearFilters: (key: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  filters: {},
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setFilters: (key, filters) =>
    set((state) => ({
      filters: { ...state.filters, [key]: filters },
    })),
  clearFilters: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.filters
      return { filters: rest }
    }),
}))
