import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
  init: () => () => void
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
      logout: () => {
        supabase.auth.signOut().catch(() => {
          // Best-effort sign out — clear local state regardless
        })
        set({
          gymId: null,
          userId: null,
          role: null,
          token: null,
          userName: null,
          userEmail: null,
          userBelt: null,
          isAuthenticated: false,
        })
      },
      init: () => {
        // Restore session on page load
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            set({ token: session.access_token, isAuthenticated: true })
          }
        })

        // Keep token in sync with Supabase auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || !session) {
            set({
              gymId: null,
              userId: null,
              role: null,
              token: null,
              userName: null,
              userEmail: null,
              userBelt: null,
              isAuthenticated: false,
            })
            window.location.href = '/login'
          } else if (session) {
            set({ token: session.access_token, isAuthenticated: true })
          }
        })

        // Return unsubscribe function for cleanup
        return () => subscription.unsubscribe()
      },
    }),
    {
      name: 'flowmat-auth',
    },
  ),
)
