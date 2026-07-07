import { QueryClient } from '@tanstack/react-query'

function globalQueryErrorHandler(error: unknown) {
  console.error('Query error:', error)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: globalQueryErrorHandler,
    },
  },
})
