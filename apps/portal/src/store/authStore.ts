import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'instructor' | 'admin' | 'student'
export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black'

interface AuthState {
  gymId: string | null
  userId: string | null
  role: UserRole | null
  token: string | null
  userName: string | null
  userEmail: string | null
  userBelt: Belt | null
  isAuthenticated: boolean
  login: (params: {
    gymId: string
    userId: string
    role: UserRole
    token: string
    userName: string
    userEmail: string
    userBelt: Belt
  }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      gymId: null,
      userId: null,
      role: null,
      token: null,
      userName: null,
      userEmail: null,
      userBelt: null,
      isAuthenticated: false,
      login: ({ gymId, userId, role, token, userName, userEmail, userBelt }) =>
        set({
          gymId,
          userId,
          role,
          token,
          userName,
          userEmail,
          userBelt,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          gymId: null,
          userId: null,
          role: null,
          token: null,
          userName: null,
          userEmail: null,
          userBelt: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'flowmat-auth',
    },
  ),
)
