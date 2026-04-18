import axios from 'axios'
import useAuthStore from '@/store/authStore'

const authStore = useAuthStore
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')

const apiClient = axios.create({
	baseURL: API_BASE_URL,
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
