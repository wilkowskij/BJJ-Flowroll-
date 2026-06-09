import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface State { hasError: boolean; error: Error | null }

export class MobileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message ?? 'Unexpected error.'}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0F172A', gap: 12 },
  title: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1E293B', borderRadius: 10 },
  buttonText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
})
