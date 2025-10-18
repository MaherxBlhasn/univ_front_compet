import { createContext, useContext, useState, useEffect } from 'react'
import { showNotification } from '../utils/exports'

const SessionContext = createContext()

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Load sessions from API
  const loadSessions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/sessions')
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data)
      return data
    } catch (error) {
      console.error('Error loading sessions:', error)
      showNotification('Erreur', 'Impossible de charger les sessions', 'error')
      return []
    }
  }

  // Initialize session from localStorage or load from API
  useEffect(() => {
    const initSession = async () => {
      setLoading(true)

      // Load all sessions
      const loadedSessions = await loadSessions()

      // Try to get saved session from localStorage
      const savedSessionId = localStorage.getItem('selectedSessionId')

      if (savedSessionId && loadedSessions.length > 0) {
        const savedSession = loadedSessions.find(
          s => s.id_session.toString() === savedSessionId
        )
        if (savedSession) {
          setCurrentSession(savedSession)
        }
      }

      setLoading(false)
    }

    initSession()
  }, [])

  // Change session
  const changeSession = (session) => {
    setCurrentSession(session)
    if (session) {
      localStorage.setItem('selectedSessionId', session.id_session.toString())
      showNotification('Session changée', `Session: ${session.libelle_session}`, 'success')
    } else {
      localStorage.removeItem('selectedSessionId')
    }
  }

  // Clear session (logout or reset)
  const clearSession = () => {
    setCurrentSession(null)
    localStorage.removeItem('selectedSessionId')
  }

  // Refresh sessions after delete/update
  const refreshSessions = async () => {
    const loadedSessions = await loadSessions()

    // Si la session actuelle n'existe plus, la retirer
    if (currentSession) {
      const stillExists = loadedSessions.find(
        s => s.id_session === currentSession.id_session
      )
      if (!stillExists) {
        clearSession()
        return true // Indique que la session courante a été supprimée
      }
    }

    return false
  }

  const value = {
    currentSession,
    sessions,
    loading,
    changeSession,
    clearSession,
    loadSessions,
    refreshSessions
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export default SessionContext
