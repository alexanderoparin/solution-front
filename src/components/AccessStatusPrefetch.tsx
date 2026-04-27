import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ACCESS_STATUS_QUERY_KEY,
  ACCESS_STATUS_STALE_MS,
  userApi,
} from '../api/user'
import { useAuthStore } from '../store/authStore'

/**
 * При появлении JWT в памяти (после логина или восстановления из persist) префетчит
 * GET /user/access в кеш React Query. Так AccessGuard чаще получает данные без второго
 * «холодного» запроса на медленных сетях.
 */
export default function AccessStatusPrefetch() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    void queryClient.prefetchQuery({
      queryKey: ACCESS_STATUS_QUERY_KEY,
      queryFn: () => userApi.getAccessStatus(),
      staleTime: ACCESS_STATUS_STALE_MS,
    }).catch(() => {
      /* AccessGuard / страница подписки повторят запрос */
    })
  }, [token, queryClient])

  return null
}
