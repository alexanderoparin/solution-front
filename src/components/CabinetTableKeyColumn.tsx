import { useEffect, useState } from 'react'
import { Button, Divider, Input, Modal, Select, Tag, Tooltip, Typography, message } from 'antd'
import { EditOutlined, CheckCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import type { CabinetTokenType, ManagedCabinetRowDto } from '../types/api'
import { useCabinetTableRowAdmin } from './CabinetTableRowAdminContext'
import { formatCabinetAdminDate, maskApiKeyPreview } from '../utils/cabinetAdminUtils'

const { Text } = Typography

const tagStyle = { margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }
const keyRowActionsStyle = { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 } as const
/** Ширина карандаша в строке Seller — spacer в Performance для выравнивания колонок. */
const editButtonSpacerStyle = { width: 28, minWidth: 28, flexShrink: 0 } as const
const PERF_EXPANDED_STORAGE_PREFIX = 'ozon_perf_key_expanded:'

function readPerfExpanded(cabinetId: number): boolean {
  try {
    return localStorage.getItem(`${PERF_EXPANDED_STORAGE_PREFIX}${cabinetId}`) === '1'
  } catch {
    return false
  }
}

function writePerfExpanded(cabinetId: number, expanded: boolean) {
  try {
    localStorage.setItem(`${PERF_EXPANDED_STORAGE_PREFIX}${cabinetId}`, expanded ? '1' : '0')
  } catch {
    // ignore
  }
}

const tokenTypeLabel = (tokenType?: 'PERSONAL' | 'BASIC' | null): string => {
  if (tokenType === 'PERSONAL') return 'Персональный'
  return 'Базовый'
}
const tokenTypeColor = (tokenType?: 'PERSONAL' | 'BASIC' | null): 'cyan' | 'blue' => {
  if (tokenType === 'PERSONAL') return 'cyan'
  return 'blue'
}

const ozonSubscriptionTagColor = (
  type?: string | null,
  funnelAvailable?: boolean | null
): 'gold' | 'purple' | 'default' | 'orange' => {
  if (type === 'PREMIUM_PLUS' || type === 'PREMIUM_PRO') return 'purple'
  if (type === 'PREMIUM' || type === 'PREMIUM_LITE') return 'gold'
  if (funnelAvailable === false) return 'orange'
  return 'default'
}

function ozonSubscriptionTag(cab: ManagedCabinetRowDto['cabinet']) {
  const label = cab.ozonSubscriptionTypeDisplayName ?? cab.ozonSubscriptionType
  if (!label) return null
  const funnelHint =
    cab.ozonAnalyticsFunnelAvailable === false
      ? 'Воронка analytics недоступна (нужен Premium Plus)'
      : cab.ozonAnalyticsFunnelAvailable === true
        ? 'Воронка analytics доступна'
        : 'Воронка не проверялась'
  const checkedAt = formatCabinetAdminDate(cab.ozonSubscriptionCheckedAt ?? null)
  return (
    <Tooltip title={`${funnelHint}${checkedAt ? ` · ${checkedAt}` : ''}`}>
      <Tag color={ozonSubscriptionTagColor(cab.ozonSubscriptionType, cab.ozonAnalyticsFunnelAvailable)} style={tagStyle}>
        {label}
      </Tag>
    </Tooltip>
  )
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
    credentialsModalOpen,
    setCredentialsModalOpen,
    validateKeyMutation,
    validatePerformanceMutation,
    updateCredentialsMutation,
  } = useCabinetTableRowAdmin()

  const isOzon = cab.marketplaceType === 'OZON'
  const performanceClientId = cab.apiKey?.ozonPerformanceClientId ?? null
  const performanceClientSecret = cab.apiKey?.ozonPerformanceClientSecret ?? null
  const performanceConfigured = Boolean(cab.apiKey?.ozonPerformanceConfigured)
  const [perfExpanded, setPerfExpanded] = useState(() => readPerfExpanded(cab.id))

  const [editApiKey, setEditApiKey] = useState('')
  const [editTokenType, setEditTokenType] = useState<CabinetTokenType>('BASIC')
  const [editOzonClientId, setEditOzonClientId] = useState('')
  const [editPerfClientId, setEditPerfClientId] = useState('')
  const [editPerfClientSecret, setEditPerfClientSecret] = useState('')

  useEffect(() => {
    setPerfExpanded(readPerfExpanded(cab.id))
  }, [cab.id])

  const setPerfExpandedPersisted = (expanded: boolean) => {
    setPerfExpanded(expanded)
    writePerfExpanded(cab.id, expanded)
  }

  const openCredentialsModal = () => {
    setEditApiKey(cab.apiKey?.apiKey ?? '')
    setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC')
    setEditOzonClientId(cab.apiKey?.ozonClientId ?? '')
    setEditPerfClientId(performanceClientId ?? '')
    setEditPerfClientSecret(performanceClientSecret ?? '')
    setCredentialsModalOpen(true)
  }

  const closeCredentialsModal = () => {
    if (updateCredentialsMutation.isPending) return
    setCredentialsModalOpen(false)
  }

  const saveCredentials = () => {
    const apiKey = editApiKey.trim()
    const currentApiKey = cab.apiKey?.apiKey?.trim() ?? ''
    const currentTokenType = cab.apiKey?.tokenType ?? 'BASIC'
    const currentOzonClientId = cab.apiKey?.ozonClientId?.trim() ?? ''
    const currentPerfClientId = performanceClientId?.trim() ?? ''
    const currentPerfClientSecret = performanceClientSecret?.trim() ?? ''

    const payload: {
      cabinetId: number
      apiKey?: string
      tokenType?: CabinetTokenType
      ozonClientId?: string
      ozonPerformanceClientId?: string
      ozonPerformanceClientSecret?: string
    } = { cabinetId: cab.id }

    if (apiKey.length > 0 && apiKey !== currentApiKey) {
      payload.apiKey = apiKey
    }
    if (!isOzon && editTokenType !== currentTokenType) {
      payload.tokenType = editTokenType
    }
    if (isOzon) {
      const ozonClientId = editOzonClientId.trim()
      if (ozonClientId !== currentOzonClientId) {
        payload.ozonClientId = ozonClientId
      }
      const perfClientId = editPerfClientId.trim()
      if (perfClientId !== currentPerfClientId) {
        payload.ozonPerformanceClientId = perfClientId
      }
      const perfSecret = editPerfClientSecret.trim()
      if (perfSecret.length > 0 && perfSecret !== currentPerfClientSecret) {
        payload.ozonPerformanceClientSecret = perfSecret
      }
    }

    const hasChanges = Object.keys(payload).some((k) => k !== 'cabinetId')
    if (!hasChanges) {
      message.warning('Нет изменений для сохранения')
      return
    }
    updateCredentialsMutation.mutate(payload)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth: '100%' }}>
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
          {isOzon && ozonSubscriptionTag(cab)}
          <div style={keyRowActionsStyle}>
            <Tooltip
              title={
                validateCooldown > 0
                  ? `Через ${validateCooldown} сек`
                  : !cab.apiKey?.apiKey && isOzon
                    ? 'Сначала задайте Client-Id и Api-Key'
                    : isOzon
                      ? 'Проверить Api-Key Ozon'
                      : 'Проверить ключ'
              }
            >
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => validateKeyMutation.mutate(cab.id)}
                loading={validateKeyMutation.isPending}
                disabled={validateCooldown > 0 || (isOzon && !cab.apiKey?.apiKey?.trim())}
                style={{ flexShrink: 0 }}
              />
            </Tooltip>
            <Tooltip title="Изменить ключ">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={openCredentialsModal}
                style={{ padding: '0 4px', minWidth: 28, flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 2, minWidth: 0, overflow: 'hidden' }}>
          {validityTag(cab.apiKey?.isValid)}
          <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
            {formatCabinetAdminDate(cab.apiKey?.lastValidatedAt ?? null)}
          </Text>
          {isOzon && !perfExpanded && (
            <Tooltip
              title={
                !performanceClientId && !performanceConfigured
                  ? 'Performance не задан — развернуть'
                  : 'Развернуть Performance'
              }
            >
              <button
                type="button"
                onClick={() => setPerfExpandedPersisted(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  margin: 0,
                  marginLeft: 'auto',
                  padding: '0 2px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: '#8c8c8c',
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                <RightOutlined style={{ fontSize: 10 }} />
                <span>Perf</span>
              </button>
            </Tooltip>
          )}
        </div>
        {cab.apiKey?.validationError && (
          <Text type="danger" style={{ fontSize: 11, lineHeight: 1.35 }}>
            {cab.apiKey.validationError}
          </Text>
        )}
      </div>

      {isOzon && perfExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            type="button"
            onClick={() => setPerfExpandedPersisted(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 10 }}>
              Свернуть Performance
            </Text>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
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
                    client_id не задан
                  </Text>
                )}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                {performanceClientSecret ? (
                  <Text
                    code
                    copyable={{ text: performanceClientSecret }}
                    ellipsis={{ tooltip: maskApiKeyPreview(performanceClientSecret) }}
                    style={{ fontSize: 11, fontFamily: 'monospace', margin: 0, display: 'block', maxWidth: '100%' }}
                  >
                    {maskApiKeyPreview(performanceClientSecret)}
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    client_secret не задан
                  </Text>
                )}
              </div>
            </div>
            <Tag color="purple" style={tagStyle}>
              Perf
            </Tag>
            <div style={keyRowActionsStyle}>
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
              <span style={editButtonSpacerStyle} aria-hidden="true" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 2 }}>
            {validityTag(cab.apiKey?.ozonPerformanceIsValid)}
            <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
              {formatCabinetAdminDate(cab.apiKey?.ozonPerformanceLastValidatedAt ?? null)}
            </Text>
          </div>
          {cab.apiKey?.ozonPerformanceValidationError && (
            <Text type="danger" style={{ fontSize: 11, lineHeight: 1.35 }}>
              {cab.apiKey.ozonPerformanceValidationError}
            </Text>
          )}
        </div>
      )}

      <Modal
        title={isOzon ? 'Credentials Ozon' : 'API-ключ WB'}
        open={credentialsModalOpen}
        onCancel={closeCredentialsModal}
        onOk={saveCredentials}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateCredentialsMutation.isPending}
        destroyOnClose
        width={isOzon ? 520 : 440}
      >
        {isOzon ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Text strong style={{ fontSize: 13 }}>Seller API</Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Client-Id</Text>
                  <Input
                    value={editOzonClientId}
                    onChange={(e) => setEditOzonClientId(e.target.value)}
                    placeholder="Ozon Client-Id"
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Api-Key</Text>
                  <Input.Password
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                    placeholder="Ozon Api-Key"
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <Divider style={{ margin: '4px 0' }} />
            <div>
              <Text strong style={{ fontSize: 13 }}>Performance API</Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>client_id</Text>
                  <Input
                    value={editPerfClientId}
                    onChange={(e) => setEditPerfClientId(e.target.value)}
                    placeholder="Performance client_id"
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>client_secret</Text>
                  <Input.Password
                    value={editPerfClientSecret}
                    onChange={(e) => setEditPerfClientSecret(e.target.value)}
                    placeholder="Performance client_secret"
                    style={{ fontFamily: 'monospace', marginTop: 4 }}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>API-ключ</Text>
              <Input.Password
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                placeholder="WB API-ключ"
                style={{ fontFamily: 'monospace', marginTop: 4 }}
                autoComplete="off"
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Тип токена</Text>
              <Select
                value={editTokenType}
                onChange={(value) => setEditTokenType(value)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 'BASIC', label: 'Базовый' },
                  { value: 'PERSONAL', label: 'Персональный' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
