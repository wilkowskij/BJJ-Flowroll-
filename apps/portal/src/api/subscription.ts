import { apiClient } from './client'

export interface BillingStatus {
  tier: 'starter' | 'growth' | 'pro'
  activeStudents: number
  pricePerStudent: number
  estimatedMonthlyBill: number
  nextInvoiceDate: string
  stripeSubscriptionId: string | null
}

export const subscriptionApi = {
  getBillingStatus: () => apiClient.get<BillingStatus>('/subscription/status'),
  getPortalUrl: () => apiClient.get<{ url: string }>('/subscription/portal'),
}
