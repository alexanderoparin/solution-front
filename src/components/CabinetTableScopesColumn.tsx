import { Tooltip } from 'antd'
import type { ManagedCabinetRowDto } from '../types/api'
import { buildScopeStatusTooltip, ScopeStatusIcon } from '../utils/scopeStatusUi'

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
      {list.map((s) => (
        <Tooltip
          key={s.category}
          title={
            <span style={{ whiteSpace: 'pre-line' }}>{buildScopeStatusTooltip(s, 'Проверка')}</span>
          }
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
            <ScopeStatusIcon s={s} fontSize={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {s.categoryDisplayName}
            </span>
          </span>
        </Tooltip>
      ))}
    </div>
  )
}
