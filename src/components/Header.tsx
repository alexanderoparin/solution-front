import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Button, Space, Dropdown } from 'antd'
import { UserOutlined, BarChartOutlined, RiseOutlined, DownOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

interface CabinetSelectProps {
  cabinets: { id: number; name: string }[]
  selectedCabinetId: number | null
  onCabinetChange: (cabinetId: number | null) => void
  loading?: boolean
}

interface HeaderProps {
  cabinetSelectProps?: CabinetSelectProps
}

/** Инициалы для логотипа: из названия кабинета или "ЛК" по умолчанию */
function getLogoInitials(cabinetName: string | undefined): string {
  if (!cabinetName || !cabinetName.trim()) return 'ЛК'
  const words = cabinetName.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const a = words[0][0] ?? ''
    const b = words[1][0] ?? ''
    return (a + b).toUpperCase()
  }
  if (words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] ?? 'ЛК').toUpperCase()
}

export default function Header({ cabinetSelectProps }: HeaderProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAuthStore((state) => state.role)

  const selectedCabinetName = useMemo(() => {
    if (!cabinetSelectProps?.selectedCabinetId || !cabinetSelectProps.cabinets.length) return undefined
    return cabinetSelectProps.cabinets.find((c) => c.id === cabinetSelectProps.selectedCabinetId)?.name
  }, [cabinetSelectProps?.selectedCabinetId, cabinetSelectProps?.cabinets])

  const logoInitials = useMemo(() => {
    if (location.pathname === '/profile' && role === 'ADMIN') return 'П'
    return getLogoInitials(selectedCabinetName)
  }, [location.pathname, role, selectedCabinetName])

  const isAnalyticsActive =
    location.pathname === '/analytics' ||
    location.pathname === '/analytics/products' ||
    location.pathname.startsWith('/analytics/article/')
  const isAdvertisingActive = location.pathname.startsWith('/advertising')

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } as const

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
        {/* Логотип */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#7C3AED',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {logoInitials}
        </div>

        {/* Аналитика */}
        <Dropdown
          menu={{
            items: [
              { key: 'products', label: 'Товары', onClick: () => navigate('/analytics/products') },
              { key: 'summary', label: 'Сводная', onClick: () => navigate('/analytics') },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<BarChartOutlined />}
            style={{
              ...buttonStyle,
              color: isAnalyticsActive ? '#7C3AED' : '#1E293B',
              fontWeight: isAnalyticsActive ? 600 : 400,
            }}
          >
            Аналитика
            <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>

        {/* Реклама */}
        <Dropdown
          menu={{
            items: [
              {
                key: 'campaigns',
                label: 'Рекламные компании',
                onClick: () => navigate('/advertising/campaigns'),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<RiseOutlined />}
            style={{
              ...buttonStyle,
              color: isAdvertisingActive ? '#7C3AED' : '#1E293B',
              fontWeight: isAdvertisingActive ? 600 : 400,
            }}
          >
            Реклама
            <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>

        {/* Кабинеты */}
        {cabinetSelectProps && cabinetSelectProps.cabinets.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginLeft: 8,
            }}
          >
            {cabinetSelectProps.cabinets.length > 1 ? (
              <Dropdown
                menu={{
                  items: cabinetSelectProps.cabinets.map((c) => ({
                    key: String(c.id),
                    label: c.name,
                    onClick: () => cabinetSelectProps.onCabinetChange(c.id),
                  })),
                }}
                trigger={['click']}
                disabled={cabinetSelectProps.loading}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '14px',
                    color: '#1E293B',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Кабинет ({cabinetSelectProps.cabinets.length})
                  <DownOutlined style={{ fontSize: 10, color: '#64748B' }} />
                </span>
              </Dropdown>
            ) : (
              <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>
                Кабинет (1)
              </span>
            )}
            {selectedCabinetName && (
              <span style={{ fontSize: '14px', color: '#64748B' }}>{selectedCabinetName}</span>
            )}
          </div>
        )}
      </div>

      <Space size="middle" align="center">
        <Button
          type="text"
          icon={<UserOutlined />}
          onClick={() => navigate('/profile')}
          style={{
            ...buttonStyle,
            color: location.pathname === '/profile' ? '#7C3AED' : '#1E293B',
            fontWeight: location.pathname === '/profile' ? 600 : 400,
          }}
        >
          Профиль
        </Button>
      </Space>
    </div>
  )
}
