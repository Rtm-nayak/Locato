import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import FamilyDashboard from './pages/FamilyDashboard'
import VolunteerDashboard from './pages/VolunteerDashboard'
import AuthorityDashboard from './pages/AuthorityDashboard'
import MatchAlert from './pages/MatchAlert'
import HelpCentersMap from './pages/HelpCentersMap'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans antialiased">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/match" element={<MatchAlert />} />
          <Route path="/map" element={<HelpCentersMap />} />
          <Route
            path="/family"
            element={
              <ProtectedRoute roles={['family']}>
                <FamilyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute roles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority"
            element={
              <ProtectedRoute roles={['authority']}>
                <AuthorityDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '9999px',
              padding: '12px 16px',
              fontWeight: 600,
            },
            duration: 3800,
          }}
        />
      </div>
    </BrowserRouter>
  )
}
