import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { supabase } from '@/lib/supabase'
import { usersApi } from '@/api/users'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Belt, UserRole } from '@/store/authStore'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { setGymConfig } = useGymStore()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null)

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError || !authData.session) {
      setAuthError('Invalid email or password')
      return
    }

    const session = authData.session
    const accessToken = session.access_token

    try {
      // Temporarily set the token so the API client can use it
      login({
        gymId: '',
        userId: session.user.id,
        role: 'instructor' as UserRole,
        token: accessToken,
        userName: session.user.email ?? '',
        userEmail: session.user.email ?? '',
        userBelt: 'white' as Belt,
      })

      const { data: me } = await usersApi.getMe()

      login({
        gymId: me.gymId,
        userId: me.id,
        role: me.role,
        token: accessToken,
        userName: me.name,
        userEmail: me.email,
        userBelt: me.beltLevel,
      })

      setGymConfig({
        gymId: me.gymId,
        gymName: 'FlowMat Gym',
        primaryColor: '#1B4FD8',
        secondaryColor: '#F59E0B',
        tier: 'growth',
        activeStudentCount: 0,
        nextInvoiceDate: '',
      })
    } catch {
      // Fall back to data from the JWT if /users/me is unavailable
      const gymId = (session.user.app_metadata as Record<string, unknown>)?.gym_id as string ?? ''
      const role = (session.user.app_metadata as Record<string, unknown>)?.role as UserRole ?? 'instructor'

      login({
        gymId,
        userId: session.user.id,
        role,
        token: accessToken,
        userName: session.user.email ?? '',
        userEmail: session.user.email ?? '',
        userBelt: 'white' as Belt,
      })

      setGymConfig({
        gymId,
        gymName: 'FlowMat Gym',
        primaryColor: '#1B4FD8',
        secondaryColor: '#F59E0B',
        tier: 'growth',
        activeStudentCount: 0,
        nextInvoiceDate: '',
      })
    }

    navigate('/library')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">FM</span>
          </div>
          <span className="text-text-primary font-bold text-2xl tracking-tight">FlowMat</span>
        </div>

        {/* Card */}
        <div className="bg-surface-elevated rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-text-primary text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-text-secondary text-sm">Sign in to your instructor portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="coach@gym.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {authError && (
              <p className="text-error text-sm mt-1">{authError}</p>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
