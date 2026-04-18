import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import VerifierDashboard from './pages/verifier/VerifierDashboard'
import AdvocateDashboard from './pages/advocate/AdvocateDashboard'
import CommunityPage from './pages/community/CommunityPage'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './store/authStore'

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
    <Routes>
      <Route
        path="/login"
        element={redirectToDashboard ? <Navigate to={dashboardPath} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={redirectToDashboard ? <Navigate to={dashboardPath} replace /> : <Register />}
      />

      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route path="/worker" element={<WorkerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['verifier']} />}>
        <Route path="/verifier" element={<VerifierDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['advocate']} />}>
        <Route path="/advocate" element={<AdvocateDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['worker', 'verifier', 'advocate']} />}>
        <Route path="/community" element={<CommunityPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['analyst']} />}>
        <Route path="/analyst" element={<AdvocateDashboard />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={redirectToDashboard ? dashboardPath : '/login'} replace />}
      />
    </Routes>
  )
}

export default App

