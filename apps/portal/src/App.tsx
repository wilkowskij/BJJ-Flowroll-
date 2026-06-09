import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useGymStore } from './store/gymStore'
import { AppShell } from './components/layout/AppShell'
import Login from './pages/Login'
import TechniqueLibrary from './pages/TechniqueLibrary'
import FlowchartBuilder from './pages/FlowchartBuilder'
import WeeklyPosts from './pages/WeeklyPosts'
import ClassPlanner from './pages/ClassPlanner'
import StudentDashboard from './pages/StudentDashboard'
import BeltTracks from './pages/BeltTracks'
import Announcements from './pages/Announcements'
import GymSettings from './pages/GymSettings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { primaryColor, secondaryColor } = useGymStore()
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', primaryColor)
    document.documentElement.style.setProperty('--color-secondary', secondaryColor)
  }, [primaryColor, secondaryColor])

  useEffect(() => {
    const cleanup = init()
    return cleanup
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<TechniqueLibrary />} />
          <Route path="flowchart" element={<FlowchartBuilder />} />
          <Route path="posts" element={<WeeklyPosts />} />
          <Route path="planner" element={<ClassPlanner />} />
          <Route path="students" element={<StudentDashboard />} />
          <Route path="belt-tracks" element={<BeltTracks />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="settings" element={<GymSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
