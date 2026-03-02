import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Profile from './pages/Profile'
import AdminPlansAndSubscriptions from './pages/AdminPlansAndSubscriptions'
import Subscribe from './pages/Subscribe'
import Subscription from './pages/Subscription'
import SubscriptionSuccess from './pages/SubscriptionSuccess'
import SubscriptionFail from './pages/SubscriptionFail'
import AccessGuard from './components/AccessGuard'
import Privacy from './pages/Privacy'
import Refund from './pages/Refund'
import Oferta from './pages/Oferta'
import Footer from './components/Footer'
import { useAuthStore } from './store/authStore'

function App() {
  const token = useAuthStore((state) => state.token)

  const getInitialRoute = () => {
    return '/analytics/products'
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div>
          <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route
          path="/"
          element={
            token ? <Navigate to={getInitialRoute()} replace /> : <Landing />
          }
        />
        <Route
          path="/analytics"
          element={token ? <AccessGuard><AnalyticsSummary /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics/products"
          element={token ? <AccessGuard><AnalyticsProducts /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics/article/:nmId"
          element={token ? <AccessGuard><AnalyticsArticle /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/campaigns"
          element={token ? <AccessGuard><AdvertisingCampaigns /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/advertising/campaigns/:id"
          element={token ? <AccessGuard><AdvertisingCampaignDetail /></AccessGuard> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
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
        <Route path="/users" element={token ? <Navigate to="/profile" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App

