import { useState } from 'react'
import { X, MapPin, Monitor } from 'lucide-react'
import Button from './Button'

const RoomModal = ({ isOpen, onClose, onSave, room = null }) => {
  const [formData, setFormData] = useState(room || {
    nom: '',
    capacite: 30,
    type: 'Salle TD',
    equipements: [],
    disponible: true
  })

  const equipementsOptions = ['Projecteur', 'Tableau', 'PC', 'Micro', 'Climatisation', 'Wifi']

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const toggleEquipement = (equip) => {
    setFormData(prev => ({
      ...prev,
      equipements: prev.equipements.includes(equip)
        ? prev.equipements.filter(e => e !== equip)
        : [...prev.equipements, equip]
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
                <MapPin className="text-blue-600" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {room ? 'Modifier la salle' : 'Ajouter une salle'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Nom et Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la salle *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: A101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Amphi">Amphi</option>
                    <option value="Salle TP">Salle TP</option>
                    <option value="Salle TD">Salle TD</option>
                  </select>
                </div>
              </div>

              {/* Capacité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité (nombre de places) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="200"
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Équipements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Monitor size={16} className="inline mr-2" />
                  Équipements disponibles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {equipementsOptions.map((equip) => (
                    <button
                      key={equip}
                      type="button"
                      onClick={() => toggleEquipement(equip)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        formData.equipements.includes(equip)
                          ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {equip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disponibilité */}
              <div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.disponible}
                    onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Salle disponible</span>
                    <p className="text-sm text-gray-600">Cette salle peut être utilisée pour les examens</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {room ? 'Mettre à jour' : 'Ajouter la salle'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RoomModal
