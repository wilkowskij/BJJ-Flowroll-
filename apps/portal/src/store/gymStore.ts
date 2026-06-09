import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GymConfig {
  gymId: string | null
  gymName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  tier: 'starter' | 'growth' | 'pro'
  activeStudentCount: number
  nextInvoiceDate: string | null
}

interface GymStore extends GymConfig {
  setGymConfig: (config: Partial<GymConfig>) => void
  reset: () => void
}

const defaults: GymConfig = {
  gymId: null,
  gymName: 'FlowMat Gym',
  logoUrl: null,
  primaryColor: '#1B4FD8',
  secondaryColor: '#F59E0B',
  tier: 'growth',
  activeStudentCount: 0,
  nextInvoiceDate: null,
}

export const useGymStore = create<GymStore>()(
  persist(
    (set) => ({
      ...defaults,
      setGymConfig: (config) => set((state) => ({ ...state, ...config })),
      reset: () => set(defaults),
    }),
    {
      name: 'flowmat-gym',
    },
  ),
)
