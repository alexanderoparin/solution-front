import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Empty, Space, Spin, Table, Tag, Typography, message, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { AccountDeletionRequestAdminDto } from '../types/api'
import { deletionReasonLabel } from '../constants/deletionReasonLabels'

const { Title, Text } = Typography

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
} as const

const STATUS_COLORS = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
} as const

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

export default function AdminDeletionRequests() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isNarrow = useIsNarrow(900)

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['adminDeletionRequests'],
    queryFn: () => adminApi.getDeletionRequests(),
  })

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => adminApi.approveDeletionRequest(requestId),
    onSuccess: (res) => {
      message.success(res.message ?? 'Заявка одобрена')
      void queryClient.invalidateQueries({ queryKey: ['adminDeletionRequests'] })
      void queryClient.invalidateQueries({ queryKey: ['pendingDeletionRequestsCount'] })
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message
        ?? 'Не удалось одобрить заявку'
      message.error(msg)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => adminApi.rejectDeletionRequest(requestId),
    onSuccess: (res) => {
      message.success(res.message ?? 'Заявка отклонена')
      void queryClient.invalidateQueries({ queryKey: ['adminDeletionRequests'] })
      void queryClient.invalidateQueries({ queryKey: ['pendingDeletionRequestsCount'] })
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message
        ?? 'Не удалось отклонить заявку'
      message.error(msg)
    },
  })

  const handleApprove = (record: AccountDeletionRequestAdminDto) => {
    Modal.confirm({
      title: 'Одобрить удаление аккаунта?',
      content: (
        <div>
          <Text>Пользователь: <b>{record.userEmail}</b></Text>
          <br />
          <Text type="secondary">Удаление будет запущено в фоновом режиме.</Text>
        </div>
      ),
      okText: 'Одобрить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: () => approveMutation.mutateAsync(record.id),
    })
  }

  const handleReject = (record: AccountDeletionRequestAdminDto) => {
    Modal.confirm({
      title: 'Отклонить заявку?',
      content: (
        <div>
          <Text>Пользователь: <b>{record.userEmail}</b></Text>
          <br />
          <Text type="secondary">Аккаунт не будет удалён. Пользователь сможет подать заявку снова.</Text>
        </div>
      ),
      okText: 'Отклонить',
      cancelText: 'Отмена',
      onOk: () => rejectMutation.mutateAsync(record.id),
    })
  }

  const columns: ColumnsType<AccountDeletionRequestAdminDto> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 72,
    },
    {
      title: 'Пользователь',
      key: 'user',
      width: 220,
      render: (_, record) => (
        <div>
          <div>{record.userEmail}</div>
          {record.userName && <Text type="secondary">{record.userName}</Text>}
        </div>
      ),
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      width: 200,
      render: (reason) => deletionReasonLabel(reason),
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      width: 200,
      render: (comment: string | null) => comment?.trim() || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 120,
      render: (status: keyof typeof STATUS_LABELS) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Создана',
      dataIndex: 'createdAt',
      width: 140,
      render: (value: string) => formatDateTime(value, false),
    },
    {
      title: 'Обработана',
      dataIndex: 'processedAt',
      width: 140,
      render: (value: string | null) => formatDateTime(value, false),
    },
    {
      title: 'Кем',
      dataIndex: 'processedByEmail',
      ellipsis: true,
      width: 180,
      render: (value: string | null) => value?.trim() || '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        record.status === 'PENDING' ? (
          <Space size={8}>
            <Button
              danger
              size="small"
              loading={approveMutation.isPending}
              onClick={() => handleApprove(record)}
            >
              Одобрить
            </Button>
            <Button
              size="small"
              loading={rejectMutation.isPending}
              onClick={() => handleReject(record)}
            >
              Отклонить
            </Button>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
  ]

  return (
    <>
      <style>{`
        .admin-deletion-scroll {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        @media (max-width: 900px) {
          .admin-deletion-page {
            padding: 12px !important;
            min-width: 0;
          }
          .admin-deletion-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            margin-bottom: 6px !important;
          }
          .admin-deletion-lead {
            display: block;
            font-size: 13px !important;
            line-height: 1.4;
          }
          .admin-deletion-page .ant-card-body {
            padding: 12px !important;
          }
          .admin-deletion-item {
            padding: 14px 0;
            border-bottom: 1px solid #E2E8F0;
          }
          .admin-deletion-item:first-child {
            padding-top: 0;
          }
          .admin-deletion-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .admin-deletion-item-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
          }
          .admin-deletion-item-email {
            font-size: 15px;
            font-weight: 600;
            color: #1E293B;
            overflow-wrap: anywhere;
            margin-bottom: 2px;
          }
          .admin-deletion-item-name {
            font-size: 13px;
            color: #64748B;
            margin-bottom: 10px;
          }
          .admin-deletion-item-meta {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 10px;
            font-size: 13px;
            margin: 0;
          }
          .admin-deletion-item-meta dt {
            color: #94A3B8;
            margin: 0;
          }
          .admin-deletion-item-meta dd {
            color: #1E293B;
            margin: 0;
            overflow-wrap: anywhere;
          }
          .admin-deletion-item-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
          }
          .admin-deletion-item-actions .ant-btn {
            width: 100%;
          }
        }
      `}</style>
      <Header />
      <Breadcrumbs />
      <div
        className="admin-deletion-page"
        style={{
          padding: 24,
          maxWidth: 1400,
          margin: '0 auto',
          minWidth: 0,
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
          backgroundColor: '#F8FAFC',
        }}
      >
        <Space direction="vertical" size={isNarrow ? 'middle' : 'large'} style={{ width: '100%' }}>
          <div>
            <Title className="admin-deletion-title" level={3} style={{ marginBottom: 4 }}>
              Заявки на удаление аккаунтов
            </Title>
            <Text className="admin-deletion-lead" type="secondary">
              Одобрение запускает фоновое удаление пользователя и связанных данных.
            </Text>
          </div>
          <Card style={{ minWidth: 0 }}>
            {isNarrow ? (
              <Spin spinning={isLoading}>
                {requests.length === 0 && !isLoading ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет заявок на удаление" />
                ) : (
                  <div>
                    {requests.map((record) => (
                      <div key={record.id} className="admin-deletion-item">
                        <div className="admin-deletion-item-head">
                          <Text type="secondary">ID {record.id}</Text>
                          <Tag color={STATUS_COLORS[record.status]} style={{ margin: 0 }}>
                            {STATUS_LABELS[record.status]}
                          </Tag>
                        </div>
                        <div className="admin-deletion-item-email">{record.userEmail}</div>
                        {record.userName ? (
                          <div className="admin-deletion-item-name">{record.userName}</div>
                        ) : null}
                        <dl className="admin-deletion-item-meta">
                          <dt>Причина</dt>
                          <dd>{deletionReasonLabel(record.reason)}</dd>
                          <dt>Комментарий</dt>
                          <dd>{record.comment?.trim() || '—'}</dd>
                          <dt>Создана</dt>
                          <dd>{formatDateTime(record.createdAt, true)}</dd>
                          {record.status !== 'PENDING' ? (
                            <>
                              <dt>Обработана</dt>
                              <dd>{formatDateTime(record.processedAt, true)}</dd>
                              <dt>Кем</dt>
                              <dd>{record.processedByEmail?.trim() || '—'}</dd>
                            </>
                          ) : null}
                        </dl>
                        {record.status === 'PENDING' ? (
                          <div className="admin-deletion-item-actions">
                            <Button
                              danger
                              loading={approveMutation.isPending}
                              onClick={() => handleApprove(record)}
                            >
                              Одобрить
                            </Button>
                            <Button
                              loading={rejectMutation.isPending}
                              onClick={() => handleReject(record)}
                            >
                              Отклонить
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Spin>
            ) : (
              <div className="admin-deletion-scroll">
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={requests}
                  loading={isLoading}
                  scroll={{ x: 1400 }}
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  locale={{ emptyText: 'Нет заявок на удаление' }}
                />
              </div>
            )}
          </Card>
        </Space>
      </div>
    </>
  )
}
