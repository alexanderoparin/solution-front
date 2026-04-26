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

export function CabinetTableKeyColumn({ row }: { row: ManagedCabinetRowDto }) {
  const cab = row.cabinet
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
  } = useCabinetTableRowAdmin()

  const validTag =
    cab.apiKey?.isValid === true ? (
      <Tag color="success" style={tagStyle}>
        Валиден
      </Tag>
    ) : cab.apiKey?.isValid === false ? (
      <Tag color="error" style={tagStyle}>
        Не валиден
      </Tag>
    ) : (
      <Tag style={tagStyle}>Не проверялся</Tag>
    )

  if (editingKey) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minWidth: 0, maxWidth: '100%' }}>
        <Input.Password
          placeholder="Новый ключ"
          value={editKeyValue}
          onChange={(e) => setEditKeyValue(e.target.value)}
          style={{ width: '100%', maxWidth: 200, fontFamily: 'monospace', fontSize: 11 }}
          autoComplete="off"
          size="small"
        />
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
        <Space size={4}>
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
          <Button size="small" onClick={() => { setEditingKey(false); setEditKeyValue(''); setEditTokenType(cab.apiKey?.tokenType ?? 'BASIC') }}>
            Отмена
          </Button>
        </Space>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth: '100%' }}>
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
        <Tag color="blue" style={tagStyle}>
          {tokenTypeLabel(cab.apiKey?.tokenType ?? null)}
        </Tag>
        <Tooltip
          title={
            validateCooldown > 0
              ? `Через ${validateCooldown} сек`
              : 'Проверить ключ'
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
        {validTag}
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
  )
}
