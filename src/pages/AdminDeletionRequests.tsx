import { useNavigate } from 'react-router-dom'
import { Button, Card, Table, Tag, Typography, message, Modal, Space } from 'antd'
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

export default function AdminDeletionRequests() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)

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
      render: (reason) => deletionReasonLabel(reason),
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      render: (comment: string | null) => comment?.trim() || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (status: keyof typeof STATUS_LABELS) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: 'Создана',
      dataIndex: 'createdAt',
      width: 140,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Обработана',
      dataIndex: 'processedAt',
      width: 140,
      render: (value: string | null) => (value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      title: 'Кем',
      dataIndex: 'processedByEmail',
      ellipsis: true,
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
      <Header />
      <Breadcrumbs />
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>Заявки на удаление аккаунтов</Title>
            <Text type="secondary">Одобрение запускает фоновое удаление пользователя и связанных данных.</Text>
          </div>
          <Card>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={requests}
              loading={isLoading}
              scroll={{ x: 1100 }}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              locale={{ emptyText: 'Нет заявок на удаление' }}
            />
          </Card>
        </Space>
      </div>
    </>
  )
}
