import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Space, Typography, Select, Popover, Checkbox, Input } from 'antd'
import { UserOutlined, BarChartOutlined, ArrowLeftOutlined, TeamOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import type { UserListItem } from '../types/api'
import type { ArticleSummary } from '../types/analytics'

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
  const email = useAuthStore((state) => state.email)
  const role = useAuthStore((state) => state.role)
  
  // Проверяем, может ли пользователь управлять другими пользователями
  const canManageUsers = role === 'ADMIN' || role === 'MANAGER' || role === 'SELLER'
  
  // Название кнопки в зависимости от роли
  const getUsersButtonLabel = () => {
    if (role === 'ADMIN') return 'Пользователи'
    if (role === 'MANAGER') return 'Селлеры'
    if (role === 'SELLER') return 'Работники'
    return 'Пользователи'
  }

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
            )}
            {articleFilterProps && articleFilterProps.articles.length > 0 && (
              <Popover
                content={
                  <div style={{ 
                    width: '400px',
                    maxHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Input
                        placeholder="Поиск по артикулу, названию, бренду..."
                        prefix={<SearchOutlined />}
                        value={articleFilterProps.articleSearchText}
                        onChange={(e) => articleFilterProps.onArticleSearchTextChange(e.target.value)}
                        allowClear
                        size="small"
                      />
                    </div>
                    <div style={{ 
                      borderBottom: '1px solid #E2E8F0',
                      paddingBottom: '8px',
                      marginBottom: '8px'
                    }}>
                      <Checkbox
                        checked={articleFilterProps.excludedNmIds.size === 0}
                        indeterminate={articleFilterProps.excludedNmIds.size > 0 && articleFilterProps.excludedNmIds.size < articleFilterProps.articles.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            articleFilterProps.onExcludedNmIdsChange(new Set())
                          } else {
                            articleFilterProps.onExcludedNmIdsChange(new Set(articleFilterProps.articles.map(a => a.nmId)))
                          }
                        }}
                        style={{ fontWeight: 600 }}
                      >
                        {articleFilterProps.excludedNmIds.size === 0 
                          ? 'Все артикулы' 
                          : `Выбрано: ${articleFilterProps.articles.length - articleFilterProps.excludedNmIds.size} из ${articleFilterProps.articles.length}`}
                      </Checkbox>
                    </div>
                    <div style={{ 
                      overflowY: 'auto',
                      maxHeight: '400px',
                      paddingRight: '8px'
                    }}>
                      {(() => {
                        const filtered = articleFilterProps.articleSearchText.trim()
                          ? articleFilterProps.articles.filter(article => {
                              const searchLower = articleFilterProps.articleSearchText.toLowerCase().trim()
                              const nmIdStr = article.nmId.toString()
                              const title = article.title?.toLowerCase() || ''
                              const brand = article.brand?.toLowerCase() || ''
                              const subjectName = article.subjectName?.toLowerCase() || ''
                              return nmIdStr.includes(searchLower) || title.includes(searchLower) || brand.includes(searchLower) || subjectName.includes(searchLower)
                            })
                          : articleFilterProps.articles
                        
                        return filtered.map((article) => {
                          const isIncluded = !articleFilterProps.excludedNmIds.has(article.nmId)
                          return (
                            <div 
                              key={article.nmId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8FAFC'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                const newExcluded = new Set(articleFilterProps.excludedNmIds)
                                if (isIncluded) {
                                  newExcluded.add(article.nmId)
                                } else {
                                  newExcluded.delete(article.nmId)
                                }
                                articleFilterProps.onExcludedNmIdsChange(newExcluded)
                              }}
                            >
                              <Checkbox
                                checked={isIncluded}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  const newExcluded = new Set(articleFilterProps.excludedNmIds)
                                  if (e.target.checked) {
                                    newExcluded.delete(article.nmId)
                                  } else {
                                    newExcluded.add(article.nmId)
                                  }
                                  articleFilterProps.onExcludedNmIdsChange(newExcluded)
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {article.photoTm && (
                                <img
                                  src={article.photoTm}
                                  alt={`Товар ${article.nmId}`}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid #E2E8F0'
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#1E293B',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {article.nmId}
                                </div>
                                {article.title && (
                                  <div style={{ 
                                    fontSize: '12px',
                                    color: '#64748B',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {article.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      })()}
                      {articleFilterProps.articleSearchText.trim() && 
                       articleFilterProps.articles.filter(article => {
                         const searchLower = articleFilterProps.articleSearchText.toLowerCase().trim()
                         const nmIdStr = article.nmId.toString()
                         const title = article.title?.toLowerCase() || ''
                         const brand = article.brand?.toLowerCase() || ''
                         const subjectName = article.subjectName?.toLowerCase() || ''
                         return nmIdStr.includes(searchLower) || title.includes(searchLower) || brand.includes(searchLower) || subjectName.includes(searchLower)
                       }).length === 0 && (
                        <div style={{ 
                          textAlign: 'center',
                          padding: '16px',
                          color: '#94A3B8'
                        }}>
                          Артикулы не найдены
                        </div>
                      )}
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
                  style={{
                    marginLeft: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Фильтр артикулов
                  {articleFilterProps.excludedNmIds.size > 0 && (
                    <span style={{
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '0 6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginLeft: '6px'
                    }}>
                      {articleFilterProps.articles.length - articleFilterProps.excludedNmIds.size}/{articleFilterProps.articles.length}
                    </span>
                  )}
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
            Управление пользователями
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
        
        {(isProfilePage || (role === 'ADMIN' || role === 'MANAGER')) && !isAnalyticsPage && (
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
      </Space>
    </div>
  )
}

