import { Result, Button, Typography } from 'antd'
import { Link } from 'react-router-dom'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'
import { useCabinetSectionAccess } from '../hooks/useCabinetSectionAccess'
import { CABINET_ACCESS_SECTION_LABELS } from '../constants/cabinetAccessSections'
import type { CabinetAccessSection } from '../types/api'
import { Spin } from 'antd'

const { Text } = Typography

interface CabinetSectionGuardProps {
  section: CabinetAccessSection
  children: React.ReactNode
}

/**
 * Пускает на страницу раздела только при наличии соответствующего доступа к выбранному кабинету.
 * Меню сверху всегда показывает все разделы — при отказе отображается сообщение.
 */
export default function CabinetSectionGuard({ section, children }: CabinetSectionGuardProps) {
  const { hasSection, isReady } = useCabinetSectionAccess()

  if (!isReady) {
    return (
      <div>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </div>
    )
  }

  if (!hasSection(section)) {
    const sectionLabel = CABINET_ACCESS_SECTION_LABELS[section]
    return (
      <div>
        <Header />
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
                Обратитесь к владельцу кабинета, чтобы расширить права доступа.
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
