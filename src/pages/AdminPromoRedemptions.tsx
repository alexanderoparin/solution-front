import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { GiftOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { CreatePromoCodeRequest, PromoCodeAdminDto, PromoCodeRedemptionAdminDto } from '../types/api'

const { Title, Text } = Typography

function useIsNarrow(maxWidthPx = 900): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches : false,
  )
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const onChange = () => setNarrow(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [maxWidthPx])
  return narrow
}

function formatDateTime(value: string | null | undefined, compact: boolean): string {
  if (!value) return '—'
  return dayjs(value).format(compact ? 'DD.MM.YY HH:mm' : 'DD.MM.YYYY HH:mm')
}

const GRANT_TYPE_LABELS: Record<string, string> = {
  FULL_ACCESS: 'Полный доступ',
}

export default function AdminPromoRedemptions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isNarrow = useIsNarrow(900)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [codeFilter, setCodeFilter] = useState<string | undefined>(undefined)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm<{
    code: string
    description?: string
    durationDays: number
    grantType?: string
    active?: boolean
    validFrom?: Dayjs | null
    validTo?: Dayjs | null
  }>()

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const { data: promoCodes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['adminPromoCodes'],
    queryFn: () => adminApi.getPromoCodes(),
  })

  const { data: redemptionsPage, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['adminPromoRedemptions', page, pageSize, codeFilter],
    queryFn: () =>
      adminApi.getPromoCodeRedemptions({
        page,
        size: pageSize,
        code: codeFilter,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreatePromoCodeRequest) => adminApi.createPromoCode(data),
    onSuccess: (created) => {
      message.success(`Промокод ${created.code} создан`)
      setCreateOpen(false)
      createForm.resetFields()
      void queryClient.invalidateQueries({ queryKey: ['adminPromoCodes'] })
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message
        ?? 'Не удалось создать промокод'
      message.error(msg)
    },
  })

  const rows = redemptionsPage?.content ?? []
  const total = redemptionsPage?.totalElements ?? 0

  const codeColumns: ColumnsType<PromoCodeAdminDto> = [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null | undefined) => value || '—',
    },
    {
      title: 'Дней',
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 72,
      align: 'right',
    },
    {
      title: 'Тип',
      dataIndex: 'grantType',
      key: 'grantType',
      width: 140,
      render: (value: string) => GRANT_TYPE_LABELS[value] ?? value,
    },
    {
      title: 'Статус',
      dataIndex: 'active',
      key: 'active',
      width: 110,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Активен' : 'Выключен'}</Tag>
      ),
    },
    {
      title: 'Можно с',
      dataIndex: 'validFrom',
      key: 'validFrom',
      width: 150,
      render: (value: string | null | undefined) => formatDateTime(value, isNarrow),
    },
    {
      title: 'Можно до',
      dataIndex: 'validTo',
      key: 'validTo',
      width: 150,
      render: (value: string | null | undefined) => formatDateTime(value, isNarrow),
    },
    {
      title: 'Создан',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string | null | undefined) => formatDateTime(value, isNarrow),
    },
  ]

  const redemptionColumns: ColumnsType<PromoCodeRedemptionAdminDto> = [
    {
      title: '№',
      key: 'index',
      width: 56,
      render: (_value, _record, index) => page * pageSize + index + 1,
    },
    {
      title: 'Пользователь',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Промокод',
      dataIndex: 'promoCode',
      key: 'promoCode',
      width: 120,
    },
    {
      title: isNarrow ? 'Использован' : 'Дата использования',
      dataIndex: 'redeemedAt',
      key: 'redeemedAt',
      width: isNarrow ? 128 : 180,
      render: (value: string) => formatDateTime(value, isNarrow),
    },
    {
      title: 'Сгорает',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: isNarrow ? 128 : 180,
      render: (value: string) => formatDateTime(value, isNarrow),
    },
  ]

  const openCreate = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      durationDays: 14,
      grantType: 'FULL_ACCESS',
      active: true,
    })
    setCreateOpen(true)
  }

  const handleCreateSubmit = () => {
    createForm.validateFields().then((values) => {
      if (values.validFrom && values.validTo && values.validTo.isBefore(values.validFrom)) {
        message.error('Дата «можно до» не может быть раньше «можно с»')
        return
      }
      const payload: CreatePromoCodeRequest = {
        code: values.code.trim(),
        description: values.description?.trim() || undefined,
        durationDays: values.durationDays,
        grantType: values.grantType || 'FULL_ACCESS',
        active: values.active ?? true,
        validFrom: values.validFrom ? values.validFrom.format('YYYY-MM-DDTHH:mm:ss') : null,
        validTo: values.validTo ? values.validTo.format('YYYY-MM-DDTHH:mm:ss') : null,
      }
      createMutation.mutate(payload)
    })
  }

  return (
    <>
      <style>{`
        .admin-promo-scroll {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        @media (max-width: 900px) {
          .admin-promo-page {
            padding: 12px !important;
            min-width: 0;
          }
          .admin-promo-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            overflow-wrap: anywhere;
          }
          .admin-promo-head {
            align-items: flex-start !important;
            margin-bottom: 16px !important;
            gap: 8px !important;
          }
          .admin-promo-filter {
            max-width: none !important;
            width: 100%;
          }
          .admin-promo-page .ant-card-body {
            padding: 12px !important;
          }
          .admin-promo-item {
            padding: 12px 0;
            border-bottom: 1px solid #E2E8F0;
          }
          .admin-promo-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .admin-promo-item:first-child {
            padding-top: 0;
          }
          .admin-promo-item-top {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
          }
          .admin-promo-item-code {
            font-weight: 600;
            color: #1E293B;
            font-size: 15px;
          }
          .admin-promo-item-email {
            color: #64748B;
            font-size: 13px;
            overflow-wrap: anywhere;
            margin-bottom: 8px;
          }
          .admin-promo-item-meta {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 10px;
            font-size: 13px;
          }
          .admin-promo-item-meta dt {
            color: #94A3B8;
            margin: 0;
          }
          .admin-promo-item-meta dd {
            color: #1E293B;
            margin: 0;
          }
        }
      `}</style>
      <Header />
      <Breadcrumbs />
      <div
        className="admin-promo-page"
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: '0 auto',
          minWidth: 0,
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div className="admin-promo-head" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, minWidth: 0 }}>
          <GiftOutlined style={{ fontSize: isNarrow ? 22 : 28, color: '#7C3AED', flexShrink: 0, marginTop: isNarrow ? 2 : 0 }} />
          <Title className="admin-promo-title" level={2} style={{ margin: 0, minWidth: 0 }}>
            Промокоды
          </Title>
        </div>

        <Card style={{ borderRadius: 12, minWidth: 0 }}>
          <Tabs
            items={[
              {
                key: 'codes',
                label: 'Список промокодов',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                        Добавить промокод
                      </Button>
                    </div>
                    {isNarrow ? (
                      <Spin spinning={codesLoading}>
                        {promoCodes.length === 0 && !codesLoading ? (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет промокодов" />
                        ) : (
                          <div>
                            {promoCodes.map((promo) => (
                              <div key={promo.id} className="admin-promo-item">
                                <div className="admin-promo-item-top">
                                  <span className="admin-promo-item-code">{promo.code}</span>
                                  <Tag color={promo.active ? 'green' : 'default'}>
                                    {promo.active ? 'Активен' : 'Выключен'}
                                  </Tag>
                                </div>
                                {promo.description ? (
                                  <div className="admin-promo-item-email">{promo.description}</div>
                                ) : null}
                                <dl className="admin-promo-item-meta">
                                  <dt>Дней</dt>
                                  <dd>{promo.durationDays}</dd>
                                  <dt>Тип</dt>
                                  <dd>{GRANT_TYPE_LABELS[promo.grantType] ?? promo.grantType}</dd>
                                  <dt>Можно с</dt>
                                  <dd>{formatDateTime(promo.validFrom, true)}</dd>
                                  <dt>Можно до</dt>
                                  <dd>{formatDateTime(promo.validTo, true)}</dd>
                                  <dt>Создан</dt>
                                  <dd>{formatDateTime(promo.createdAt, true)}</dd>
                                </dl>
                              </div>
                            ))}
                          </div>
                        )}
                      </Spin>
                    ) : (
                      <div className="admin-promo-scroll">
                        <Table<PromoCodeAdminDto>
                          rowKey="id"
                          loading={codesLoading}
                          columns={codeColumns}
                          dataSource={promoCodes}
                          pagination={false}
                          size="small"
                          scroll={{ x: 900 }}
                        />
                      </div>
                    )}
                  </Space>
                ),
              },
              {
                key: 'redemptions',
                label: 'Использования',
                children: (
                  <>
                    <div className="admin-promo-filter" style={{ marginBottom: 16, maxWidth: 280 }}>
                      <Select
                        allowClear
                        placeholder="Фильтр по промокоду"
                        style={{ width: '100%' }}
                        value={codeFilter}
                        onChange={(value) => {
                          setCodeFilter(value)
                          setPage(0)
                        }}
                        options={promoCodes.map((promo) => ({
                          value: promo.code,
                          label: promo.code,
                        }))}
                      />
                    </div>

                    {isNarrow ? (
                      <Spin spinning={redemptionsLoading}>
                        {rows.length === 0 && !redemptionsLoading ? (
                          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет использований" />
                        ) : (
                          <div>
                            {rows.map((row, index) => (
                              <div key={row.id} className="admin-promo-item">
                                <div className="admin-promo-item-top">
                                  <span className="admin-promo-item-code">{row.promoCode}</span>
                                  <span style={{ color: '#94A3B8', fontSize: 12 }}>№ {page * pageSize + index + 1}</span>
                                </div>
                                <div className="admin-promo-item-email">{row.email}</div>
                                <dl className="admin-promo-item-meta">
                                  <dt>Использован</dt>
                                  <dd>{formatDateTime(row.redeemedAt, true)}</dd>
                                  <dt>Сгорает</dt>
                                  <dd>{formatDateTime(row.expiresAt, true)}</dd>
                                </dl>
                              </div>
                            ))}
                          </div>
                        )}
                        {total > pageSize ? (
                          <Pagination
                            current={page + 1}
                            pageSize={pageSize}
                            total={total}
                            onChange={(nextPage) => setPage(nextPage - 1)}
                            showSizeChanger={false}
                            style={{ marginTop: 16, textAlign: 'center' }}
                          />
                        ) : null}
                      </Spin>
                    ) : (
                      <div className="admin-promo-scroll">
                        <Table<PromoCodeRedemptionAdminDto>
                          rowKey="id"
                          loading={redemptionsLoading}
                          columns={redemptionColumns}
                          dataSource={rows}
                          pagination={{
                            current: page + 1,
                            pageSize,
                            total,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            onChange: (nextPage, nextSize) => {
                              setPage(nextPage - 1)
                              setPageSize(nextSize)
                            },
                          }}
                          scroll={{ x: 720 }}
                        />
                      </div>
                    )}
                  </>
                ),
              },
            ]}
          />
        </Card>

        <div style={{ marginTop: 16 }}>
          <Button className="admin-promo-back" onClick={() => navigate('/profile')}>
            Назад в профиль
          </Button>
        </div>
      </div>

      <Modal
        title="Новый промокод"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onOk={handleCreateSubmit}
        confirmLoading={createMutation.isPending}
        okText="Создать"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            durationDays: 14,
            grantType: 'FULL_ACCESS',
            active: true,
          }}
        >
          <Form.Item
            name="code"
            label="Код"
            rules={[
              { required: true, message: 'Укажите код' },
              { max: 64, message: 'Не длиннее 64 символов' },
            ]}
          >
            <Input placeholder="FOCUS14" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={2} placeholder="Для фокус-группы, 14 дней полного доступа" />
          </Form.Item>
          <Form.Item
            name="durationDays"
            label="Срок доступа, дней"
            rules={[{ required: true, message: 'Укажите срок' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="grantType" label="Тип доступа">
            <Select
              options={[
                { value: 'FULL_ACCESS', label: 'Полный доступ' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="validFrom"
            label="Можно вводить с"
            tooltip="Пусто — без ограничения. До этой даты код ещё нельзя активировать."
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>
          <Form.Item
            name="validTo"
            label="Можно вводить до"
            tooltip="Пусто — без ограничения. После этой даты код уже нельзя активировать."
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>
          <Form.Item name="active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
