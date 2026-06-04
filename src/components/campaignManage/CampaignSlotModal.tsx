import { useEffect, useState } from 'react'
import { Modal, InputNumber, Select, Checkbox } from 'antd'
import type { CampaignSlotRepeatMode } from '../../types/analytics'
import { DAY_LABELS, listTimeOptions } from '../../utils/campaignSlotTime'

export interface SlotModalDraft {
  dayOfWeek: number
  startTime: string
  endTime: string
  budgetRub: number
  repeat: boolean
  repeatMode: CampaignSlotRepeatMode
}

interface CampaignSlotModalProps {
  open: boolean
  title: string
  initial: SlotModalDraft
  onCancel: () => void
  onSave: (draft: SlotModalDraft) => void
  saving?: boolean
}

const REPEAT_OPTIONS: { value: CampaignSlotRepeatMode; label: string }[] = [
  { value: 'DAILY', label: 'Ежедневно' },
  { value: 'WEEKENDS', label: 'Только выходные' },
  { value: 'WEEKDAYS', label: 'Только будни' },
]

export default function CampaignSlotModal({
  open,
  title,
  initial,
  onCancel,
  onSave,
  saving,
}: CampaignSlotModalProps) {
  const [draft, setDraft] = useState<SlotModalDraft>(initial)
  const timeOptions = listTimeOptions()

  useEffect(() => {
    if (open) setDraft(initial)
  }, [open, initial])

  const endOptions = timeOptions.filter((t) => t > draft.startTime)

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={() => onSave(draft)}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={saving}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>День</div>
          <Select
            style={{ width: '100%' }}
            value={draft.dayOfWeek}
            onChange={(v) => setDraft((d) => ({ ...d, dayOfWeek: v }))}
            options={DAY_LABELS.map((label, i) => ({ value: i + 1, label }))}
            disabled={draft.repeat}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Начало</div>
            <Select
              style={{ width: '100%' }}
              value={draft.startTime}
              onChange={(v) => setDraft((d) => ({ ...d, startTime: v, endTime: d.endTime <= v ? '' : d.endTime }))}
              options={timeOptions.map((t) => ({ value: t, label: t }))}
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Окончание</div>
            <Select
              style={{ width: '100%' }}
              value={draft.endTime}
              onChange={(v) => setDraft((d) => ({ ...d, endTime: v }))}
              options={(endOptions.length ? endOptions : timeOptions).map((t) => ({ value: t, label: t }))}
              showSearch
              optionFilterProp="label"
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Бюджет слота, ₽</div>
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            value={draft.budgetRub}
            onChange={(v) => setDraft((d) => ({ ...d, budgetRub: v ?? 0 }))}
          />
        </div>
        <Checkbox
          checked={draft.repeat}
          onChange={(e) => setDraft((d) => ({ ...d, repeat: e.target.checked }))}
        >
          Повторять
        </Checkbox>
        {draft.repeat ? (
          <Select
            style={{ width: '100%' }}
            value={draft.repeatMode}
            onChange={(v) => setDraft((d) => ({ ...d, repeatMode: v }))}
            options={REPEAT_OPTIONS}
          />
        ) : null}
      </div>
    </Modal>
  )
}
