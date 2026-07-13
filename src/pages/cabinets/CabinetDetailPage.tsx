import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Spin, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import Header from '../../components/Header'
import Breadcrumbs from '../../components/Breadcrumbs'
import CabinetAccessPanel from './CabinetAccessPanel'
import { getRequestFailureDescription } from '../../utils/requestError'
import { buildScopeStatusTooltip, ScopeStatusIcon } from '../../utils/scopeStatusUi'
import { formatCabinetAdminDate, maskApiKeyPreview } from '../../utils/cabinetAdminUtils'

dayjs.locale('ru')

const { Title, Text } = Typography

function tokenTypeLabel(tokenType?: 'PERSONAL' | 'BASIC' | null): string {
  if (tokenType === 'PERSONAL') return 'Персональный'
  return 'Базовый'
}

export default function CabinetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cabinetId = id ? Number(id) : NaN

  const {
    data: cabinet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cabinet', cabinetId],
    queryFn: () => cabinetsApi.getById(cabinetId),
    enabled: Number.isFinite(cabinetId) && cabinetId > 0,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) return false
      return failureCount < 2
    },
  })

  const httpStatus = (error as { response?: { status?: number } })?.response?.status

  if (!Number.isFinite(cabinetId) || cabinetId <= 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />
        <Breadcrumbs />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          <Alert type="error" message="Некорректный идентификатор кабинета" showIcon />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Header />
      <Breadcrumbs />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/profile" style={{ color: '#7C3AED', fontSize: 14 }}>
            ← К списку кабинетов
          </Link>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type={httpStatus === 403 ? 'warning' : 'error'}
            showIcon
            message={httpStatus === 403 ? 'Нет доступа' : 'Ошибка загрузки'}
            description={
              httpStatus === 403
                ? 'Управление кабинетом доступно только владельцу или администратору.'
                : getRequestFailureDescription(error)
            }
            action={
              httpStatus === 403 ? (
                <a onClick={() => navigate('/profile')} style={{ color: '#7C3AED' }}>
                  К кабинетам
                </a>
              ) : undefined
            }
          />
        ) : cabinet ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    {cabinet.name}
                  </Title>
                  <Text type="secondary">ID кабинета: {cabinet.id}</Text>
                </div>
                <Tag color={cabinet.apiKey?.isValid === true ? 'success' : cabinet.apiKey?.isValid === false ? 'error' : 'default'}>
                  {cabinet.apiKey?.isValid === true
                    ? 'Ключ валиден'
                    : cabinet.apiKey?.isValid === false
                      ? 'Ключ невалиден'
                      : 'Ключ не проверен'}
                </Tag>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    API-ключ
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {cabinet.apiKey?.apiKey ? (
                      <Text code style={{ fontSize: 12 }}>
                        {maskApiKeyPreview(cabinet.apiKey.apiKey)}
                      </Text>
                    ) : (
                      <Text type="secondary">не задан</Text>
                    )}
                    <Tag style={{ marginLeft: 8 }}>{tokenTypeLabel(cabinet.apiKey?.tokenType ?? null)}</Tag>
                  </div>
                  {cabinet.apiKey?.validationError && (
                    <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      {cabinet.apiKey.validationError}
                    </Text>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Последняя проверка ключа
                    </Text>
                    <div>
                      <Text style={{ fontSize: 12 }}>{formatCabinetAdminDate(cabinet.apiKey?.lastValidatedAt ?? null)}</Text>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Обновление данных
                    </Text>
                    <div>
                      <Text style={{ fontSize: 12 }}>
                        {formatCabinetAdminDate(cabinet.apiKey?.lastDataUpdateAt ?? cabinet.lastDataUpdateAt)}
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Обновление остатков
                    </Text>
                    <div>
                      <Text style={{ fontSize: 12 }}>
                        {formatCabinetAdminDate(cabinet.apiKey?.lastStocksUpdateAt ?? cabinet.lastStocksUpdateAt ?? null)}
                      </Text>
                    </div>
                  </div>
                </div>
                {cabinet.scopeStatuses && cabinet.scopeStatuses.length > 0 && (
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                      Доступ к категориям WB API
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                      {cabinet.scopeStatuses.map((s) => (
                        <Tooltip
                          key={s.category}
                          title={
                            <span style={{ whiteSpace: 'pre-line' }}>
                              {buildScopeStatusTooltip(s, 'Последняя проверка')}
                            </span>
                          }
                          overlayInnerStyle={{ maxWidth: 520 }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <ScopeStatusIcon s={s} fontSize={12} />
                            <span>{s.categoryDisplayName}</span>
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CabinetAccessPanel cabinetId={cabinet.id} />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
