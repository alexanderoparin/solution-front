import { Button, Tooltip } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import type { ManagedCabinetRowDto } from '../types/api'
import { useCabinetTableRowAdmin } from './CabinetTableRowAdminContext'
import {
  ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES,
  formatCabinetAdminDate,
  canUpdateCabinetData,
  getCabinetRemainingTime,
} from '../utils/cabinetAdminUtils'

export function CabinetTableMainUpdateColumn({ row }: { row: ManagedCabinetRowDto }) {
  const cab = row.cabinet
  const { triggerCabinetUpdateMutation } = useCabinetTableRowAdmin()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {formatCabinetAdminDate(cab.apiKey?.lastDataUpdateAt ?? cab.lastDataUpdateAt)}
      </span>
      <Tooltip
        title={
          canUpdateCabinetData(cab)
            ? 'Карточки, кампании, аналитика'
            : `Кулдаун ${ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES} мин · ${getCabinetRemainingTime(cab) || '…'}`
        }
      >
        <Button
          type="default"
          size="small"
          icon={<SyncOutlined />}
          onClick={() => triggerCabinetUpdateMutation.mutate(cab.id)}
          loading={triggerCabinetUpdateMutation.isPending}
          disabled={!canUpdateCabinetData(cab) || triggerCabinetUpdateMutation.isPending}
          style={{ flexShrink: 0 }}
        />
      </Tooltip>
    </div>
  )
}
