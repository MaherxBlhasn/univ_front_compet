import { useState } from 'react'
import { useSession } from '../contexts/SessionContext'
import { Calendar, CheckCircle, Loader, Plus, RefreshCw } from 'lucide-react'
import Button from '../components/Common/Button'
import SessionModal from '../components/Common/SessionModal'
import { createSession } from '../services/api'
import { showNotification } from '../utils/exports'

const SessionSelector = () => {
  const { sessions, loading, changeSession, loadSessions } = useSession()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleCreateSession = async (sessionData) => {
    try {
      setCreating(true)
      const newSession = await createSession(sessionData)
      showNotification('Succès', 'Session créée avec succès', 'success')
      await loadSessions() // Reload sessions list
      setShowCreateModal(false)
      // Automatically select the new session
      changeSession(newSession)
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      showNotification('Erreur', 'Impossible de créer la session', 'error')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-lg">Chargement des sessions...</p>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={40} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Aucune session disponible</h1>
          <p className="text-gray-600 mb-6">
            Créez votre première session d'examen pour commencer.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
              Créer une session
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recharger
            </Button>
          </div>
        </div>

        {/* Modal de création */}
        <SessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSession}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={40} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue dans l'application
          </h1>
          <p className="text-gray-600">
            Sélectionnez une session d'examen pour commencer
          </p>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <button
              key={session.id_session}
              onClick={() => changeSession(session)}
              className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {/* Session Icon */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold">{session.libelle_session}</h3>
                  <p className="text-blue-100 text-sm">Session {session.id_session}</p>
                </div>
              </div>

              {/* Dates */}
              {(session.date_debut || session.date_fin) && (
                <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                  {session.date_debut && (
                    <div className="text-blue-100">
                      Début: {new Date(session.date_debut).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {session.date_fin && (
                    <div className="text-blue-100">
                      Fin: {new Date(session.date_fin).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              )}

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors duration-300"></div>
            </button>
          ))}

          {/* Create New Session Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-dashed border-white/30"
          >
            <div className="flex flex-col items-center justify-center h-full min-h-[140px]">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Plus size={28} />
              </div>
              <h3 className="text-lg font-bold">Créer une nouvelle session</h3>
              <p className="text-green-100 text-sm mt-1">Ajouter une session d'examen</p>
            </div>
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors duration-300"></div>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Astuce:</strong> Vous pourrez changer de session à tout moment depuis l'en-tête de l'application.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
          >
            Actualiser
          </Button>
        </div>

        {/* Modal de création */}
        <SessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSession}
        />
      </div>
    </div>
  )
}

export default SessionSelector
