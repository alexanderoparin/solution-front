import { useEffect, useState } from 'react'
import { Checkbox, DatePicker, Form, Input, Modal, Radio, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import type { ArticleSummary } from '../../types/analytics'
import {
  HYPOTHESIS_CRITERIA,
  type Hypothesis,
  type HypothesisCriterionKey,
  type HypothesisUpsertRequest,
  type HypothesisWorkflowStatus,
} from '../../types/hypothesis'

dayjs.locale('ru')

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <Form layout="vertical" style={{ minWidth: 0 }}>
          <Form.Item label="Артикул" required>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Выберите артикул"
              value={nmId}
              onChange={setNmId}
              listHeight={360}
              virtual={false}
              options={articles.map((a) => ({
                value: a.nmId,
                label: `${a.nmId}${a.title ? ` — ${a.title}` : ''}`,
                title: a.title || 'Без названия',
                photoUrl: a.photoTm ?? a.photoC246x328 ?? null,
              }))}
              optionRender={(option) => {
                const optionTitle = (option.data as { title?: string }).title ?? 'Без названия'
                const photoUrl = (option.data as { photoUrl?: string | null }).photoUrl
                return (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '2px 0' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        style={{
                          width: 36,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 4,
                          flexShrink: 0,
                          background: '#F1F5F9',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 48,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: '#F1F5F9',
                        }}
                      />
                    )}
                    <div style={{ minWidth: 0, lineHeight: 1.3 }}>
                      <div
                        style={{
                          color: '#0F172A',
                          fontSize: 14,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {optionTitle}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{option.value}</div>
                    </div>
                  </div>
                )
              }}
              labelRender={(props) => {
                const article = articles.find((a) => a.nmId === props.value)
                const articleTitle = article?.title || 'Без названия'
                const photoUrl = article?.photoTm ?? article?.photoC246x328 ?? null
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        style={{
                          width: 28,
                          height: 36,
                          objectFit: 'cover',
                          borderRadius: 4,
                          flexShrink: 0,
                          background: '#F1F5F9',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 36,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: '#F1F5F9',
                        }}
                      />
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {article?.nmId != null ? `${article.nmId} — ${articleTitle}` : articleTitle}
                    </span>
                  </div>
                )
              }}
            />
          </Form.Item>
          <Form.Item label="Название гипотезы" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} />
          </Form.Item>
          <Form.Item label="Описание гипотезы" style={{ marginBottom: 0 }}>
            <Input.TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </Form.Item>
        </Form>

        <Form layout="vertical" style={{ minWidth: 0 }}>
          <Form.Item
            required
            label={null}
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: 'rgba(0, 0, 0, 0.88)', fontSize: 14, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
                Период проверки
              </span>
              <DatePicker.RangePicker
                locale={locale.DatePicker}
                style={{ width: 220, maxWidth: '100%', flex: '0 0 auto' }}
                format="DD.MM.YYYY"
                separator="→"
                allowClear={false}
                inputReadOnly
                value={period}
                onChange={(v) => setPeriod(v)}
                disabledDate={(current) => current != null && current < dayjs().startOf('day')}
              />
            </div>
          </Form.Item>
          <Form.Item label="Статус" required>
            <Radio.Group
              value={workflowStatus}
              onChange={(e) => setWorkflowStatus(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              options={[
                { value: 'PREPARATION', label: 'Подготовка к тесту' },
                { value: 'TEST_LAUNCHED', label: 'Тест запущен' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Критерии для оценки" required style={{ marginBottom: 0 }}>
            <Checkbox.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              value={criteria}
              onChange={(values) => setCriteria(values as HypothesisCriterionKey[])}
              options={HYPOTHESIS_CRITERIA.map((c) => ({ value: c.key, label: c.label }))}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
