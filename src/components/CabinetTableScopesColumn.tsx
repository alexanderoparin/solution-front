import { Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, MinusOutlined } from '@ant-design/icons'
import type { ManagedCabinetRowDto } from '../types/api'
import { formatCabinetAdminDate } from '../utils/cabinetAdminUtils'

export function CabinetTableScopesColumn({ row }: { row: ManagedCabinetRowDto }) {
  const list = row.cabinet.scopeStatuses
  if (!list?.length) {
    return <span style={{ color: '#bfbfbf', fontSize: 11 }}>—</span>
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        columnGap: 8,
        rowGap: 2,
        width: '100%',
        minWidth: 0,
      }}
    >
      {list.map((s) => {
        const checkedText = s.lastCheckedAt
          ? `Проверка:\n${formatCabinetAdminDate(s.lastCheckedAt)}`
          : 'Не проверялось'
        const tooltipTitle =
          s.success === false && s.errorMessage ? `${checkedText}\n«${s.errorMessage}»` : checkedText
        return (
          <Tooltip
            key={s.category}
            title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>}
            overlayInnerStyle={{ maxWidth: 400 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                lineHeight: 1.2,
                cursor: 'default',
                color: '#595959',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              {s.success === true && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12, flexShrink: 0 }} />}
              {s.success === false && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12, flexShrink: 0 }} />}
              {s.success !== true && s.success !== false && (
                <MinusOutlined style={{ color: '#8c8c8c', fontSize: 12, flexShrink: 0 }} />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {s.categoryDisplayName}
              </span>
            </span>
          </Tooltip>
        )
      })}
    </div>
  )
}
