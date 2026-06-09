import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ErrorBoundary } from '../ErrorBoundary'

const pageTitles: Record<string, string> = {
  '/library': 'Technique Library',
  '/flowchart': 'Flowchart Builder',
  '/posts': 'Weekly Posts',
  '/planner': 'Class Planner',
  '/students': 'Student Dashboard',
  '/settings': 'Gym Settings',
}

export function AppShell() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'FlowMat'

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <div className="animate-in fade-in duration-200">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
