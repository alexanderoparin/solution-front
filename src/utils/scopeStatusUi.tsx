import { CheckCircleOutlined, CloseCircleOutlined, MinusOutlined, WarningOutlined } from '@ant-design/icons'
import type { ScopeStatusDto } from '../types/api'
import { formatCabinetAdminDate } from './cabinetAdminUtils'

export function isScopeWriteReadOnly(s: ScopeStatusDto): boolean {
  return s.writeReadOnly === true
}

export function buildScopeStatusTooltip(
  s: ScopeStatusDto,
  checkedLabel: 'Последняя проверка' | 'Проверка' = 'Проверка'
): string {
  const checkedText = s.lastCheckedAt
    ? `${checkedLabel}:\n${formatCabinetAdminDate(s.lastCheckedAt)}`
    : 'Не проверялось'
  const lines: string[] = [checkedText]
  if (isScopeWriteReadOnly(s)) {
    lines.push('Запись: только чтение (управление РК недоступно)')
  } else if (s.success === false && s.errorMessage) {
    lines.push(`«${s.errorMessage}»`)
  }
  return lines.join('\n')
}

export function ScopeStatusIcon({
  s,
  fontSize = 12,
}: {
  s: ScopeStatusDto
  fontSize?: number
}) {
  if (isScopeWriteReadOnly(s)) {
    return <WarningOutlined style={{ color: '#faad14', fontSize, flexShrink: 0 }} />
  }
  if (s.success === true) {
    return <CheckCircleOutlined style={{ color: '#52c41a', fontSize, flexShrink: 0 }} />
  }
  if (s.success === false) {
    return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize, flexShrink: 0 }} />
  }
  return <MinusOutlined style={{ color: '#8c8c8c', fontSize, flexShrink: 0 }} />
}
