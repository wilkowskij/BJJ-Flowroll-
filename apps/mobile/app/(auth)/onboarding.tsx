import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import apiClient from '../../src/api/client'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  muted: '#94A3B8',
  primary: '#1B4FD8',
  inactive: '#334155',
  error: '#EF4444',
}

// ── Belt colours ──────────────────────────────────────────────────────────────
const BELTS: { label: string; value: string; color: string }[] = [
  { label: 'White', value: 'white', color: '#FFFFFF' },
  { label: 'Blue', value: 'blue', color: '#3B82F6' },
  { label: 'Purple', value: 'purple', color: '#A855F7' },
  { label: 'Brown', value: 'brown', color: '#92400E' },
  { label: 'Black', value: 'black', color: '#1E293B' },
]

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.brandMark}>
        <Text style={styles.brandLetter}>F</Text>
      </View>
      <Text style={styles.heading}>Welcome to FlowMat</Text>
      <Text style={styles.subheading}>Your BJJ journey starts here</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Step 2: Gym Code ──────────────────────────────────────────────────────────
function GymCodeStep({ onNext }: { onNext: (gymId: string) => void }) {
  const [gymCode, setGymCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const showComingSoon = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Browse gyms — coming soon!', ToastAndroid.SHORT)
    } else {
      Alert.alert('Coming Soon', 'Browse gyms will be available soon.')
    }
  }

  const handleJoin = async () => {
    setError(null)
    const code = gymCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Gym code must be exactly 6 characters.')
      return
    }
    setLoading(true)
    try {
      const response = await apiClient.post('/api/v1/gym/join', { gymCode: code })
      const gymId: string = response.data?.gymId ?? response.data?.id ?? code
      onNext(gymId)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Invalid gym code. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.heading}>Join Your Gym</Text>
      <Text style={styles.subheading}>
        Enter the 6-character code your instructor gave you
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.codeInput, error ? styles.inputError : null]}
          value={gymCode}
          onChangeText={(v) => { setGymCode(v); setError(null) }}
          placeholder="ABC123"
          placeholderTextColor={C.muted}
          autoCapitalize="characters"
          maxLength={6}
          autoCorrect={false}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>I have a gym code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={showComingSoon} activeOpacity={0.75}>
        <Text style={styles.secondaryButtonText}>Browse gyms</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Step 3: Profile Setup ─────────────────────────────────────────────────────
function ProfileStep({ onComplete }: { onComplete: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [beltLevel, setBeltLevel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login, userId, gymId, token } = useAuthStore()

  const handleComplete = async () => {
    setError(null)
    if (!displayName.trim()) {
      setError('Please enter your display name.')
      return
    }
    if (!beltLevel) {
      setError('Please select your belt level.')
      return
    }
    setLoading(true)
    try {
      await apiClient.put('/api/v1/users/me', {
        displayName: displayName.trim(),
        beltLevel,
      })
      // Refresh auth store with updated name
      if (userId && gymId && token) {
        login({ userId, gymId, token, studentName: displayName.trim() })
      }
      onComplete()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Could not save profile. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.heading}>Set Up Your Profile</Text>
      <Text style={styles.subheading}>Almost there — tell us about yourself</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={[styles.textInput, error && !beltLevel ? styles.inputError : null]}
          value={displayName}
          onChangeText={(v) => { setDisplayName(v); setError(null) }}
          placeholder="e.g. John Silva"
          placeholderTextColor={C.muted}
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Belt level</Text>
        <View style={styles.beltRow}>
          {BELTS.map((b) => (
            <TouchableOpacity
              key={b.value}
              style={[
                styles.beltOption,
                beltLevel === b.value && styles.beltOptionSelected,
              ]}
              onPress={() => { setBeltLevel(b.value); setError(null) }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.beltCircle,
                  { backgroundColor: b.color },
                  b.value === 'white' && styles.beltCircleWhite,
                ]}
              />
              <Text style={styles.beltLabel}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={[styles.errorText, { marginBottom: 8 }]}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Complete Setup</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

// ── Root Onboarding Screen ────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const { login, userId, token, studentName } = useAuthStore()

  const handleGymJoined = (gymId: string) => {
    // Persist gymId in auth store; keep existing fields
    if (userId && token) {
      login({ userId, gymId, token, studentName: studentName ?? '' })
    }
    setStep(2)
  }

  const handleProfileComplete = () => {
    router.replace('/(tabs)/')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressDots step={step} total={3} />
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <GymCodeStep onNext={handleGymJoined} />}
      {step === 2 && <ProfileStep onComplete={handleProfileComplete} />}
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  dotInactive: {
    backgroundColor: C.inactive,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 16,
  },
  brandMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  heading: {
    color: C.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheading: {
    color: C.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: C.inactive,
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: C.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    width: '100%',
    gap: 6,
  },
  label: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeInput: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.inactive,
    color: C.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.inactive,
    color: C.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: C.error,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    alignSelf: 'flex-start',
  },
  beltRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  beltOption: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.inactive,
    backgroundColor: C.card,
  },
  beltOptionSelected: {
    borderColor: C.primary,
    backgroundColor: '#1B4FD820',
  },
  beltCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  beltCircleWhite: {
    borderWidth: 1,
    borderColor: C.inactive,
  },
  beltLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
})
