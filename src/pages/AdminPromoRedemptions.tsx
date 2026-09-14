import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Empty, Pagination, Select, Spin, Table, Typography } from 'antd'
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

export default function AdminPromoRedemptions() {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const isNarrow = useIsNarrow(900)
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

  const rows = redemptionsPage?.content ?? []
  const total = redemptionsPage?.totalElements ?? 0

  const columns: ColumnsType<PromoCodeRedemptionAdminDto> = [
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
            Использование промокодов
          </Title>
        </div>

        <Card style={{ borderRadius: 12, minWidth: 0 }}>
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
            <Spin spinning={isLoading}>
              {rows.length === 0 && !isLoading ? (
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
                loading={isLoading}
                columns={columns}
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
        </Card>

        <div style={{ marginTop: 16 }}>
          <Button className="admin-promo-back" onClick={() => navigate('/profile')}>
            Назад в профиль
          </Button>
        </div>
      </div>
    </>
  )
}
