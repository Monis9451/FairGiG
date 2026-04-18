import { Navigate as Maps, Outlet } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

const ProtectedRoute = ({ allowedRoles }) => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
	const role = useAuthStore((state) => state.profile?.role)
	const isKnownRole = ['worker', 'verifier', 'analyst', 'advocate'].includes(role)

	if (!isAuthenticated) {
		return <Maps to="/login" replace />
	}

	if (!isKnownRole) {
		return <Maps to="/login" replace />
	}

	if (allowedRoles && !allowedRoles.includes(role)) {
		const redirectPath = role === 'analyst' ? '/analyst' : `/${role}`
		return <Maps to={redirectPath} replace />
	}

	return <Outlet />
}

export default ProtectedRoute
