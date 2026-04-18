import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import useAuthStore from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

function mapRoleToPath(role) {
  if (role === 'analyst') {
    return '/analyst'
  }

  if (role === 'advocate') {
    return '/advocate'
  }

  if (role === 'verifier') {
    return '/verifier'
  }

  return '/worker'
}

export function useSignIn() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const Maps = useNavigate()

  return useMutation({
    meta: {
      successMessage: 'Signed in successfully.',
    },
    mutationFn: async (credentials) => {
      const response = await apiClient.post('/api/v1/auth/login', credentials)
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.data)
      Maps(mapRoleToPath(data.data?.profile?.role))
    },
  })
}

export function useSignUp() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const navigate = useNavigate()

  return useMutation({
    meta: {
      successMessage: 'Account created. Please sign in.',
    },
    mutationFn: async (userData) => {
      const response = await apiClient.post('/api/v1/auth/signup', userData)
      return response.data
    },
    onSuccess: (data) => {
      void data
      clearAuth()
      navigate('/login')
    },
  })
}

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/me')
      return response.data.data
    },
    enabled: isAuthenticated,
  })
}
