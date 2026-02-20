import { useLocation, useParams, Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * Хлебные крошки под хеддером. Иерархия без корня.
 * Маршруты: /analytics → Аналитика → Сводная; /analytics/products → Аналитика → Товары;
 * /analytics/article/:nmId → Аналитика → Товары → {nmId}; /advertising/campaigns → Реклама → Рекламные компании;
 * /profile → Профиль.
 */
export default function Breadcrumbs() {
  const location = useLocation()
  const params = useParams<{ nmId?: string; id?: string }>()
  const pathname = location.pathname

  const items: BreadcrumbItem[] = []

  if (pathname === '/profile') {
    items.push({ label: 'Профиль' })
  } else if (pathname === '/analytics') {
    items.push({ label: 'Аналитика', path: '/analytics' }, { label: 'Сводная' })
  } else if (pathname === '/analytics/products') {
    items.push({ label: 'Аналитика', path: '/analytics' }, { label: 'Товары' })
  } else if (pathname.startsWith('/analytics/article/') && params.nmId) {
    items.push(
      { label: 'Аналитика', path: '/analytics' },
      { label: 'Товары', path: '/analytics/products' },
      { label: params.nmId }
    )
  } else if (pathname === '/advertising/campaigns') {
    items.push({ label: 'Реклама', path: '/advertising/campaigns' }, { label: 'Рекламные компании' })
  } else if (pathname.match(/^\/advertising\/campaigns\/\d+$/) && params.id) {
    items.push(
      { label: 'Реклама', path: '/advertising/campaigns' },
      { label: 'Рекламные компании', path: '/advertising/campaigns' },
      { label: `Кампания ${params.id}` }
    )
  } else {
    items.push({ label: 'Профиль' })
  }

  if (items.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 24px',
        fontSize: '14px',
        color: '#64748B',
      }}
    >
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span style={{ margin: '0 8px' }}>→</span>}
          {item.path != null ? (
            <Link
              to={item.path}
              style={{ color: '#7C3AED', textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: index === items.length - 1 ? '#1E293B' : undefined, fontWeight: index === items.length - 1 ? 500 : undefined }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
