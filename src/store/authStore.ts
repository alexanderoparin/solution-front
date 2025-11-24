import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  email: string | null
  userId: number | null
  role: string | null
  setAuth: (token: string, email: string, userId: number, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      userId: null,
      role: null,
      setAuth: (token, email, userId, role) =>
        set({ token, email, userId, role }),
      clearAuth: () => set({ token: null, email: null, userId: null, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

