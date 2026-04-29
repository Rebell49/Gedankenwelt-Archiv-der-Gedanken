import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      // Initialize auth state on app start
      initialize: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
          try {
            await get().refreshAccessToken()
          } catch (error) {
            // Token refresh failed, clear state
            set(() => ({ user: null, accessToken: null, refreshToken: null }))
          }
        }
      },

      login: async (email, password) => {
        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          if (!response.ok) throw new Error('Login failed')

          const data = await response.json()
          set(() => ({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }))
          return data
        } catch (error) {
          console.error('Login error:', error)
          throw error
        }
      },

      register: async (email, username, password) => {
        try {
          const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password }),
          })
          if (!response.ok) throw new Error('Registration failed')

          const data = await response.json()
          set(() => ({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }))
          return data
        } catch (error) {
          console.error('Registration error:', error)
          throw error
        }
      },

      logout: () => {
        set(() => ({ user: null, accessToken: null, refreshToken: null }))
      },

      updateProfile: async (updates) => {
        try {
          const { accessToken } = get()
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          })
          if (!response.ok) throw new Error('Profile update failed')

          const data = await response.json()
          set((state) => ({ user: { ...state.user, ...data } }))
          return data
        } catch (error) {
          console.error('Profile update error:', error)
          throw error
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })
          if (!response.ok) throw new Error('Token refresh failed')

          const data = await response.json()
          set((state) => ({ accessToken: data.accessToken }))
          return data
        } catch (error) {
          console.error('Token refresh error:', error)
          set(() => ({ user: null, accessToken: null, refreshToken: null }))
          throw error
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
)
