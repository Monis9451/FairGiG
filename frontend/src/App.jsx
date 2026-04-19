import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import LandingPage from './pages/LandingPage'
import CommunityPage from './pages/community/CommunityPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AppShellLayout } from './components/layout/AppShellLayout'
import ToastViewport from './components/ui/ToastViewport'
import useAuthStore from './store/authStore'
import { renderAdvocateRoutes } from './routes/advocateRoutes'
import { renderVerifierRoutes } from './routes/verifierRoutes'
import { renderWorkerRoutes } from './routes/workerRoutes'

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.profile?.role)
  const hasValidRole = ['worker', 'verifier', 'analyst', 'advocate'].includes(role)

  const dashboardPath =
    hasValidRole
      ? role === 'analyst'
        ? '/analyst'
        : `/${role}`
      : '/login'
  const redirectToDashboard = isAuthenticated && hasValidRole

  return (
    <>
      <ToastViewport />

      <Routes>
        <Route
          path="/"
          element={redirectToDashboard ? <Navigate to={dashboardPath} replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={redirectToDashboard ? <Navigate to={dashboardPath} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={redirectToDashboard ? <Navigate to={dashboardPath} replace /> : <Register />}
        />

        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
          <Route element={<AppShellLayout />}>
            {renderWorkerRoutes()}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['verifier']} />}>
          <Route element={<AppShellLayout />}>
            {renderVerifierRoutes()}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['worker', 'verifier', 'advocate', 'analyst']} />}>
          <Route element={<AppShellLayout />}>
            <Route path="/community" element={<CommunityPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['advocate', 'analyst']} />}>
          <Route element={<AppShellLayout />}>
            {renderAdvocateRoutes('/advocate')}
            {renderAdvocateRoutes('/analyst')}
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={redirectToDashboard ? dashboardPath : '/'} replace />}
        />
      </Routes>
    </>
  )
}

export default App

