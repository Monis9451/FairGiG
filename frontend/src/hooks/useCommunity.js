import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'

const PAGE_SIZE = 20

export function useCommunityFeed({ search = '', category = '', platform = '' } = {}) {
  return useInfiniteQuery({
    queryKey: ['community', 'feed', { search, category, platform, limit: PAGE_SIZE }],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam ?? 0
      const params = {
        limit: PAGE_SIZE,
        offset,
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        ...(platform ? { platform } : {}),
      }
      const response = await apiClient.get('/api/community/feed', { params })
      return response.data.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination
      const nextOffset = p.offset + p.returned
      return nextOffset < p.total ? nextOffset : undefined
    },
  })
}

export function useCommunityMine() {
  return useQuery({
    queryKey: ['community', 'mine'],
    queryFn: async () => {
      const response = await apiClient.get('/api/community/mine')
      return response.data.data
    },
  })
}

export function useCommunityModeration({ status = '' } = {}) {
  return useInfiniteQuery({
    queryKey: ['community', 'moderation', { status, limit: PAGE_SIZE }],
    queryFn: async ({ pageParam }) => {
      const offset = pageParam ?? 0
      const params = {
        limit: PAGE_SIZE,
        offset,
        ...(status ? { status } : {}),
      }
      const response = await apiClient.get('/api/community/moderation', { params })
      return response.data.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination
      const nextOffset = p.offset + p.returned
      return nextOffset < p.total ? nextOffset : undefined
    },
  })
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post('/api/community', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'mine'] })
    },
  })
}

export function usePatchCommunityPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const response = await apiClient.patch(`/api/community/${id}`, body)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'moderation'] })
    },
  })
}

export function useToggleUpvote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (postId) => {
      const response = await apiClient.post(`/api/community/${postId}/upvote`)
      return { postId, ...response.data.data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
    },
  })
}

export function usePostComments(postId, enabled = true) {
  return useQuery({
    queryKey: ['community', 'comments', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/community/${postId}/comments`)
      return response.data.data.items
    },
    enabled: Boolean(postId) && enabled,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId, body }) => {
      const response = await apiClient.post(`/api/community/${postId}/comments`, { body })
      return { postId, comment: response.data.data.comment }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
    },
  })
}
