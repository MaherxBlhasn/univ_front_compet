import { Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from '../../contexts/SessionContext'
import Sidebar from '../../components/Layout/Sidebar'
import SessionSelector from '../../Screens/SessionSelector'
import Dashboard from '../../Screens/Dashboard'
import StorageScreen from '../../Screens/StorageScreen'
import TeachersScreen from '../../Screens/TeachersScreen'
import SessionsScreen from '../../Screens/SessionsScreen'
import PlanningScreen from '../../Screens/PlanningScreen'
import VoeuxScreen from '../../Screens/VoeuxScreen'
import AffectationScreen from '../../Screens/AffectationScreen'
import AffectationsListScreen from '../../Screens/AffectationsListScreen'
import TelechargementScreen from '../../Screens/TelechargementScreen'
import QuotaDispersionScreen from '../../Screens/QuotaDispersionScreen'
import SettingsScreen from '../../Screens/SettingsScreen'

// Main content component that checks for session
const AppContent = () => {
  const { currentSession, loading } = useSession()

  // Show session selector if no session is selected
  if (!loading && !currentSession) {
    return <SessionSelector />
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Show main app when session is selected
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/storage" element={<StorageScreen />} />
        <Route path="/teachers" element={<TeachersScreen />} />
        <Route path="/quota-dispersion" element={<QuotaDispersionScreen />} />
        <Route path="/sessions" element={<SessionsScreen />} />
        <Route path="/planning" element={<PlanningScreen />} />
        {/* <Route path="/rooms" element={<RoomsScreen />} /> */}
        <Route path="/voeux" element={<VoeuxScreen />} />
        <Route path="/affectation" element={<AffectationScreen />} />
        <Route path="/affectations" element={<AffectationsListScreen />} />
        <Route path="/telechargement" element={<TelechargementScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  )
}

export default App
