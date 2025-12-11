import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Space, Typography, Select } from 'antd'
import { UserOutlined, BarChartOutlined, ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import type { UserListItem } from '../types/api'

const { Text, Title } = Typography

interface SellerSelectProps {
  selectedSellerId?: number
  activeSellers: UserListItem[]
  onSellerChange: (sellerId: number | undefined) => void
}

interface HeaderProps {
  articleTitle?: string
  sellerSelectProps?: SellerSelectProps
}

export default function Header({ articleTitle, sellerSelectProps }: HeaderProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const email = useAuthStore((state) => state.email)
  const role = useAuthStore((state) => state.role)
  
  // Проверяем, может ли пользователь управлять другими пользователями
  const canManageUsers = role === 'ADMIN' || role === 'MANAGER' || role === 'SELLER'
  
  // Название кнопки в зависимости от роли
  const getUsersButtonLabel = () => {
    if (role === 'ADMIN') return 'Пользователи'
    if (role === 'MANAGER') return 'Селлеры'
    if (role === 'SELLER') return 'Работники'
    return 'Пользователи'
  }

  const isProfilePage = location.pathname === '/profile'
  const isAnalyticsPage = location.pathname === '/analytics'
  const isArticlePage = location.pathname.startsWith('/analytics/article/')
  const isUsersPage = location.pathname === '/users'

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isArticlePage && (
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Вернуться к сводной
          </Button>
        )}
        {isAnalyticsPage && (
          <>
            <Title 
              level={2} 
              style={{ 
                margin: 0,
                fontSize: '24px',
                fontWeight: 600,
                color: '#1E293B'
              }}
            >
              Сводная аналитика
            </Title>
            {sellerSelectProps && (
              <Select
                value={sellerSelectProps.selectedSellerId}
                onChange={sellerSelectProps.onSellerChange}
                style={{ minWidth: 250, marginLeft: '16px' }}
                placeholder="Выберите селлера"
                options={sellerSelectProps.activeSellers.map(seller => ({
                  label: seller.email,
                  value: seller.id,
                }))}
              />
            )}
          </>
        )}
        {isProfilePage && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            Личный кабинет
          </Title>
        )}
        {isUsersPage && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            Управление пользователями
          </Title>
        )}
        {isArticlePage && articleTitle && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            {articleTitle}
          </Title>
        )}
      </div>
      
      <Space size="middle" align="center">
        {email && (
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {email}
          </Text>
        )}
        
        {(isProfilePage || (role === 'ADMIN' || role === 'MANAGER')) && !isAnalyticsPage && (
          <Button
            type="default"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Сводная аналитика
          </Button>
        )}
        
        {canManageUsers && !isUsersPage && (
          <Button
            type="default"
            icon={<TeamOutlined />}
            onClick={() => navigate('/users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {getUsersButtonLabel()}
          </Button>
        )}
        {!isProfilePage && !isArticlePage && !isUsersPage && (
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
        )}
        {isArticlePage && (
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
        )}
        {isUsersPage && (
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
        )}
      </Space>
    </div>
  )
}

