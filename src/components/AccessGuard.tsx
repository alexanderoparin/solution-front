import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { userApi } from '../api/user'
import { useAuthStore } from '../store/authStore'

interface AccessGuardProps {
  children: React.ReactNode
}

/**
 * Для авторизованных пользователей проверяет доступ (подписка / клиент агентства).
 * ADMIN и MANAGER всегда пропускаются. Если нет доступа — редирект на /subscribe.
 */
export default function AccessGuard({ children }: AccessGuardProps) {
  const role = useAuthStore((state) => state.role)
  const { data: access, isLoading } = useQuery({
    queryKey: ['accessStatus'],
    queryFn: () => userApi.getAccessStatus(),
    retry: false,
  })

  if (role === 'ADMIN' || role === 'MANAGER') {
    return <>{children}</>
  }

  if (isLoading || access === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!access.hasAccess && !access.agencyClient) {
    return <Navigate to="/subscribe" replace />
  }

  return <>{children}</>
}
