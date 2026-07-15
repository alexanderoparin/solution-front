import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConfirmEmail from './pages/ConfirmEmail'
import Landing from './pages/Landing'
import AnalyticsSummary from './pages/AnalyticsSummary'
import AnalyticsArticle from './pages/AnalyticsArticle'
import AnalyticsProducts from './pages/AnalyticsProducts'
import AdvertisingCampaigns from './pages/AdvertisingCampaigns'
import AdvertisingCampaignDetail from './pages/AdvertisingCampaignDetail'
import AdvertisingCampaignManage from './pages/AdvertisingCampaignManage'
import BidderCampaigns from './pages/BidderCampaigns'
import Profile from './pages/Profile'
import AdminPlansAndSubscriptions from './pages/AdminPlansAndSubscriptions'
import AdminWbEvents from './pages/AdminWbEvents'
import AdminDeletionRequests from './pages/AdminDeletionRequests'
import Subscribe from './pages/Subscribe'
import Subscription from './pages/Subscription'
import PaymentUnavailable from './pages/PaymentUnavailable'
import SubscriptionSuccess from './pages/SubscriptionSuccess'
import SubscriptionFail from './pages/SubscriptionFail'
import AccessGuard from './components/AccessGuard'
import CabinetSectionGuard from './components/CabinetSectionGuard'
import Privacy from './pages/Privacy'
import Refund from './pages/Refund'
import Oferta from './pages/Oferta'
import UserAgreement from './pages/UserAgreement'
import CabinetDetailPage from './pages/cabinets/CabinetDetailPage'
import InviteAccept from './pages/InviteAccept'
import Footer from './components/Footer'
import AccessStatusPrefetch from './components/AccessStatusPrefetch'
import CampaignManageSubscriptionModals from './components/campaignManageSubscription/CampaignManageSubscriptionModals'
import { useAuthStore } from './store/authStore'

function AppRoutes() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  const showAppFooter = location.pathname !== '/'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/" element={<Landing />} />
        <Route
          path="/analytics"
          element={token ? <AccessGuard><CabinetSectionGuard section="SUMMARY"><AnalyticsSummary /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics/products"
          element={token ? <AccessGuard><CabinetSectionGuard section="PRODUCTS"><AnalyticsProducts /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics/article/:nmId"
          element={token ? <AccessGuard><CabinetSectionGuard section="PRODUCTS"><AnalyticsArticle /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/campaigns"
          element={token ? <AccessGuard><CabinetSectionGuard section="AD_CAMPAIGNS"><AdvertisingCampaigns /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/bidder"
          element={token ? <AccessGuard><CabinetSectionGuard section="CAMPAIGN_MANAGE"><BidderCampaigns /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/campaigns/:id/manage"
          element={token ? <AccessGuard><CabinetSectionGuard section="CAMPAIGN_MANAGE"><AdvertisingCampaignManage /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/campaigns/:id"
          element={token ? <AccessGuard><CabinetSectionGuard section="AD_CAMPAIGNS"><AdvertisingCampaignDetail /></CabinetSectionGuard></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cabinets"
          element={token ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cabinets/:id"
          element={token ? <AccessGuard><CabinetDetailPage /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscribe"
          element={token ? <Subscribe /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription"
          element={token ? <Subscription /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/plans"
          element={token ? <AdminPlansAndSubscriptions /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/deletion-requests"
          element={token ? <AdminDeletionRequests /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/wb-events"
          element={token ? <AdminWbEvents /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription/payment-unavailable"
          element={token ? <PaymentUnavailable /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription/success"
          element={token ? <SubscriptionSuccess /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription/fail"
          element={token ? <SubscriptionFail /> : <Navigate to="/login" replace />}
        />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/oferta" element={<Oferta />} />
        <Route path="/user-agreement" element={<UserAgreement />} />
        <Route path="/users" element={token ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
      {showAppFooter ? <Footer /> : null}
    </div>
  )
}

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <BrowserRouter>
      <AccessStatusPrefetch />
      {token ? <CampaignManageSubscriptionModals /> : null}
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

