import axios from 'axios'
import useAuthStore from '@/store/authStore'

const authStore = useAuthStore

/** Same host as the SPA in production (gateway serves / + /api). Dev defaults to gateway port 5000. */
const resolveApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL
	if (raw !== undefined && String(raw).trim() !== '') {
		return String(raw).replace(/\/+$/, '')
	}
	if (import.meta.env.DEV) {
		return 'http://localhost:5000'
	}
	return ''
}

const API_BASE_URL = resolveApiBaseUrl()

const apiClient = axios.create({
	baseURL: API_BASE_URL || undefined,
})

apiClient.interceptors.request.use((config) => {
	const token = authStore.getState().session?.access_token

	if (token) {
		config.headers = config.headers ?? {}
		config.headers.Authorization = `Bearer ${token}`
	}

	return config
})

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			authStore.getState().clearAuth()
			window.location.href = '/login'
		}

		return Promise.reject(error)
	}
)

export { apiClient }
export default apiClient
