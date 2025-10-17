import { X, Calendar, Users, Clock, MapPin, FileText } from 'lucide-react'
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
                <h3 className="text-xl font-bold text-gray-900">{session.name}</h3>
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
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Statut:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Date de début</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(session.dateDebut).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={18} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Date de fin</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(session.dateFin).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Durée */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Durée de la session</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {Math.ceil((new Date(session.dateFin) - new Date(session.dateDebut)) / (1000 * 60 * 60 * 24))} jours
              </p>
            </div>

            {/* Niveaux */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Niveaux concernés</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.niveaux.map((niveau) => (
                  <span 
                    key={niveau} 
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium border-2 border-purple-300 hover:bg-purple-200 transition-colors"
                  >
                    {niveau}
                  </span>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-900">Examens</span>
                </div>
                <p className="text-3xl font-bold text-green-700">{session.nbExamens}</p>
                <p className="text-xs text-green-600 mt-1">examens planifiés</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin size={18} className="text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Salles</span>
                </div>
                <p className="text-3xl font-bold text-orange-700">{session.nbSalles}</p>
                <p className="text-xs text-orange-600 mt-1">salles utilisées</p>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Informations supplémentaires
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>ID:</strong> #{session.id}</p>
                <p><strong>Créée le:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                <p><strong>Dernière modification:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
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
