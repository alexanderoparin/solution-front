import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Modal, Spin, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cabinetsApi } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import type { UserBillingActivePackageDto, UserBillingCabinetRowDto } from '../../types/api'
import MarketplaceTypeTag from '../MarketplaceTypeTag'

const accent = '#7C3AED'
const border = '#E2E8F0'

interface AddPackageCabinetsModalProps {
  open: boolean
  pkg: UserBillingActivePackageDto | null
  cabinetRows: UserBillingCabinetRowDto[]
  /** Предвыбор кабинетов (например из кнопки «Подключить» в таблице). */
  preselectedCabinetIds?: number[]
  onClose: () => void
}

/**
 * Добор кабинетов в оплаченный пакет до max тира (без оплаты).
 */
export default function AddPackageCabinetsModal({
  open,
  pkg,
  cabinetRows,
  preselectedCabinetIds,
  onClose,
}: AddPackageCabinetsModalProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const { data: overview, isLoading } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: open,
  })

  const inPackage = useMemo(() => new Set(pkg?.cabinetIds ?? []), [pkg])
  const max = pkg?.maxCabinets ?? 1
  const used = pkg?.cabinetCount ?? 0
  const freeSlots = Math.max(0, max - used)

  const candidates = useMemo(() => {
    const owned = overview?.owned ?? []
    const q = search.trim().toLowerCase()
    return owned.filter((c) => {
      if (inPackage.has(c.id)) return false
      const row = cabinetRows.find((r) => r.cabinetId === c.id)
      if (pkg?.kind === 'MAIN' && row?.unlimitedAccess) return false
      if (pkg?.kind === 'CAMPAIGN' && row?.campaignManage) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    })
  }, [overview, search, inPackage, cabinetRows, pkg?.kind])

  useEffect(() => {
    if (open) {
      setSearch('')
      const initial = (preselectedCabinetIds ?? [])
        .filter((id) => !inPackage.has(id))
        .slice(0, freeSlots)
      setSelectedIds(initial)
    }
  }, [open, pkg?.paymentId, preselectedCabinetIds, inPackage, freeSlots])

  const mutation = useMutation({
    mutationFn: () => {
      if (!pkg?.paymentId) throw new Error('Нет paymentId')
      return subscriptionApi.addPackageCabinets(pkg.paymentId, selectedIds)
    },
    onSuccess: (res) => {
      message.success(res.message || 'Кабинеты добавлены')
      void queryClient.invalidateQueries({ queryKey: ['subscriptionOverview'] })
      onClose()
    },
    onError: (e: { response?: { data?: { message?: string } }; message?: string }) => {
      message.error(e.response?.data?.message ?? e.message ?? 'Не удалось добавить')
    },
  })

  const toggle = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedIds.length >= freeSlots) return
      setSelectedIds((prev) => [...prev, id])
      return
    }
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title="Добавить кабинеты в пакет"
      width={520}
    >
      {pkg && (
        <p style={{ color: '#64748B', marginTop: 0 }}>
          {pkg.title}: занято {used} из {max}. Можно добавить ещё {freeSlots}.
        </p>
      )}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : (
        <>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid ${border}`, borderRadius: 10 }}>
            {candidates.length === 0 ? (
              <div style={{ padding: 16, color: '#94A3B8' }}>Нет подходящих кабинетов</div>
            ) : (
              candidates.map((c) => {
                const checked = selectedIds.includes(c.id)
                const atLimit = !checked && selectedIds.length >= freeSlots
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderBottom: `1px solid ${border}`,
                      opacity: atLimit ? 0.45 : 1,
                      cursor: atLimit ? 'not-allowed' : 'pointer',
                      margin: 0,
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={atLimit}
                      onChange={(e) => toggle(c.id, e.target.checked)}
                    />
                    <MarketplaceTypeTag type={c.marketplaceType} size={18} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ color: '#64748B' }}>{c.id}</span>
                  </label>
                )
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              style={{ background: accent, borderColor: accent }}
              disabled={selectedIds.length === 0}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Добавить ({selectedIds.length})
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
