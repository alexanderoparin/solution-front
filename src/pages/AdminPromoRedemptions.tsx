import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Select, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { GiftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { PromoCodeRedemptionAdminDto } from '../types/api'

const { Title } = Typography

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD.MM.YYYY HH:mm')
}

export default function AdminPromoRedemptions() {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [codeFilter, setCodeFilter] = useState<string | undefined>(undefined)

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['adminPromoCodes'],
    queryFn: () => adminApi.getPromoCodes(),
  })

  const { data: redemptionsPage, isLoading } = useQuery({
    queryKey: ['adminPromoRedemptions', page, pageSize, codeFilter],
    queryFn: () =>
      adminApi.getPromoCodeRedemptions({
        page,
        size: pageSize,
        code: codeFilter,
      }),
  })

  const columns: ColumnsType<PromoCodeRedemptionAdminDto> = [
    {
      title: '№',
      key: 'index',
      width: 72,
      render: (_value, _record, index) => page * pageSize + index + 1,
    },
    {
      title: 'Почта',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Промокод',
      dataIndex: 'promoCode',
      key: 'promoCode',
      width: 140,
    },
    {
      title: 'Дата использования',
      dataIndex: 'redeemedAt',
      key: 'redeemedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Сгорает',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Регистрация',
      dataIndex: 'userRegisteredAt',
      key: 'userRegisteredAt',
      width: 180,
      render: (value: string | null | undefined) => formatDateTime(value),
    },
  ]

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <GiftOutlined style={{ fontSize: 28, color: '#7C3AED' }} />
          <Title level={2} style={{ margin: 0 }}>
            Промокоды
          </Title>
        </div>

        <Card style={{ borderRadius: 12 }}>
          <div style={{ marginBottom: 16, maxWidth: 280 }}>
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

          <Table<PromoCodeRedemptionAdminDto>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={redemptionsPage?.content ?? []}
            pagination={{
              current: page + 1,
              pageSize,
              total: redemptionsPage?.totalElements ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (nextPage, nextSize) => {
                setPage(nextPage - 1)
                setPageSize(nextSize)
              },
            }}
            scroll={{ x: 900 }}
          />
        </Card>

        <div style={{ marginTop: 16 }}>
          <Button onClick={() => navigate('/profile')}>Назад в профиль</Button>
        </div>
      </div>
    </>
  )
}
