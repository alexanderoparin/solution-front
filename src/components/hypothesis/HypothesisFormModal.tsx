import { useEffect, useState } from 'react'
import { Checkbox, DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { ArticleSummary } from '../../types/analytics'
import {
  HYPOTHESIS_CRITERIA,
  type Hypothesis,
  type HypothesisCriterionKey,
  type HypothesisUpsertRequest,
  type HypothesisWorkflowStatus,
} from '../../types/hypothesis'

interface HypothesisFormModalProps {
  open: boolean
  initial: Hypothesis | null
  articles: ArticleSummary[]
  loading?: boolean
  onCancel: () => void
  onSubmit: (request: Omit<HypothesisUpsertRequest, 'workflowStatus'>, workflowStatus: HypothesisWorkflowStatus) => void
}

export default function HypothesisFormModal({
  open,
  initial,
  articles,
  loading,
  onCancel,
  onSubmit,
}: HypothesisFormModalProps) {
  const [nmId, setNmId] = useState<number | undefined>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [period, setPeriod] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [criteria, setCriteria] = useState<HypothesisCriterionKey[]>([])
  const [workflowStatus, setWorkflowStatus] = useState<HypothesisWorkflowStatus>('PREPARATION')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setNmId(initial.nmId)
      setTitle(initial.title)
      setDescription(initial.description || '')
      setPeriod([dayjs(initial.checkFrom), dayjs(initial.checkTo)])
      setCriteria(initial.criteria)
      setWorkflowStatus(initial.workflowStatus)
    } else {
      setNmId(undefined)
      setTitle('')
      setDescription('')
      setPeriod(null)
      setCriteria([])
      setWorkflowStatus('PREPARATION')
    }
  }, [open, initial])

  return (
    <Modal
      open={open}
      title={initial ? 'Редактирование гипотезы' : 'Новая гипотеза'}
      onCancel={onCancel}
      onOk={() => {
        if (nmId == null || !title.trim() || !period?.[0] || !period?.[1] || criteria.length === 0) {
          return
        }
        onSubmit(
          {
            nmId,
            title: title.trim(),
            description: description.trim() || undefined,
            checkFrom: period[0].format('YYYY-MM-DD'),
            checkTo: period[1].format('YYYY-MM-DD'),
            criteria,
          },
          workflowStatus,
        )
      }}
      okText="Сохранить"
      confirmLoading={loading}
      okButtonProps={{
        disabled: nmId == null || !title.trim() || !period?.[0] || !period?.[1] || criteria.length === 0,
        style: { background: '#7C3AED' },
      }}
      width={820}
      destroyOnClose
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div>
          <Form layout="vertical">
            <Form.Item label="Артикул" required>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Выберите артикул"
                value={nmId}
                onChange={setNmId}
                options={articles.map((a) => ({
                  value: a.nmId,
                  label: `${a.nmId}${a.title ? ` — ${a.title}` : ''}`,
                }))}
              />
            </Form.Item>
            <Form.Item label="Название гипотезы" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} />
            </Form.Item>
            <Form.Item label="Описание гипотезы">
              <Input.TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </Form.Item>
            <Form.Item label="Период проверки" required>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                format="DD.MM.YYYY"
                value={period}
                onChange={(v) => setPeriod(v)}
              />
            </Form.Item>
            <Form.Item label="Статус" required>
              <Radio.Group
                value={workflowStatus}
                onChange={(e) => setWorkflowStatus(e.target.value)}
                options={[
                  { value: 'PREPARATION', label: 'Подготовка к тесту' },
                  { value: 'TEST_LAUNCHED', label: 'Тест запущен' },
                ]}
              />
            </Form.Item>
          </Form>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Критерии для оценки</div>
          <Checkbox.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            value={criteria}
            onChange={(values) => setCriteria(values as HypothesisCriterionKey[])}
            options={HYPOTHESIS_CRITERIA.map((c) => ({ value: c.key, label: c.label }))}
          />
        </div>
      </div>
    </Modal>
  )
}
