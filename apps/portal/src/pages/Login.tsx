import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { setGymConfig } = useGymStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (_data: LoginForm) => {
    // Mock auth — set fake token and redirect
    await new Promise((resolve) => setTimeout(resolve, 800))

    login({
      gymId: 'gym-1',
      userId: 'user-1',
      role: 'instructor',
      token: 'mock-jwt-token-abc123',
      userName: 'Coach Alex',
      userEmail: _data.email,
      userBelt: 'black',
    })

    setGymConfig({
      gymId: 'gym-1',
      gymName: 'Elite BJJ Academy',
      primaryColor: '#1B4FD8',
      secondaryColor: '#F59E0B',
      tier: 'growth',
      activeStudentCount: 42,
      nextInvoiceDate: '2025-02-01',
    })

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

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-text-muted text-xs mt-6">
            Demo: use any email + password (min 6 chars)
          </p>
        </div>
      </div>
    </div>
  )
}
