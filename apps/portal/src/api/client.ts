import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// VITE_API_URL is intentionally left empty in many environments so that requests
// go to the same origin via relative paths (/api/v1/...).  When the variable IS
// set it must include the protocol and host, e.g. https://api.example.com.
// If it is set but empty axios will still use relative paths — that is fine for
// same-origin deployments.  Cross-origin requests will fail with a network error
// which is caught per-call so callers receive a clear error state rather than a
// blank screen.
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1'

if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[apiClient] VITE_API_URL is not set — using relative path /api/v1. ' +
      'Requests will only work if the API runs on the same origin.',
  )
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    // Surface network errors (e.g. cross-origin when VITE_API_URL is wrong) with
    // a descriptive message so callers can show a meaningful error state.
    if (!error.response && error.request) {
      const networkErr = new Error(
        'Network error: could not reach the API. Check VITE_API_URL or ensure the server is running.',
      )
      return Promise.reject(networkErr)
    }
    return Promise.reject(error)
  },
)
