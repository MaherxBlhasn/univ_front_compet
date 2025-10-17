import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import Button from './Button'

const SessionModal = ({ isOpen, onClose, onSave, session = null }) => {
  const [formData, setFormData] = useState(session || {
    name: '',
    dateDebut: '',
    dateFin: '',
    niveaux: [],
    status: 'Planifiée'
  })

  const niveauxOptions = ['L1', 'L2', 'L3', 'M1', 'M2']

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const toggleNiveau = (niveau) => {
    setFormData(prev => ({
      ...prev,
      niveaux: prev.niveaux.includes(niveau)
        ? prev.niveaux.filter(n => n !== niveau)
        : [...prev.niveaux, niveau]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {session ? 'Modifier la session' : 'Nouvelle session d\'examen'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Nom de la session */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la session *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Session Janvier 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Niveaux */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveaux concernés *
                </label>
                <div className="flex flex-wrap gap-2">
                  {niveauxOptions.map((niveau) => (
                    <button
                      key={niveau}
                      type="button"
                      onClick={() => toggleNiveau(niveau)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.niveaux.includes(niveau)
                          ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {niveau}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Planifiée">Planifiée</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {session ? 'Mettre à jour' : 'Créer la session'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SessionModal
