import { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { useSession } from '../../contexts/SessionContext'

const Header = ({ title, subtitle, actions }) => {
  const { currentSession, sessions, changeSession } = useSession()
  const [showSessionModal, setShowSessionModal] = useState(false)

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
              
              {/* Session Indicator */}
              {currentSession && (
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors border border-blue-200"
                >
                  <Calendar size={18} />
                  <span className="font-semibold text-sm hidden md:inline">{currentSession.libelle_session}</span>
                  <ChevronDown size={16} />
                </button>
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

      {/* Session Change Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Changer de session</h2>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sessions List */}
            <div className="p-6 space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id_session}
                  onClick={() => {
                    changeSession(session)
                    setShowSessionModal(false)
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    currentSession?.id_session === session.id_session
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.libelle_session}</h3>
                      <p className="text-sm text-gray-500">Session {session.id_session}</p>
                    </div>
                    {currentSession?.id_session === session.id_session && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Calendar size={20} />
                        <span className="text-sm font-semibold">Actuelle</span>
                      </div>
                    )}
                  </div>
                  {(session.date_debut || session.date_fin) && (
                    <div className="mt-2 text-sm text-gray-600">
                      {session.date_debut && (
                        <span>Début: {new Date(session.date_debut).toLocaleDateString('fr-FR')}</span>
                      )}
                      {session.date_debut && session.date_fin && <span className="mx-2">•</span>}
                      {session.date_fin && (
                        <span>Fin: {new Date(session.date_fin).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
