import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
	persist(
		(set) => ({
			session: null,
			user: null,
			profile: null,
			isAuthenticated: false,
			setAuth: (data) =>
				set({
					session: data?.session ?? null,
					user: data?.user ?? null,
					profile: data?.profile ?? null,
					isAuthenticated: true,
				}),
			clearAuth: () =>
				set({
					session: null,
					user: null,
					profile: null,
					isAuthenticated: false,
				}),
		}),
		{
			name: 'fairgig-auth',
		}
	)
)

export default useAuthStore
