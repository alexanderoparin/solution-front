import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Button, Space, Dropdown, Select } from 'antd'
import { UserOutlined, BarChartOutlined, RiseOutlined, DownOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

interface CabinetSelectProps {
  cabinets: { id: number; name: string }[]
  selectedCabinetId: number | null
  onCabinetChange: (cabinetId: number | null) => void
  loading?: boolean
}

export interface SellerSelectProps {
  sellers: { id: number; email: string }[]
  selectedSellerId: number | undefined
  onSellerChange: (id: number) => void
  loading?: boolean
}

export interface WorkContextCabinetSelectProps {
  options: { value: number; label: string }[]
  value?: number
  onChange: (cabinetId: number) => void
  loading?: boolean
  placeholder?: string
}

interface HeaderProps {
  cabinetSelectProps?: CabinetSelectProps
  /** Для админа/менеджера: выбор продавца и опциональный блок (например кнопка синхронизации) — отображаются слева от «Профиль». */
  sellerSelectProps?: SellerSelectProps
  /**
   * Единый список кабинетов с ключом (имя + email селлера). Если задан — sellerSelectProps и cabinetSelectProps для шапки не показываются.
   */
  workContextCabinetSelect?: WorkContextCabinetSelectProps
  /** Доп. контент справа (кнопка синхронизации и т.п.), показывается рядом с выбором продавца. */
  headerRightExtra?: React.ReactNode
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

function cabinetNameFromWorkContextLabel(label: string): string {
  const i = label.lastIndexOf(' (')
  return i >= 0 ? label.slice(0, i) : label
}

export default function Header({
  cabinetSelectProps,
  sellerSelectProps,
  workContextCabinetSelect,
  headerRightExtra,
}: HeaderProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAuthStore((state) => state.role)

  const selectedCabinetName = useMemo(() => {
    if (workContextCabinetSelect?.value != null && workContextCabinetSelect.options.length > 0) {
      const opt = workContextCabinetSelect.options.find((o) => o.value === workContextCabinetSelect.value)
      if (opt) return cabinetNameFromWorkContextLabel(opt.label)
    }
    if (!cabinetSelectProps?.selectedCabinetId || !cabinetSelectProps.cabinets.length) return undefined
    return cabinetSelectProps.cabinets.find((c) => c.id === cabinetSelectProps.selectedCabinetId)?.name
  }, [
    workContextCabinetSelect?.value,
    workContextCabinetSelect?.options,
    cabinetSelectProps?.selectedCabinetId,
    cabinetSelectProps?.cabinets,
  ])

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

  /** Окантовка: фиолетовая рамка (акцентный цвет), скруглённые углы */
  const fieldBorderStyle: React.CSSProperties = {
    border: '1px solid var(--color-primary)',
    borderRadius: 8,
    background: '#FFFFFF',
    padding: '6px 12px',
    minHeight: 36,
    boxSizing: 'border-box',
  }

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

      </div>

      <Space size="middle" align="center">
        {workContextCabinetSelect && (
          <>
            <Select
              className="header-select-field"
              showSearch
              optionFilterProp="label"
              value={workContextCabinetSelect.value}
              onChange={(v) => workContextCabinetSelect.onChange(Number(v))}
              style={{ minWidth: 280, maxWidth: 420 }}
              placeholder={workContextCabinetSelect.placeholder ?? 'Кабинет'}
              options={workContextCabinetSelect.options}
              loading={workContextCabinetSelect.loading}
              allowClear={false}
            />
            {headerRightExtra}
          </>
        )}
        {!workContextCabinetSelect && sellerSelectProps && sellerSelectProps.sellers.length > 0 && (
          <>
            <Select
              className="header-select-field"
              value={sellerSelectProps.selectedSellerId}
              onChange={sellerSelectProps.onSellerChange}
              style={{ minWidth: 200 }}
              placeholder="Продавец"
              options={sellerSelectProps.sellers.map((s) => ({ label: s.email, value: s.id }))}
              loading={sellerSelectProps.loading}
            />
            {headerRightExtra}
          </>
        )}
        {!workContextCabinetSelect && cabinetSelectProps && cabinetSelectProps.cabinets.length > 0 && (
          cabinetSelectProps.cabinets.length > 1 ? (
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
                  ...fieldBorderStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '14px',
                  color: '#1E293B',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {selectedCabinetName ?? '—'} ({cabinetSelectProps.cabinets.length})
                <DownOutlined style={{ fontSize: 10, color: '#64748B' }} />
              </span>
            </Dropdown>
          ) : (
            <span
              style={{
                ...fieldBorderStyle,
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '14px',
                color: '#1E293B',
                fontWeight: 500,
              }}
            >
              {selectedCabinetName ?? '—'}
            </span>
          )
        )}
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
