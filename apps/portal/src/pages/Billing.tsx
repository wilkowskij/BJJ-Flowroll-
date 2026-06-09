import React, { useEffect, useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckIcon } from '@heroicons/react/24/outline'
import { subscriptionApi, type BillingStatus } from '@/api/subscription'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const TIER_CONFIG: Record<
  'starter' | 'growth' | 'pro',
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  starter: {
    label: 'Starter',
    color: 'border-blue-500',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-400',
  },
  growth: {
    label: 'Growth',
    color: 'border-amber-500',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-400',
  },
  pro: {
    label: 'Pro',
    color: 'border-purple-500',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-400',
  },
}

const TIERS = [
  { key: 'starter' as const, label: 'Starter', range: '1–50 students', price: '$4/student/mo' },
  { key: 'growth' as const, label: 'Growth', range: '51–150 students', price: '$5/student/mo' },
  { key: 'pro' as const, label: 'Pro', range: '151–300 students', price: '$6/student/mo' },
]

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents)
}

export default function Billing() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    subscriptionApi
      .getBillingStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setError('Failed to load billing information.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleManageBilling = async () => {
    setIsPortalLoading(true)
    try {
      const res = await subscriptionApi.getPortalUrl()
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Failed to open billing portal. Please try again.')
    } finally {
      setIsPortalLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Billing</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Manage your FlowMat subscription and billing
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Billing Status Card */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-700 rounded w-1/3" />
                <div className="h-12 bg-slate-700 rounded w-1/4" />
                <div className="h-4 bg-slate-700 rounded w-1/2" />
              </div>
            ) : status ? (
              <div className="space-y-5">
                {/* Tier Badge + Label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold text-white ${TIER_CONFIG[status.tier].bgColor}`}
                    >
                      {TIER_CONFIG[status.tier].label}
                    </span>
                    <span className="text-text-secondary text-sm">Current Plan</span>
                  </div>
                  {status.stripeSubscriptionId ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      No Subscription
                    </span>
                  )}
                </div>

                {/* Active Student Count */}
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                    Active Students
                  </p>
                  <p className="text-5xl font-bold text-text-primary">{status.activeStudents}</p>
                  <p className="text-text-muted text-xs mt-1">
                    Students currently enrolled and active
                  </p>
                </div>

                {/* Pricing Details */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                      Price / Student
                    </p>
                    <p className="text-text-primary text-xl font-semibold">
                      ${status.pricePerStudent}
                      <span className="text-text-muted text-sm font-normal">/mo</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                      Est. Monthly Bill
                    </p>
                    <p className="text-text-primary text-xl font-semibold">
                      {formatCurrency(status.estimatedMonthlyBill)}
                    </p>
                  </div>
                </div>

                {/* Next Invoice */}
                <div className="pt-1 border-t border-slate-700">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                    Next Invoice Date
                  </p>
                  <p className="text-text-primary text-base font-medium">
                    {formatDate(status.nextInvoiceDate)}
                  </p>
                </div>

                {/* Manage Billing Button */}
                <Button
                  onClick={handleManageBilling}
                  isLoading={isPortalLoading}
                  rightIcon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                  className="w-full mt-2"
                >
                  Manage Billing
                </Button>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Invoice History Placeholder */}
        <div>
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">
                Invoice History
              </p>
              <p className="text-text-primary font-semibold text-base mb-2">
                Invoice history coming soon
              </p>
              <p className="text-text-secondary text-sm">
                Your complete invoice history is available in the Stripe billing portal.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleManageBilling}
              isLoading={isPortalLoading}
              rightIcon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              className="mt-4 w-full"
              size="sm"
            >
              View in Stripe Portal
            </Button>
          </Card>
        </div>
      </div>

      {/* Tier Comparison Table */}
      <Card className="p-6">
        <h2 className="text-text-primary font-semibold text-base mb-4">Plan Tiers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-text-muted font-medium py-2 pr-4">Tier</th>
                <th className="text-left text-text-muted font-medium py-2 pr-4">Students</th>
                <th className="text-left text-text-muted font-medium py-2 pr-4">
                  Price / Student
                </th>
                <th className="text-left text-text-muted font-medium py-2" />
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => {
                const isCurrent = status?.tier === tier.key
                const cfg = TIER_CONFIG[tier.key]
                return (
                  <tr
                    key={tier.key}
                    className={`border-b border-slate-700/50 last:border-0 transition-colors ${
                      isCurrent ? 'bg-slate-700/30' : 'hover:bg-slate-700/10'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${cfg.bgColor} flex-shrink-0`}
                        />
                        <span
                          className={`font-semibold ${isCurrent ? cfg.textColor : 'text-text-primary'}`}
                        >
                          {tier.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{tier.range}</td>
                    <td className="py-3 pr-4 text-text-secondary">{tier.price}</td>
                    <td className="py-3">
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckIcon className="h-3.5 w-3.5" />
                          Current
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-text-muted text-xs mt-3">
          Billing is calculated monthly based on your active student count at the time of invoicing.
          Tiers are determined automatically.
        </p>
      </Card>
    </div>
  )
}
