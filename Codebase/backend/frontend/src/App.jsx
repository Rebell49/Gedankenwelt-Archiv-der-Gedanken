import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useAuthStore } from './store/auth.store'
import { useToast, ToastContainer } from './components/common/Toast'

const Home = lazy(() => import('./pages/Home'))
const UniverseView = lazy(() => import('./pages/UniverseView'))
const PlanetDetail = lazy(() => import('./pages/PlanetDetail'))
const Admin = lazy(() => import('./pages/Admin'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const { user, initialize } = useAuthStore()
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Navbar />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/universe" element={<UniverseView />} />
              <Route path="/planets/:id" element={<PlanetDetail />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
              <Route path="/admin" element={user?.isAdmin ? <Admin /> : <Navigate to="/" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </Router>
    </ErrorBoundary>
  )
}
