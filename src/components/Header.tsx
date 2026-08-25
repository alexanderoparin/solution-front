import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { Button, Space, Dropdown, Select } from 'antd'
import { UserOutlined, BarChartOutlined, RiseOutlined, DownOutlined } from '@ant-design/icons'
import SiteLogo from './SiteLogo'
import CampaignManageSubscriptionBadge from './campaignManageSubscription/CampaignManageSubscriptionBadge'
import MarketplaceTypeTag from './MarketplaceTypeTag'
import { landingColors } from '../styles/landing'
import OnboardingHelpButton from './onboarding/OnboardingHelpButton'
import { resolveTourIdForPath } from '../onboarding/resolveTourForPath'
import { ONBOARDING_TARGETS } from '../onboarding/targets'
import { CABINET_HOME_PATH, shouldRedirectOnCabinetSwitch } from '../utils/cabinetSwitchNavigation'
import type { MarketplaceType } from '../types/api'

export interface CabinetSelectProps {
  cabinets: { id: number; name: string; marketplaceType?: MarketplaceType | null }[]
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
  options: {
    value: number
    label: React.ReactNode
    cabinetName?: string
    marketplaceType?: MarketplaceType | null
    searchText?: string
  }[]
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

function isNavPathActive(pathname: string, to: string): boolean {
  if (to === '/analytics') {
    return pathname === '/analytics'
  }
  if (to === '/analytics/products') {
    return pathname === '/analytics/products' || pathname.startsWith('/analytics/article/')
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

function NavMenuLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation()
  const active = isNavPathActive(pathname, to)
  return (
    <Link
      to={to}
      style={{
        color: active ? landingColors.accent : 'inherit',
        textDecoration: 'none',
        fontWeight: active ? 600 : 400,
        display: 'block',
      }}
    >
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
  const navigate = useNavigate()

  const handleCabinetSwitch = useCallback(
    (
      currentCabinetId: number | null | undefined,
      newCabinetId: number,
      cabinetCount: number,
      applyChange: () => void,
    ) => {
      applyChange()
      if (shouldRedirectOnCabinetSwitch(location.pathname, currentCabinetId, newCabinetId, cabinetCount)) {
        navigate(CABINET_HOME_PATH)
      }
    },
    [location.pathname, navigate],
  )

  const selectedCabinetName = useMemo(() => {
    if (workContextCabinetSelect?.options.length) {
      const selected =
        workContextCabinetSelect.value != null
          ? workContextCabinetSelect.options.find((o) => o.value === workContextCabinetSelect.value)
          : workContextCabinetSelect.options[0]
      return selected?.cabinetName ?? undefined
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

  const selectedCabinetMarketplace = useMemo(() => {
    if (workContextCabinetSelect?.options.length) {
      const selected =
        workContextCabinetSelect.value != null
          ? workContextCabinetSelect.options.find((o) => o.value === workContextCabinetSelect.value)
          : workContextCabinetSelect.options[0]
      return selected?.marketplaceType ?? undefined
    }
    if (!cabinetSelectProps?.cabinets.length) return undefined
    const id = cabinetSelectProps.selectedCabinetId
    const cab =
      id != null
        ? cabinetSelectProps.cabinets.find((c) => c.id === id)
        : cabinetSelectProps.cabinets[0]
    return cab?.marketplaceType
  }, [
    workContextCabinetSelect?.value,
    workContextCabinetSelect?.options,
    cabinetSelectProps?.cabinets,
    cabinetSelectProps?.selectedCabinetId,
  ])

  const isOzonCabinet = selectedCabinetMarketplace === 'OZON'

  const advertisingMenuItems = useMemo(() => {
    const items = [
      {
        key: 'campaigns',
        label: <NavMenuLink to="/advertising/campaigns">Рекламные кампании</NavMenuLink>,
      },
      {
        key: 'bidder',
        label: <NavMenuLink to="/advertising/bidder">Управление РК</NavMenuLink>,
      },
    ]
    if (!isOzonCabinet) {
      items.push({
        key: 'ab-test',
        label: <NavMenuLink to="/advertising/ab-test">А/Б-тест</NavMenuLink>,
      })
    }
    return items
  }, [isOzonCabinet])

  const analyticsMenuSelectedKeys = useMemo(() => {
    if (
      location.pathname === '/analytics/products' ||
      location.pathname.startsWith('/analytics/article/')
    ) {
      return ['products']
    }
    if (location.pathname === '/analytics') {
      return ['summary']
    }
    return []
  }, [location.pathname])

  const advertisingMenuSelectedKeys = useMemo(() => {
    if (location.pathname.startsWith('/advertising/campaigns')) return ['campaigns']
    if (location.pathname.startsWith('/advertising/bidder')) return ['bidder']
    if (location.pathname.startsWith('/advertising/ab-test')) return ['ab-test']
    return []
  }, [location.pathname])

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
        backgroundColor: landingColors.darkBg,
        borderBottom: 'none',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }} data-tour-id={ONBOARDING_TARGETS.MAIN_NAV}>
        <SiteLogo variant="wordmark" size={32} to="/analytics/products" title="Аналитика — Товары" />

        {/* Аналитика */}
        <Dropdown
          menu={{
            selectedKeys: analyticsMenuSelectedKeys,
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
          menu={{ items: advertisingMenuItems, selectedKeys: advertisingMenuSelectedKeys }}
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
              optionFilterProp="searchText"
              value={workContextCabinetSelect.value}
              onChange={(v) => {
                const newCabinetId = Number(v)
                handleCabinetSwitch(
                  workContextCabinetSelect.value,
                  newCabinetId,
                  workContextCabinetSelect.options.length,
                  () => workContextCabinetSelect.onChange(newCabinetId),
                )
              }}
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
                  label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span>{c.name}</span>
                      <MarketplaceTypeTag type={c.marketplaceType} />
                    </span>
                  ),
                  onClick: () =>
                    handleCabinetSwitch(
                      cabinetSelectProps.selectedCabinetId,
                      c.id,
                      cabinetSelectProps.cabinets.length,
                      () => cabinetSelectProps.onCabinetChange(c.id),
                    ),
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
                {selectedCabinetName ?? '—'}
                <MarketplaceTypeTag type={selectedCabinetMarketplace} onDark />
                <span style={{ color: muted, fontWeight: 400 }}>({cabinetSelectProps.cabinets.length})</span>
                <DownOutlined style={{ fontSize: 10, color: muted }} />
              </span>
            </Dropdown>
          ) : (
            <span
              style={{
                ...fieldBorderStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '14px',
                color: onDark,
                fontWeight: 500,
              }}
            >
              {selectedCabinetName ?? '—'}
              <MarketplaceTypeTag type={selectedCabinetMarketplace} onDark />
            </span>
          )
        )}
        <CampaignManageSubscriptionBadge />
        <OnboardingHelpButton defaultTourId={resolveTourIdForPath(location.pathname)} />
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
