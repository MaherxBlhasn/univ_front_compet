import { useState, useEffect } from 'react'
import { X, User, Calendar, CheckCircle, Search } from 'lucide-react'
import Button from './Button'
import { useSession } from '../../contexts/SessionContext'
import { fetchEnseignants } from '../../services/api'

const VoeuxModal = ({ isOpen, onClose, onSave, voeu = null }) => {
  const { currentSession } = useSession()
  const [formData, setFormData] = useState({
    code_smartex_ens: '',
    id_session: '',
    nom_ens: '',
    prenom_ens: '',
    jour: '',
    seance: ''
  })

  const [errors, setErrors] = useState({})
  const [enseignants, setEnseignants] = useState([])
  const [filteredEnseignants, setFilteredEnseignants] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Mapping des jours avec leurs noms
  const JOURS = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi'
  }

  // Options pour les séances avec horaires
  const SEANCES = {
    S1: '08:30-10:00',
    S2: '10:30-12:00',
    S3: '12:30-14:00',
    S4: '14:30-16:00'
  }

  useEffect(() => {
    if (isOpen) {
      loadEnseignants()
    }
    
    if (voeu) {
      setFormData({
        code_smartex_ens: voeu.code_smartex_ens || '',
        id_session: voeu.id_session || (currentSession?.id_session || ''),
        nom_ens: voeu.nom_ens || '',
        prenom_ens: voeu.prenom_ens || '',
        jour: voeu.jour || '',
        seance: voeu.seance || ''
      })
      setSearchTerm(`${voeu.prenom_ens} ${voeu.nom_ens}`)
    } else {
      setFormData({
        code_smartex_ens: '',
        id_session: currentSession?.id_session || '', // Default to current exam session
        nom_ens: '',
        prenom_ens: '',
        jour: '',
        seance: ''
      })
      setSearchTerm('')
    }
    setErrors({})
    setShowDropdown(false)
  }, [voeu, isOpen, currentSession])

  // Charger les enseignants qui participent à la surveillance
  const loadEnseignants = async () => {
    try {
      const data = await fetchEnseignants()
      // Filtrer seulement les enseignants qui participent à la surveillance
      const enseignantsParticipants = data.filter(e => e.participe_surveillance)
      setEnseignants(enseignantsParticipants)
      setFilteredEnseignants(enseignantsParticipants)
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants:', error)
    }
  }

  // Filtrer les enseignants selon la recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEnseignants(enseignants)
    } else {
      const filtered = enseignants.filter(e =>
        `${e.prenom_ens} ${e.nom_ens}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.code_smartex_ens.toString().includes(searchTerm)
      )
      setFilteredEnseignants(filtered)
    }
  }, [searchTerm, enseignants])

  // Sélectionner un enseignant
  const selectEnseignant = (enseignant) => {
    setFormData(prev => ({
      ...prev,
      code_smartex_ens: enseignant.code_smartex_ens,
      nom_ens: enseignant.nom_ens,
      prenom_ens: enseignant.prenom_ens
    }))
    setSearchTerm(`${enseignant.prenom_ens} ${enseignant.nom_ens}`)
    setShowDropdown(false)
    // Effacer les erreurs
    setErrors(prev => ({
      ...prev,
      code_smartex_ens: '',
      nom_ens: '',
      prenom_ens: ''
    }))
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.code_smartex_ens) newErrors.code_smartex_ens = 'Code enseignant obligatoire'
    if (!formData.id_session) newErrors.id_session = 'Session obligatoire'
    if (!formData.nom_ens) newErrors.nom_ens = 'Nom obligatoire'
    if (!formData.prenom_ens) newErrors.prenom_ens = 'Prénom obligatoire'
    if (!formData.jour) newErrors.jour = 'Jour obligatoire'
    if (!formData.seance) newErrors.seance = 'Séance obligatoire'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
      onClose()
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {voeu ? 'Modifier le vœu' : 'Ajouter un vœu'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Sélection enseignant */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Enseignant *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className={`w-full pl-10 pr-4 py-2.5 border ${errors.code_smartex_ens ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Rechercher un enseignant..."
              />
            </div>
            {errors.code_smartex_ens && <p className="text-red-500 text-xs mt-1">{errors.code_smartex_ens}</p>}
            
            {/* Dropdown des enseignants */}
            {showDropdown && filteredEnseignants.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredEnseignants.map((ens) => (
                  <button
                    key={ens.code_smartex_ens}
                    type="button"
                    onClick={() => selectEnseignant(ens)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {ens.prenom_ens} {ens.nom_ens}
                        </p>
                        <p className="text-sm text-gray-500">
                          Grade: {ens.grade_code_ens}
                        </p>
                      </div>
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Code: {ens.code_smartex_ens}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Afficher l'enseignant sélectionné */}
            {formData.code_smartex_ens && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <CheckCircle size={14} className="inline mr-1" />
                  Sélectionné: <strong>{formData.prenom_ens} {formData.nom_ens}</strong> (Code: {formData.code_smartex_ens})
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Jour *
              </label>
              <select
                value={formData.jour}
                onChange={(e) => handleChange('jour', e.target.value)}
                className={`w-full px-4 py-2.5 border ${errors.jour ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sélectionner un jour</option>
                {Object.entries(JOURS).map(([num, nom]) => (
                  <option key={num} value={num}>
                    {nom}
                  </option>
                ))}
              </select>
              {errors.jour && <p className="text-red-500 text-xs mt-1">{errors.jour}</p>}
            </div>

            {/* Séance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle size={16} className="inline mr-2" />
                Séance *
              </label>
              <select
                value={formData.seance}
                onChange={(e) => handleChange('seance', e.target.value)}
                className={`w-full px-4 py-2.5 border ${errors.seance ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sélectionner une séance</option>
                {Object.entries(SEANCES).map(([code, horaire]) => (
                  <option key={code} value={code}>
                    {code} - {horaire}
                  </option>
                ))}
              </select>
              {errors.seance && <p className="text-red-500 text-xs mt-1">{errors.seance}</p>}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <CheckCircle size={16} className="inline mr-2" />
              Les vœux permettent aux enseignants d'indiquer leurs Non disponibilités pour la surveillance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} type="button">
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {voeu ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VoeuxModal
