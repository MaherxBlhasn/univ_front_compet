import { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useSession } from '../../contexts/SessionContext'

const Header = ({ title, subtitle, actions }) => {
  const { currentSession, sessions, changeSession } = useSession()
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSessionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs lg:text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>}
              </div>

              {/* Session Dropdown */}
              {currentSession && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors border border-blue-200"
                  >
                    <Calendar size={18} />
                    <span className="font-semibold text-sm hidden md:inline">{currentSession.libelle_session}</span>
                    <ChevronDown size={16} className={`transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showSessionDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                      {sessions.map((session) => (
                        <button
                          key={session.id_session}
                          onClick={() => {
                            changeSession(session)
                            setShowSessionDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-3 transition-colors ${currentSession?.id_session === session.id_session
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{session.libelle_session}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Session {session.id_session}
                              </p>
                            </div>
                            {currentSession?.id_session === session.id_session && (
                              <span className="text-xs font-semibold text-blue-600">Actuelle</span>
                            )}
                          </div>
                          {(session.date_debut || session.date_fin) && (
                            <div className="mt-1 text-xs text-gray-500">
                              {session.date_debut && (
                                <span>Début: {new Date(session.date_debut).toLocaleDateString('fr-FR')}</span>
                              )}
                              {session.date_debut && session.date_fin && <span className="mx-1">•</span>}
                              {session.date_fin && (
                                <span>Fin: {new Date(session.date_fin).toLocaleDateString('fr-FR')}</span>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Header
