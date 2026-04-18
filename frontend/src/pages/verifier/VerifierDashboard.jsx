import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const VerifierDashboard = () => {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-light p-6">
      <h1 className="mb-4 text-2xl font-bold text-brand-darkest">Verifier Dashboard</h1>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/community"
          className="rounded-full border-2 border-brand-primary bg-brand-primary px-5 py-2 text-sm font-bold uppercase tracking-wider text-brand-light transition-opacity hover:opacity-90"
        >
          Community
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border-2 border-brand-muted bg-white px-5 py-2 text-sm font-semibold text-brand-darkest transition-colors hover:bg-brand-light"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default VerifierDashboard
