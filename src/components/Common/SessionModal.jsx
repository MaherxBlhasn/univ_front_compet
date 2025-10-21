import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import Button from './Button'

const SessionModal = ({ isOpen, onClose, onSave, session = null }) => {
  const [formData, setFormData] = useState({
    libelle_session: '',
    AU: '',
    Semestre: '',
    type_session: ''
  })

  // Update form data when session changes
  useEffect(() => {
    if (session) {
      setFormData({
        libelle_session: session.libelle_session || '',
        AU: session.AU || '',
        Semestre: session.Semestre || '',
        type_session: session.type_session || ''
      })
    } else {
      // Reset form for new session
      setFormData({
        libelle_session: '',
        AU: '',
        Semestre: '',
        type_session: ''
      })
    }
  }, [session, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
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
                  value={formData.libelle_session}
                  onChange={(e) => setFormData({ ...formData, libelle_session: e.target.value })}
                  placeholder="Ex: Session Janvier 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Année Universitaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année universitaire
                </label>
                <input
                  type="text"
                  value={formData.AU || ''}
                  onChange={(e) => setFormData({ ...formData, AU: e.target.value })}
                  placeholder="Ex: 2024-2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Semestre et Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semestre
                  </label>
                  <div className="flex gap-4 items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="semestre"
                        value="1"
                        checked={formData.Semestre === '1'}
                        onChange={(e) => setFormData({ ...formData, Semestre: e.target.value })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Semestre 1</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="semestre"
                        value="2"
                        checked={formData.Semestre === '2'}
                        onChange={(e) => setFormData({ ...formData, Semestre: e.target.value })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Semestre 2</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de session
                  </label>
                  <input
                    type="text"
                    value={formData.type_session || ''}
                    onChange={(e) => setFormData({ ...formData, type_session: e.target.value })}
                    placeholder="Ex: Principale, Rattrapage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
