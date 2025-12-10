import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AnalyticsSummary from './pages/AnalyticsSummary'
import AnalyticsArticle from './pages/AnalyticsArticle'
import Profile from './pages/Profile'
import UsersManagement from './pages/UsersManagement'
import { useAuthStore } from './store/authStore'

function App() {
  const token = useAuthStore((state) => state.token)

  const getInitialRoute = () => {
    return '/profile'
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            token ? <Navigate to={getInitialRoute()} replace /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/analytics"
          element={token ? <AnalyticsSummary /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics/article/:nmId"
          element={token ? <AnalyticsArticle /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/users"
          element={token ? <UsersManagement /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

