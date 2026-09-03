import { Result, Button, Typography, Spin } from 'antd'
import { Link } from 'react-router-dom'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'
import { useCabinetSectionAccess } from '../hooks/useCabinetSectionAccess'
import { CABINET_ACCESS_SECTION_LABELS } from '../constants/cabinetAccessSections'
import type { CabinetAccessSection } from '../types/api'

const { Text } = Typography

interface CabinetSectionGuardProps {
  section: CabinetAccessSection
  children: React.ReactNode
}

/**
 * Пускает на страницу раздела только при наличии соответствующего доступа к выбранному кабинету.
 * Меню сверху всегда показывает все разделы — при отказе отображается сообщение.
 * Селектор кабинета остаётся в шапке, чтобы можно было переключиться на кабинет с нужным разделом.
 */
export default function CabinetSectionGuard({ section, children }: CabinetSectionGuardProps) {
  const { hasSection, isReady, cabinets, cabinetId, setCabinetId } = useCabinetSectionAccess()

  const cabinetSelectProps =
    cabinets.length > 0
      ? {
          cabinets,
          selectedCabinetId: cabinetId,
          onCabinetChange: setCabinetId,
        }
      : undefined

  if (!isReady) {
    return (
      <div>
        <Header cabinetSelectProps={cabinetSelectProps} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </div>
    )
  }

  if (!hasSection(section)) {
    const sectionLabel = CABINET_ACCESS_SECTION_LABELS[section]
    const canSwitchCabinet = cabinets.length > 1
    return (
      <div>
        <Header cabinetSelectProps={cabinetSelectProps} />
        <div style={{ padding: '16px 24px' }}>
          <Breadcrumbs />
        </div>
        <div style={{ padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
          <Result
            status="403"
            title="Доступ запрещён"
            subTitle={
              <Text type="secondary" style={{ fontSize: 15 }}>
                У вас нет доступа к разделу «{sectionLabel}» для выбранного кабинета.
                {canSwitchCabinet
                  ? ' Выберите другой кабинет в шапке или обратитесь к владельцу, чтобы расширить права доступа.'
                  : ' Обратитесь к владельцу кабинета, чтобы расширить права доступа.'}
              </Text>
            }
            extra={
              <Link to="/profile">
                <Button type="primary" style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}>
                  Перейти в профиль
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
