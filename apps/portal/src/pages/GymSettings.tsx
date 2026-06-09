import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useGymStore } from '@/store/gymStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const settingsSchema = z.object({
  gymName: z.string().min(2, 'Gym name must be at least 2 characters'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

export default function GymSettings() {
  const { gymName, primaryColor, secondaryColor, tier, activeStudentCount, nextInvoiceDate, setGymConfig } =
    useGymStore()

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      gymName,
      primaryColor,
      secondaryColor,
    },
  })

  const watchedPrimary = watch('primaryColor')
  const watchedSecondary = watch('secondaryColor')
  const watchedName = watch('gymName')

  const onSubmit = (data: SettingsFormData) => {
    setGymConfig(data)
    document.documentElement.style.setProperty('--color-primary', data.primaryColor)
    document.documentElement.style.setProperty('--color-secondary', data.secondaryColor)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Gym Settings</h1>
        <p className="text-text-secondary text-sm mt-0.5">Manage branding and billing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <div>
          <h2 className="text-text-primary font-semibold text-lg mb-4">Branding</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Gym Name"
              placeholder="e.g. Elite BJJ Academy"
              error={errors.gymName?.message}
              {...register('gymName')}
            />

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Gym Logo
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  // In production: handle file upload
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <ArrowUpTrayIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-secondary text-sm">
                  Drag & drop your logo here, or{' '}
                  <span className="text-primary cursor-pointer hover:underline">browse</span>
                </p>
                <p className="text-text-muted text-xs mt-1">PNG, SVG, or JPG — max 2MB</p>
              </div>
            </div>

            {/* Color pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer bg-surface-elevated border border-slate-600 p-1"
                    {...register('primaryColor')}
                  />
                  <Input
                    placeholder="#1B4FD8"
                    error={errors.primaryColor?.message}
                    className="font-mono"
                    {...register('primaryColor')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer bg-surface-elevated border border-slate-600 p-1"
                    {...register('secondaryColor')}
                  />
                  <Input
                    placeholder="#F59E0B"
                    error={errors.secondaryColor?.message}
                    className="font-mono"
                    {...register('secondaryColor')}
                  />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Live Preview
              </label>
              <div
                className="rounded-xl border border-slate-600 overflow-hidden"
                style={{ background: '#1E293B' }}
              >
                <div
                  className="h-2"
                  style={{ background: watchedPrimary || primaryColor }}
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: watchedPrimary || primaryColor }}
                    >
                      FM
                    </div>
                    <span className="text-text-primary font-semibold text-sm">
                      {watchedName || gymName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: watchedPrimary || primaryColor }}
                    >
                      Primary
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-bg"
                      style={{ background: watchedSecondary || secondaryColor }}
                    >
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isDirty && !isSaved}
            >
              {isSaved ? 'Saved!' : 'Save Settings'}
            </Button>
          </form>
        </div>

        {/* Billing */}
        <div>
          <h2 className="text-text-primary font-semibold text-lg mb-4">Billing</h2>
          <Card className="p-6 space-y-6">
            {/* Current tier */}
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Current Plan</p>
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: primaryColor }}
                >
                  {TIER_LABELS[tier] ?? tier}
                </div>
                <span className="text-text-secondary text-sm">Plan</span>
              </div>
            </div>

            {/* Active students */}
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Active Students</p>
              <p className="text-text-primary text-2xl font-bold">{activeStudentCount}</p>
              <p className="text-text-muted text-xs mt-0.5">Students with activity this month</p>
            </div>

            {/* Next invoice */}
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                Next Invoice Date
              </p>
              <p className="text-text-primary text-base font-medium">
                {nextInvoiceDate
                  ? new Date(nextInvoiceDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <Button variant="ghost" className="w-full">
                Manage Subscription
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
