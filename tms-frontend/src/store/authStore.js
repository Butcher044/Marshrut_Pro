import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },

      setUser: (user) => {
        set({ user })
      },

      login: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user })
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null })
      },

      isAuthenticated: () => !!get().accessToken,

      hasRole: (role) => get().user?.role === role,

      hasAnyRole: (roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'tms-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

export default useAuthStore
