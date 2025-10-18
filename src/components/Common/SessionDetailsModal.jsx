import { X, Calendar, Clock, FileText } from 'lucide-react'
import Button from './Button'

const SessionDetailsModal = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null

  const getStatusColor = (status) => {
    const colors = {
      'En cours': 'bg-green-100 text-green-700 border-green-300',
      'Terminée': 'bg-gray-100 text-gray-700 border-gray-300',
      'Planifiée': 'bg-blue-100 text-blue-700 border-blue-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{session.libelle_session}</h3>
                <p className="text-sm text-gray-600">Détails de la session</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.date_debut && (
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Date de début</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(session.date_debut).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {session.date_fin && (
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Date de fin</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(session.date_fin).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Durée */}
            {session.date_debut && session.date_fin && (
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Durée de la session</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.ceil((new Date(session.date_fin) - new Date(session.date_debut)) / (1000 * 60 * 60 * 24))} jours
                </p>
              </div>
            )}

            {/* Additional Info */}
            {(session.AU || session.Semestre || session.type_session) && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Informations de la session
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  {session.AU && <p><strong>Année universitaire:</strong> {session.AU}</p>}
                  {session.Semestre && <p><strong>Semestre:</strong> {session.Semestre}</p>}
                  {session.type_session && <p><strong>Type de session:</strong> {session.type_session}</p>}
                  <p><strong>ID:</strong> #{session.id_session}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="primary">
              Modifier la session
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionDetailsModal
