import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Badge,
  Card,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import Header from '../../components/Header'
import Breadcrumbs from '../../components/Breadcrumbs'
import NoCabinetsPlaceholder from '../../components/NoCabinetsPlaceholder'
import { formatCabinetAccessSections } from '../../constants/cabinetAccessSections'
import type { GrantedCabinetRowDto, OwnedCabinetRowDto } from '../../types/api'

dayjs.locale('ru')

const { Title, Text } = Typography

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD.MM.YYYY HH:mm')
}

function apiKeyStatusTag(valid: boolean | null | undefined) {
  if (valid === true) return <Tag color="success">Ключ валиден</Tag>
  if (valid === false) return <Tag color="error">Ключ невалиден</Tag>
  return <Tag>Не проверен</Tag>
}

export default function CabinetsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cabinetsOverview', search],
    queryFn: () => cabinetsApi.getOverview(search),
  })

  const owned = data?.owned ?? []
  const granted = data?.granted ?? []

  const ownedColumns = useMemo(
    () => [
      {
        title: 'Название',
        dataIndex: 'name',
        key: 'name',
        render: (name: string, row: OwnedCabinetRowDto) => (
          <Link to={`/cabinets/${row.id}`} style={{ color: '#7C3AED', fontWeight: 500 }}>
            {name}
          </Link>
        ),
      },
      {
        title: 'API-ключ',
        dataIndex: 'apiKeyMasked',
        key: 'apiKeyMasked',
        render: (masked: string | null) => (
          <Text code style={{ fontSize: 12 }}>
            {masked ?? '—'}
          </Text>
        ),
      },
      {
        title: 'Статус ключа',
        dataIndex: 'apiKeyValid',
        key: 'apiKeyValid',
        render: (valid: boolean | null) => apiKeyStatusTag(valid),
      },
      {
        title: 'Создан',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (v: string) => formatDate(v),
      },
      {
        title: 'Обновление данных',
        dataIndex: 'lastDataUpdateAt',
        key: 'lastDataUpdateAt',
        render: (v: string | null) => formatDate(v),
      },
    ],
    [],
  )

  const grantedColumns = useMemo(
    () => [
      {
        title: 'Название',
        dataIndex: 'name',
        key: 'name',
        render: (name: string) => <Text strong>{name}</Text>,
      },
      {
        title: 'Разделы',
        dataIndex: 'sections',
        key: 'sections',
        render: (sections: GrantedCabinetRowDto['sections']) => formatCabinetAccessSections(sections),
      },
      {
        title: 'Доступ с',
        dataIndex: 'accessFrom',
        key: 'accessFrom',
        render: (v: string) => formatDate(v),
      },
      {
        title: 'Доступ до',
        dataIndex: 'accessUntil',
        key: 'accessUntil',
        render: (v: string | null) => formatDate(v),
      },
      {
        title: 'Статус ключа',
        dataIndex: 'apiKeyValid',
        key: 'apiKeyValid',
        render: (valid: boolean | null) => apiKeyStatusTag(valid),
      },
      {
        title: 'Обновление данных',
        dataIndex: 'lastDataUpdateAt',
        key: 'lastDataUpdateAt',
        render: (v: string | null) => formatDate(v),
      },
    ],
    [],
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Header />
      <Breadcrumbs />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Кабинеты
            </Title>
            <Text type="secondary">Управление своими кабинетами и доступами, предоставленными вам</Text>
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Поиск по названию"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClear={() => setSearchInput('')}
            style={{ width: 280 }}
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <span>Созданные вами</span>
                  <Badge count={owned.length} style={{ backgroundColor: '#7C3AED' }} showZero />
                </Space>
              }
              extra={owned.length > 0 ? <NoCabinetsPlaceholder variant="button" /> : null}
              styles={{ body: { padding: owned.length === 0 ? 0 : undefined } }}
            >
              {owned.length === 0 ? (
                <NoCabinetsPlaceholder />
              ) : (
                <Table
                  rowKey="id"
                  columns={ownedColumns}
                  dataSource={owned}
                  pagination={false}
                  loading={isFetching && !isLoading}
                  size="middle"
                />
              )}
            </Card>

            <Card
              title={
                <Space>
                  <span>Доступ предоставлен</span>
                  <Badge count={granted.length} style={{ backgroundColor: '#7C3AED' }} showZero />
                </Space>
              }
            >
              {granted.length === 0 ? (
                <Text type="secondary">Вам ещё не предоставили доступ к чужим кабинетам.</Text>
              ) : (
                <Table
                  rowKey="id"
                  columns={grantedColumns}
                  dataSource={granted}
                  pagination={false}
                  loading={isFetching && !isLoading}
                  size="middle"
                />
              )}
            </Card>
          </Space>
        )}
      </div>
    </div>
  )
}
