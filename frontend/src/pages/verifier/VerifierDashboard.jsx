import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const VerifierDashboard = () => {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Verifier Dashboard</h1>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
      >
        Logout
      </button>
    </div>
  )
}

export default VerifierDashboard
