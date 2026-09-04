import { useLocation } from 'react-router-dom'
import DemoAnalyticsSummary from './DemoAnalyticsSummary'
import DemoAnalyticsProducts from './DemoAnalyticsProducts'
import DemoAnalyticsArticle from './DemoAnalyticsArticle'
import DemoAdvertisingCampaigns from './DemoAdvertisingCampaigns'
import DemoAdvertisingCampaignDetail from './DemoAdvertisingCampaignDetail'
import DemoAdvertisingCampaignManage from './DemoAdvertisingCampaignManage'
import DemoBidderCampaigns from './DemoBidderCampaigns'
import DemoAbTests, { DemoAbTestDetail } from './DemoAbTests'
import DemoGenericPlaceholder from './DemoGenericPlaceholder'

/**
 * Выбирает учебный макет под текущий маршрут (пока нет своего кабинета).
 */
export default function OnboardingDemoByRoute() {
  const { pathname } = useLocation()

  if (pathname === '/analytics') {
    return <DemoAnalyticsSummary />
  }
  if (pathname === '/analytics/products') {
    return <DemoAnalyticsProducts />
  }
  if (pathname.startsWith('/analytics/article/')) {
    return <DemoAnalyticsArticle />
  }
  if (pathname === '/advertising/campaigns') {
    return <DemoAdvertisingCampaigns />
  }
  if (/^\/advertising\/campaigns\/[^/]+\/manage$/.test(pathname)) {
    return <DemoAdvertisingCampaignManage />
  }
  if (/^\/advertising\/campaigns\/[^/]+$/.test(pathname)) {
    return <DemoAdvertisingCampaignDetail />
  }
  if (pathname === '/advertising/bidder') {
    return <DemoBidderCampaigns />
  }
  if (pathname === '/advertising/ab-test') {
    return <DemoAbTests />
  }
  if (/^\/advertising\/ab-test\/[^/]+$/.test(pathname)) {
    return <DemoAbTestDetail />
  }

  return (
    <DemoGenericPlaceholder
      title="Учебный кабинет"
      description="Выберите раздел в меню — покажем, как выглядит интерфейс, и подскажем, что делает каждый блок."
    />
  )
}
