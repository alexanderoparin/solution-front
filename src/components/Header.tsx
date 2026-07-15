import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Button, Space, Dropdown, Select } from 'antd'
import { UserOutlined, BarChartOutlined, RiseOutlined, DownOutlined } from '@ant-design/icons'
import SiteLogo from './SiteLogo'
import CampaignManageSubscriptionBadge from './campaignManageSubscription/CampaignManageSubscriptionBadge'
import { landingColors } from '../styles/landing'

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

function cabinetNameFromWorkContextLabel(label: string): string {
  const i = label.lastIndexOf(' (')
  return i >= 0 ? label.slice(0, i) : label
}

function NavMenuLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{ color: 'inherit', textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

export default function Header({
  cabinetSelectProps,
  sellerSelectProps,
  workContextCabinetSelect,
  headerRightExtra,
}: HeaderProps = {}) {
  const location = useLocation()

  const selectedCabinetName = useMemo(() => {
    if (workContextCabinetSelect?.options.length) {
      if (workContextCabinetSelect.value != null) {
        const opt = workContextCabinetSelect.options.find((o) => o.value === workContextCabinetSelect.value)
        if (opt) return cabinetNameFromWorkContextLabel(opt.label)
      }
      return cabinetNameFromWorkContextLabel(workContextCabinetSelect.options[0].label)
    }
    if (!cabinetSelectProps?.cabinets.length) return undefined
    if (cabinetSelectProps.selectedCabinetId == null) {
      return cabinetSelectProps.cabinets[0].name
    }
    return cabinetSelectProps.cabinets.find((c) => c.id === cabinetSelectProps.selectedCabinetId)?.name
      ?? cabinetSelectProps.cabinets[0].name
  }, [
    workContextCabinetSelect?.value,
    workContextCabinetSelect?.options,
    cabinetSelectProps?.selectedCabinetId,
    cabinetSelectProps?.cabinets,
  ])

  const isAnalyticsActive =
    location.pathname === '/analytics' ||
    location.pathname === '/analytics/products' ||
    location.pathname.startsWith('/analytics/article/')
  const isAdvertisingActive = location.pathname.startsWith('/advertising')
  const isProfilePage = location.pathname === '/profile'
  const isProfileActive = location.pathname === '/profile'

  const muted = landingColors.textOnDarkMuted
  const active = landingColors.accent
  const onDark = landingColors.textOnDark

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } as const

  /** Окантовка кабинета на тёмном хедере */
  const fieldBorderStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    padding: '6px 12px',
    minHeight: 36,
    boxSizing: 'border-box',
  }

  const navColor = (activeNav: boolean) => (activeNav ? active : muted)
  const navWeight = (activeNav: boolean) => (activeNav ? 600 : 500)

  return (
    <div
      style={{
        backgroundColor: 'rgba(11, 11, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <SiteLogo variant="wordmark" size={32} to="/" />

        {/* Аналитика */}
        <Dropdown
          menu={{
            items: [
              { key: 'products', label: <NavMenuLink to="/analytics/products">Товары</NavMenuLink> },
              { key: 'summary', label: <NavMenuLink to="/analytics">Сводная</NavMenuLink> },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<BarChartOutlined />}
            style={{
              ...buttonStyle,
              color: navColor(isAnalyticsActive),
              fontWeight: navWeight(isAnalyticsActive),
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
                label: <NavMenuLink to="/advertising/campaigns">Рекламные кампании</NavMenuLink>,
              },
              {
                key: 'bidder',
                label: <NavMenuLink to="/advertising/bidder">Управление РК</NavMenuLink>,
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
              color: navColor(isAdvertisingActive),
              fontWeight: navWeight(isAdvertisingActive),
            }}
          >
            Реклама
            <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>

      </div>

      <Space size="middle" align="center">
        {!isProfilePage && workContextCabinetSelect && (
          <>
            <Select
              className="header-select-field header-select-field--dark"
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
        {!isProfilePage && !workContextCabinetSelect && sellerSelectProps && sellerSelectProps.sellers.length > 0 && (
          <>
            <Select
              className="header-select-field header-select-field--dark"
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
        {!isProfilePage && !workContextCabinetSelect && cabinetSelectProps && cabinetSelectProps.cabinets.length > 0 && (
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
                  color: onDark,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {selectedCabinetName ?? '—'} ({cabinetSelectProps.cabinets.length})
                <DownOutlined style={{ fontSize: 10, color: muted }} />
              </span>
            </Dropdown>
          ) : (
            <span
              style={{
                ...fieldBorderStyle,
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '14px',
                color: onDark,
                fontWeight: 500,
              }}
            >
              {selectedCabinetName ?? '—'}
            </span>
          )
        )}
        <CampaignManageSubscriptionBadge />
        <Link
          to="/profile"
          className="ant-btn ant-btn-text ant-btn-color-default ant-btn-variant-text"
          style={{
            ...buttonStyle,
            color: navColor(isProfileActive),
            fontWeight: navWeight(isProfileActive),
            textDecoration: 'none',
          }}
        >
          <span className="ant-btn-icon">
            <UserOutlined />
          </span>
          <span>Профиль</span>
        </Link>
      </Space>
    </div>
  )
}
