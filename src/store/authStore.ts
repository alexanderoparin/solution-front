import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setStoredCabinetId } from '../api/cabinetSelection'

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
    (set, get) => ({
      token: null,
      email: null,
      userId: null,
      role: null,
      setAuth: (token, email, userId, role) => {
        const previousUserId = get().userId
        set({ token, email, userId, role })
        if (previousUserId !== userId) {
          setStoredCabinetId(null)
        }
      },
      clearAuth: () => {
        setStoredCabinetId(null)
        set({ token: null, email: null, userId: null, role: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

