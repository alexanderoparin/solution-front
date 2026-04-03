import { Button, Tooltip, Typography } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import type { ManagedCabinetRowDto } from '../types/api'
import { useCabinetTableRowAdmin } from './CabinetTableRowAdminContext'
import {
  STOCKS_UPDATE_COOLDOWN_MINUTES,
  formatCabinetAdminDate,
  canUpdateCabinetStocks,
  getCabinetStocksRemainingTime,
} from '../utils/cabinetAdminUtils'

const { Text } = Typography

export function CabinetTableStocksUpdateColumn({ row }: { row: ManagedCabinetRowDto }) {
  const cab = row.cabinet
  const { triggerCabinetStocksUpdateMutation } = useCabinetTableRowAdmin()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        fontSize: 11,
      }}
    >
      <Text style={{ fontSize: 11, minWidth: 0, flex: 1 }} ellipsis>
        {formatCabinetAdminDate(cab.apiKey?.lastStocksUpdateAt ?? cab.lastStocksUpdateAt ?? null)}
      </Text>
      <Tooltip
        title={
          canUpdateCabinetStocks(cab)
            ? 'Только остатки'
            : `Кулдаун ${STOCKS_UPDATE_COOLDOWN_MINUTES} мин · ${getCabinetStocksRemainingTime(cab) || '…'}`
        }
      >
        <Button
          type="default"
          size="small"
          icon={<SyncOutlined />}
          onClick={() => triggerCabinetStocksUpdateMutation.mutate(cab.id)}
          loading={triggerCabinetStocksUpdateMutation.isPending}
          disabled={!canUpdateCabinetStocks(cab) || triggerCabinetStocksUpdateMutation.isPending}
          style={{ flexShrink: 0 }}
        />
      </Tooltip>
    </div>
  )
}
