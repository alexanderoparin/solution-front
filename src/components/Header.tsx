import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Space, Typography } from 'antd'
import { UserOutlined, BarChartOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Text, Title } = Typography

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = useAuthStore((state) => state.email)

  const isProfilePage = location.pathname === '/profile'
  const isAnalyticsPage = location.pathname === '/analytics'

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
      <div style={{ flex: 1 }}>
        {isAnalyticsPage && (
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
      </div>
      
      <Space size="middle" align="center">
        {email && (
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {email}
          </Text>
        )}
        
        {isProfilePage && (
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
        
        {!isProfilePage && (
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

