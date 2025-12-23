import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Button, Space, Typography, Select, Tooltip, message, Popover, Checkbox, Input } from 'antd'
import { UserOutlined, BarChartOutlined, ArrowLeftOutlined, TeamOutlined, SyncOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { userApi } from '../api/user'
import type { UserListItem } from '../types/api'
import type { ArticleSummary } from '../types/analytics'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface SellerSelectProps {
  selectedSellerId?: number
  activeSellers: UserListItem[]
  onSellerChange: (sellerId: number | undefined) => void
}

interface ArticleFilterProps {
  articles: ArticleSummary[]
  excludedNmIds: Set<number>
  onExcludedNmIdsChange: (excludedNmIds: Set<number>) => void
  articleSearchText: string
  onArticleSearchTextChange: (text: string) => void
}

interface HeaderProps {
  articleTitle?: string
  sellerSelectProps?: SellerSelectProps
  articleFilterProps?: ArticleFilterProps
}

export default function Header({ articleTitle, sellerSelectProps, articleFilterProps }: HeaderProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const email = useAuthStore((state) => state.email)
  const role = useAuthStore((state) => state.role)
  
  // Проверяем, может ли пользователь управлять другими пользователями
  const canManageUsers = role === 'ADMIN' || role === 'MANAGER' || role === 'SELLER'
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  
  // Название кнопки в зависимости от роли
  const getUsersButtonLabel = () => {
    if (role === 'ADMIN') return 'Менеджеры'
    if (role === 'MANAGER') return 'Селлеры'
    if (role === 'SELLER') return 'Работники'
    return 'Пользователи'
  }

  // Минимальный интервал между обновлениями (6 часов)
  const MIN_UPDATE_INTERVAL_HOURS = 6

  // Получаем информацию о выбранном селлере
  const selectedSeller = useMemo(() => {
    if (!sellerSelectProps?.selectedSellerId || !sellerSelectProps?.activeSellers) {
      return undefined
    }
    return sellerSelectProps.activeSellers.find(
      s => s.id === sellerSelectProps.selectedSellerId
    )
  }, [sellerSelectProps?.selectedSellerId, sellerSelectProps?.activeSellers])

  // Проверяет, можно ли запустить обновление (прошло ли 6 часов)
  const canUpdateSellerData = (): boolean => {
    if (!selectedSeller?.lastDataUpdateAt) {
      return true // Если обновление еще не запускалось, разрешаем
    }
    
    const lastUpdate = dayjs(selectedSeller.lastDataUpdateAt)
    const now = dayjs()
    const hoursSinceLastUpdate = now.diff(lastUpdate, 'hour')
    
    return hoursSinceLastUpdate >= MIN_UPDATE_INTERVAL_HOURS
  }

  // Вычисляет оставшееся время до следующего обновления
  const getRemainingTime = (): string | null => {
    if (!selectedSeller?.lastDataUpdateAt) {
      return null
    }
    
    const lastUpdate = dayjs(selectedSeller.lastDataUpdateAt)
    const now = dayjs()
    const hoursSinceLastUpdate = now.diff(lastUpdate, 'hour')
    const minutesSinceLastUpdate = now.diff(lastUpdate, 'minute')
    
    if (hoursSinceLastUpdate >= MIN_UPDATE_INTERVAL_HOURS) {
      return null
    }
    
    const remainingMinutes = MIN_UPDATE_INTERVAL_HOURS * 60 - minutesSinceLastUpdate
    const remainingHours = Math.floor(remainingMinutes / 60)
    const remainingMins = remainingMinutes % 60
    
    if (remainingHours > 0) {
      return `${remainingHours} ${getHoursWord(remainingHours)} ${remainingMins > 0 ? `и ${remainingMins} ${getMinutesWord(remainingMins)}` : ''}`
    } else {
      return `${remainingMins} ${getMinutesWord(remainingMins)}`
    }
  }

  // Возвращает правильное склонение слова "час/часа/часов"
  const getHoursWord = (hours: number): string => {
    if (hours % 10 === 1 && hours % 100 !== 11) {
      return 'час'
    } else if (hours % 10 >= 2 && hours % 10 <= 4 && (hours % 100 < 10 || hours % 100 >= 20)) {
      return 'часа'
    } else {
      return 'часов'
    }
  }

  // Возвращает правильное склонение слова "минута/минуты/минут"
  const getMinutesWord = (minutes: number): string => {
    if (minutes % 10 === 1 && minutes % 100 !== 11) {
      return 'минута'
    } else if (minutes % 10 >= 2 && minutes % 10 <= 4 && (minutes % 100 < 10 || minutes % 100 >= 20)) {
      return 'минуты'
    } else {
      return 'минут'
    }
  }

  // Мутация для запуска обновления данных селлера
  const triggerUpdateMutation = useMutation({
    mutationFn: (sellerId: number) => userApi.triggerSellerDataUpdate(sellerId),
    onSuccess: (data) => {
      message.success(data.message)
      // Обновляем список селлеров, чтобы получить актуальное время последнего обновления
      queryClient.invalidateQueries({ queryKey: ['activeSellers'] })
    },
    onError: (error: any) => {
      const statusCode = error.response?.status
      const errorMessage = error.response?.data?.message || 'Ошибка запуска обновления данных'
      
      if (statusCode === 429) {
        message.warning(errorMessage)
      } else {
        message.error(errorMessage)
      }
    },
  })

  const isProfilePage = location.pathname === '/profile'
  const isAnalyticsPage = location.pathname === '/analytics'
  const isArticlePage = location.pathname.startsWith('/analytics/article/')
  const isUsersPage = location.pathname === '/users'

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isArticlePage && (
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Вернуться к сводной
          </Button>
        )}
        {isAnalyticsPage && (
          <>
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            Сводная аналитика
          </Title>
            {sellerSelectProps && (
              <>
                <Select
                  value={sellerSelectProps.selectedSellerId}
                  onChange={sellerSelectProps.onSellerChange}
                  style={{ minWidth: 250, marginLeft: '16px' }}
                  placeholder="Выберите селлера"
                  options={sellerSelectProps.activeSellers.map(seller => ({
                    label: seller.email,
                    value: seller.id,
                  }))}
                />
                {isManagerOrAdmin && sellerSelectProps.selectedSellerId && (() => {
                  const canUpdate = canUpdateSellerData()
                  const remainingTime = getRemainingTime()
                  const tooltipTitle = canUpdate
                    ? 'Запускает обновление карточек, кампаний и аналитики. Процесс выполняется в фоновом режиме.'
                    : `Обновление данных можно запускать не чаще одного раза в ${MIN_UPDATE_INTERVAL_HOURS} часов. Следующее обновление будет доступно через ${remainingTime || 'несколько минут'}.`
                  
                  return (
                    <Tooltip title={tooltipTitle}>
                      <Button
                        type="text"
                        icon={<SyncOutlined spin={triggerUpdateMutation.isPending} />}
                        onClick={() => triggerUpdateMutation.mutate(sellerSelectProps.selectedSellerId!)}
                        loading={triggerUpdateMutation.isPending}
                        disabled={!canUpdate || triggerUpdateMutation.isPending}
                        style={{
                          marginLeft: '8px',
                          color: '#7C3AED',
                        }}
                      />
                    </Tooltip>
                  )
                })()}
              </>
            )}
            {articleFilterProps && articleFilterProps.articles.length > 0 && (
              <Popover
                content={
                  <div style={{ width: '400px', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Input
                      placeholder="Поиск по артикулу или названию"
                      prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                      value={articleFilterProps.articleSearchText}
                      onChange={(e) => articleFilterProps.onArticleSearchTextChange(e.target.value)}
                      style={{ marginBottom: '12px' }}
                      allowClear
                    />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <Button size="small" onClick={() => articleFilterProps.onExcludedNmIdsChange(new Set())}>
                        Выбрать все
                      </Button>
                      <Button size="small" onClick={() => {
                        const allIds = new Set(articleFilterProps.articles.map(a => a.nmId))
                        articleFilterProps.onExcludedNmIdsChange(allIds)
                      }}>
                        Снять все
                      </Button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                      {articleFilterProps.articles
                        .filter(article => {
                          const searchLower = articleFilterProps.articleSearchText.toLowerCase()
                          return article.nmId.toString().includes(searchLower) ||
                            article.title.toLowerCase().includes(searchLower)
                        })
                        .map(article => (
                          <div 
                            key={article.nmId} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '8px 0',
                              borderBottom: '1px solid #F1F5F9'
                            }}
                          >
                            <Checkbox
                              checked={!articleFilterProps.excludedNmIds.has(article.nmId)}
                              onChange={(e) => {
                                const newExcluded = new Set(articleFilterProps.excludedNmIds)
                                if (e.target.checked) {
                                  newExcluded.delete(article.nmId)
                                } else {
                                  newExcluded.add(article.nmId)
                                }
                                articleFilterProps.onExcludedNmIdsChange(newExcluded)
                              }}
                              style={{ marginRight: '12px' }}
                            />
                            {article.photoTm && (
                              <img 
                                src={article.photoTm} 
                                alt="" 
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover', 
                                  borderRadius: '4px',
                                  marginRight: '12px'
                                }} 
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', color: '#64748B' }}>{article.nmId}</div>
                              <div style={{ 
                                fontSize: '14px', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}>
                                {article.title}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                }
                title="Фильтр артикулов"
                trigger="click"
                placement="bottomRight"
                overlayStyle={{ maxWidth: '450px' }}
              >
                <Button
                  icon={<FilterOutlined />}
                  style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Фильтр
                  <span style={{ 
                    backgroundColor: '#7C3AED', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '0 8px', 
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}>
                    {articleFilterProps.articles.length - articleFilterProps.excludedNmIds.size}/{articleFilterProps.articles.length}
                  </span>
                </Button>
              </Popover>
            )}
          </>
        )}
        {isProfilePage && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            Личный кабинет
          </Title>
        )}
        {isUsersPage && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            {role === 'ADMIN' ? 'Управление менеджерами' : 
             role === 'MANAGER' ? 'Управление селлерами' : 
             role === 'SELLER' ? 'Управление работниками' : 
             'Управление пользователями'}
          </Title>
        )}
        {isArticlePage && articleTitle && (
          <Title 
            level={2} 
            style={{ 
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            {articleTitle}
          </Title>
        )}
      </div>
      
      <Space size="middle" align="center">
        {email && (
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {email}
          </Text>
        )}
        
        {isProfilePage && (
          <Button
            type="default"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Сводная аналитика
          </Button>
        )}
        
        {canManageUsers && !isUsersPage && (
          <Button
            type="default"
            icon={<TeamOutlined />}
            onClick={() => navigate('/users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {getUsersButtonLabel()}
          </Button>
        )}
        {!isProfilePage && !isArticlePage && !isUsersPage && (
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
        )}
        {isArticlePage && (
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
        )}
        {isUsersPage && (
          <>
            <Button
              type="default"
              icon={<BarChartOutlined />}
              onClick={() => navigate('/analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Сводная аналитика
            </Button>
          <Button
            type="default"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Личный кабинет
          </Button>
          </>
        )}
      </Space>
    </div>
  )
}

