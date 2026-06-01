import { Button, Input, Select, Space, Tag, Tooltip, Typography, message } from 'antd'
import { CheckCircleOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons'
import { buildScopeStatusTooltip, ScopeStatusIcon } from '../utils/scopeStatusUi'
import type { CabinetDto } from '../types/api'
import { useCabinetAdminPanel } from '../hooks/useCabinetAdminPanel'
import {
  ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES,
  formatCabinetAdminDate,
  canUpdateCabinetData,
  getCabinetRemainingTime,
  canUpdateCabinetStocks,
  getCabinetStocksRemainingTime,
  maskApiKeyPreview,
  STOCKS_UPDATE_COOLDOWN_MINUTES,
} from '../utils/cabinetAdminUtils'

const { Text } = Typography

const tokenTypeLabel = (tokenType?: 'PERSONAL' | 'BASIC' | null): string => {
  if (tokenType === 'PERSONAL') return 'Персональный'
  return 'Базовый'
}
const tokenTypeColor = (tokenType?: 'PERSONAL' | 'BASIC' | null): 'cyan' | 'blue' => {
  if (tokenType === 'PERSONAL') return 'cyan'
  return 'blue'
}

export function CabinetAdminCard({ cabinet: cab, sellerId }: { cabinet: CabinetDto; sellerId: number }) {
  const {
    validateCooldown,
    editingKey,
    setEditingKey,
    editKeyValue,
    setEditKeyValue,
    editTokenType,
    setEditTokenType,
    validateKeyMutation,
    updateKeyMutation,
    triggerCabinetUpdateMutation,
    triggerCabinetStocksUpdateMutation,
  } = useCabinetAdminPanel(sellerId)

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        boxSizing: 'border-box',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Text strong>{cab.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID кабинета: {cab.id}
        </Text>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          API ключ:
        </Text>
        {editingKey ? (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Ловушка для менеджеров автозаполнения браузера (Yandex/Chromium), чтобы не заполняли поле поиска email-ом. */}
            <input
              type="text"
              autoComplete="username"
              name="wb-api-key-edit-username-trap"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              readOnly
              value=""
            />
            <Input.Password
              placeholder="Новый API ключ"
              value={editKeyValue}
              onChange={(e) => setEditKeyValue(e.target.value)}
              style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
              autoComplete="new-password"
              name="wb-api-key-edit-password"
              id={`wb-api-key-edit-password-${cab.id}`}
              data-lpignore="true"
              data-form-type="other"
            />
            <Select
              value={editTokenType}
              onChange={(value) => setEditTokenType(value)}
              style={{ width: 160 }}
              options={[
                { value: 'BASIC', label: 'Базовый' },
                { value: 'PERSONAL', label: 'Персональный' },
              ]}
            />
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  const key = editKeyValue.trim()
                  const currentTokenType = cab.apiKey?.tokenType ?? 'BASIC'
                  const hasKeyChange = key.length > 0
                  const hasTypeChange = editTokenType !== currentTokenType
                  if (!hasKeyChange && !hasTypeChange) {
                    message.warning('Нет изменений для сохранения')
                    return
                  }
                  updateKeyMutation.mutate({
                    cabinetId: cab.id,
                    ...(hasKeyChange ? { apiKey: key } : {}),
                    ...(hasTypeChange ? { tokenType: editTokenType } : {}),
                  })
                }}
                loading={updateKeyMutation.isPending}
              >
                Сохранить
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setEditingKey(false)
                  setEditKeyValue('')
                  setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC')
                }}
              >
                Отмена
              </Button>
            </Space>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {cab.apiKey?.apiKey ? (
                <Text
                  code
                  copyable={{ text: cab.apiKey.apiKey }}
                  style={{ fontSize: 12, fontFamily: 'monospace', maxWidth: '100%', wordBreak: 'break-all' }}
                >
                  {maskApiKeyPreview(cab.apiKey.apiKey)}
                </Text>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  не задан
                </Text>
              )}
              <Tag color={tokenTypeColor(cab.apiKey?.tokenType ?? null)} style={{ margin: 0 }}>
                {tokenTypeLabel(cab.apiKey?.tokenType ?? null)}
              </Tag>
              <Tooltip title="Редактировать ключ">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingKey(true)
                    setEditKeyValue(cab.apiKey?.apiKey ?? '')
                    setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC')
                  }}
                  style={{ padding: 0, height: 'auto' }}
                />
              </Tooltip>
            </div>
            {cab.apiKey?.validationError && (
              <div style={{ marginTop: 4 }}>
                <Text type="danger" style={{ fontSize: 12 }}>
                  {cab.apiKey.validationError}
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Последняя проверка ключа:
          </Text>
          <div>
            <Text style={{ fontSize: 12 }}>{formatCabinetAdminDate(cab.apiKey?.lastValidatedAt ?? null)}</Text>
          </div>
        </div>
        <div>
          <Tooltip
            title={
              validateCooldown > 0
                ? `Следующая проверка через ${validateCooldown} сек (не чаще 1 раза в 30 сек)`
                : 'Проверка подключения и доступа токена к категориям WB API'
            }
          >
            <span style={{ display: 'inline-block' }}>
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => validateKeyMutation.mutate(cab.id)}
                loading={validateKeyMutation.isPending}
                disabled={validateCooldown > 0}
              >
                Проверить ключ
              </Button>
            </span>
          </Tooltip>
        </div>
        <div style={{ marginLeft: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Основное обновление:
            </Text>
            <div>
              <Text style={{ fontSize: 12 }}>{formatCabinetAdminDate(cab.apiKey?.lastDataUpdateAt ?? cab.lastDataUpdateAt)}</Text>
            </div>
          </div>
          <div>
            <Tooltip
              title={
                canUpdateCabinetData(cab)
                  ? 'Запускает обновление карточек, кампаний и аналитики по этому кабинету.'
                  : `Запуск обновления не чаще одного раза в ${ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES} мин. Через ${getCabinetRemainingTime(cab) || '…'}.`
              }
            >
              <span style={{ display: 'inline-block' }}>
                <Button
                  type="default"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => triggerCabinetUpdateMutation.mutate(cab.id)}
                  loading={triggerCabinetUpdateMutation.isPending}
                  disabled={!canUpdateCabinetData(cab) || triggerCabinetUpdateMutation.isPending}
                >
                  Обновить данные
                </Button>
              </span>
            </Tooltip>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Последнее обновление остатков:
            </Text>
            <div>
              <Text style={{ fontSize: 12 }}>{formatCabinetAdminDate(cab.apiKey?.lastStocksUpdateAt ?? cab.lastStocksUpdateAt ?? null)}</Text>
            </div>
          </div>
          <div>
            <Tooltip
              title={
                canUpdateCabinetStocks(cab)
                  ? 'Запускает только обновление остатков по этому кабинету.'
                  : `Обновление остатков не чаще одного раза в ${STOCKS_UPDATE_COOLDOWN_MINUTES} мин. Через ${getCabinetStocksRemainingTime(cab) || '…'}.`
              }
            >
              <span style={{ display: 'inline-block' }}>
                <Button
                  type="default"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => triggerCabinetStocksUpdateMutation.mutate(cab.id)}
                  loading={triggerCabinetStocksUpdateMutation.isPending}
                  disabled={!canUpdateCabinetStocks(cab) || triggerCabinetStocksUpdateMutation.isPending}
                >
                  Обновить остатки
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      {cab.scopeStatuses && cab.scopeStatuses.length > 0 && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
            Доступ к категориям WB API
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            {cab.scopeStatuses.map((s) => (
              <Tooltip
                key={s.category}
                title={
                  <span style={{ whiteSpace: 'pre-line' }}>
                    {buildScopeStatusTooltip(s, 'Последняя проверка')}
                  </span>
                }
                overlayInnerStyle={{ maxWidth: 520 }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    cursor: 'default',
                  }}
                >
                  <ScopeStatusIcon s={s} fontSize={12} />
                  <span>{s.categoryDisplayName}</span>
                </span>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
