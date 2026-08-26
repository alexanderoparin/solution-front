import { Button, Input, Select, Space, Tag, Tooltip, Typography, message } from 'antd'
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ManagedCabinetRowDto } from '../types/api'
import { useCabinetTableRowAdmin } from './CabinetTableRowAdminContext'
import { formatCabinetAdminDate, maskApiKeyPreview } from '../utils/cabinetAdminUtils'

const { Text } = Typography

const tagStyle = { margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }
const tokenTypeLabel = (tokenType?: 'PERSONAL' | 'BASIC' | null): string => {
  if (tokenType === 'PERSONAL') return 'Персональный'
  return 'Базовый'
}
const tokenTypeColor = (tokenType?: 'PERSONAL' | 'BASIC' | null): 'cyan' | 'blue' => {
  if (tokenType === 'PERSONAL') return 'cyan'
  return 'blue'
}

function validityTag(isValid: boolean | null | undefined) {
  if (isValid === true) {
    return (
      <Tag color="success" style={tagStyle}>
        Валиден
      </Tag>
    )
  }
  if (isValid === false) {
    return (
      <Tag color="error" style={tagStyle}>
        Не валиден
      </Tag>
    )
  }
  return <Tag style={tagStyle}>Не проверялся</Tag>
}

export function CabinetTableKeyColumn({ row }: { row: ManagedCabinetRowDto }) {
  const cab = row.cabinet
  const {
    validateCooldown,
    validatePerformanceCooldown,
    editingKey,
    setEditingKey,
    editKeyValue,
    setEditKeyValue,
    editTokenType,
    setEditTokenType,
    editingPerformance,
    setEditingPerformance,
    editPerformanceClientId,
    setEditPerformanceClientId,
    editPerformanceClientSecret,
    setEditPerformanceClientSecret,
    validateKeyMutation,
    validatePerformanceMutation,
    updateKeyMutation,
    updatePerformanceMutation,
  } = useCabinetTableRowAdmin()

  const isOzon = cab.marketplaceType === 'OZON'
  const performanceClientId = cab.apiKey?.ozonPerformanceClientId ?? null
  const performanceConfigured = Boolean(cab.apiKey?.ozonPerformanceConfigured)

  if (editingKey) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
        <Input.Password
          placeholder={isOzon ? 'Новый Api-Key' : 'Новый ключ'}
          value={editKeyValue}
          onChange={(e) => setEditKeyValue(e.target.value)}
          style={{ width: '100%', maxWidth: 200, fontFamily: 'monospace', fontSize: 11 }}
          autoComplete="off"
          size="small"
        />
        {!isOzon && (
          <Select
            size="small"
            value={editTokenType}
            onChange={(value) => setEditTokenType(value)}
            style={{ width: 130 }}
            options={[
              { value: 'BASIC', label: 'Базовый' },
              { value: 'PERSONAL', label: 'Персональный' },
            ]}
          />
        )}
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const key = editKeyValue.trim()
              const currentTokenType = cab.apiKey?.tokenType ?? 'BASIC'
              const hasKeyChange = key.length > 0
              const hasTypeChange = !isOzon && editTokenType !== currentTokenType
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
          <Button size="small" onClick={() => { setEditingKey(false); setEditKeyValue(''); setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC') }}>
            Отмена
          </Button>
        </Space>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, maxWidth: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {cab.apiKey?.apiKey ? (
              <Text
                code
                copyable={{ text: cab.apiKey.apiKey }}
                ellipsis={{ tooltip: maskApiKeyPreview(cab.apiKey.apiKey) }}
                style={{ fontSize: 11, fontFamily: 'monospace', margin: 0, display: 'block', maxWidth: '100%' }}
              >
                {maskApiKeyPreview(cab.apiKey.apiKey)}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: 11 }}>
                не задан
              </Text>
            )}
          </div>
          {!isOzon && (
            <Tag color={tokenTypeColor(cab.apiKey?.tokenType ?? null)} style={tagStyle}>
              {tokenTypeLabel(cab.apiKey?.tokenType ?? null)}
            </Tag>
          )}
          {isOzon && (
            <Tag color="blue" style={tagStyle}>
              Seller
            </Tag>
          )}
          <Tooltip
            title={
              validateCooldown > 0
                ? `Через ${validateCooldown} сек`
                : isOzon ? 'Проверить Api-Key Ozon' : 'Проверить ключ'
            }
          >
            <Button
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => validateKeyMutation.mutate(cab.id)}
              loading={validateKeyMutation.isPending}
              disabled={validateCooldown > 0}
              style={{ flexShrink: 0 }}
            />
          </Tooltip>
          <Tooltip title="Изменить ключ">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingKey(true)
                setEditKeyValue(cab.apiKey?.apiKey ?? '')
                setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC')
              }}
              style={{ padding: '0 4px', minWidth: 28, flexShrink: 0 }}
            />
          </Tooltip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 2 }}>
          {validityTag(cab.apiKey?.isValid)}
          <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
            {formatCabinetAdminDate(cab.apiKey?.lastValidatedAt ?? null)}
          </Text>
        </div>
        {cab.apiKey?.validationError && (
          <Text type="danger" style={{ fontSize: 11, lineHeight: 1.35 }}>
            {cab.apiKey.validationError}
          </Text>
        )}
      </div>

      {isOzon && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {editingPerformance ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <Input
                placeholder="Performance client_id"
                value={editPerformanceClientId}
                onChange={(e) => setEditPerformanceClientId(e.target.value)}
                style={{ width: '100%', maxWidth: 220, fontFamily: 'monospace', fontSize: 11 }}
                autoComplete="off"
                size="small"
              />
              <Input.Password
                placeholder={performanceConfigured ? 'Новый client_secret (необязательно)' : 'Performance client_secret'}
                value={editPerformanceClientSecret}
                onChange={(e) => setEditPerformanceClientSecret(e.target.value)}
                style={{ width: '100%', maxWidth: 220, fontFamily: 'monospace', fontSize: 11 }}
                autoComplete="off"
                size="small"
              />
              <Space size={4}>
                <Button
                  type="primary"
                  size="small"
                  loading={updatePerformanceMutation.isPending}
                  onClick={() => {
                    const clientId = editPerformanceClientId.trim()
                    const clientSecret = editPerformanceClientSecret.trim()
                    const currentClientId = performanceClientId?.trim() ?? ''
                    const hasClientIdChange = clientId.length > 0 && clientId !== currentClientId
                    const hasSecretChange = clientSecret.length > 0
                    if (!hasClientIdChange && !hasSecretChange) {
                      message.warning('Нет изменений для сохранения')
                      return
                    }
                    updatePerformanceMutation.mutate({
                      cabinetId: cab.id,
                      ...(hasClientIdChange ? { ozonPerformanceClientId: clientId } : {}),
                      ...(hasSecretChange ? { ozonPerformanceClientSecret: clientSecret } : {}),
                    })
                  }}
                >
                  Сохранить
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingPerformance(false)
                    setEditPerformanceClientId('')
                    setEditPerformanceClientSecret('')
                  }}
                >
                  Отмена
                </Button>
              </Space>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  {performanceClientId ? (
                    <Text
                      code
                      copyable={{ text: performanceClientId }}
                      ellipsis={{ tooltip: maskApiKeyPreview(performanceClientId) }}
                      style={{ fontSize: 11, fontFamily: 'monospace', margin: 0, display: 'block', maxWidth: '100%' }}
                    >
                      {maskApiKeyPreview(performanceClientId)}
                    </Text>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Performance не задан
                    </Text>
                  )}
                </div>
                <Tag color="purple" style={tagStyle}>
                  Perf
                </Tag>
                <Tooltip
                  title={
                    validatePerformanceCooldown > 0
                      ? `Через ${validatePerformanceCooldown} сек`
                      : 'Проверить Performance credentials'
                  }
                >
                  <Button
                    type="default"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => validatePerformanceMutation.mutate(cab.id)}
                    loading={validatePerformanceMutation.isPending}
                    disabled={validatePerformanceCooldown > 0 || (!performanceClientId && !performanceConfigured)}
                    style={{ flexShrink: 0 }}
                  />
                </Tooltip>
                <Tooltip title="Изменить Performance credentials">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingPerformance(true)
                      setEditPerformanceClientId(performanceClientId ?? '')
                      setEditPerformanceClientSecret('')
                    }}
                    style={{ padding: '0 4px', minWidth: 28, flexShrink: 0 }}
                  />
                </Tooltip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 2 }}>
                {validityTag(cab.apiKey?.ozonPerformanceIsValid)}
                <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                  {formatCabinetAdminDate(cab.apiKey?.ozonPerformanceLastValidatedAt ?? null)}
                </Text>
                {performanceConfigured && (
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    secret задан
                  </Text>
                )}
              </div>
              {cab.apiKey?.ozonPerformanceValidationError && (
                <Text type="danger" style={{ fontSize: 11, lineHeight: 1.35 }}>
                  {cab.apiKey.ozonPerformanceValidationError}
                </Text>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
