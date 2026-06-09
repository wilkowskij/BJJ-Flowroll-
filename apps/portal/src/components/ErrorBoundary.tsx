import React from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
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
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-error opacity-60" />
          <div>
            <p className="text-text-primary font-semibold text-lg">Something went wrong</p>
            <p className="text-text-muted text-sm mt-1">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-card text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
