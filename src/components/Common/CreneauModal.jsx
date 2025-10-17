import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Users, Search } from 'lucide-react'
import Button from './Button'
import { useSession } from '../../contexts/SessionContext'
import { fetchEnseignants } from '../../services/api'

const CreneauModal = ({ isOpen, onClose, onSave, creneau = null, availableDates = [], existingCreneaux = [] }) => {
  const { currentSession } = useSession()
  
  // Plages horaires fixes
  const TIME_SLOTS = {
    '08:30': '10:00',
    '10:30': '12:00',
    '12:30': '14:00',
    '14:30': '16:00'
  }
  
  // Extraire les valeurs uniques existantes pour les dropdowns
  const existingHours = Object.keys(TIME_SLOTS) // Utiliser les plages fixes
  const existingRooms = [...new Set(existingCreneaux.map(c => c.cod_salle).filter(Boolean))].sort()
  const existingSemesters = [...new Set(existingCreneaux.map(c => c.semestre).filter(Boolean))]
  const existingTeachers = [...new Set(existingCreneaux.map(c => c.enseignant).filter(Boolean))]
  
  const [formData, setFormData] = useState({
    creneau_id: null, // AUTO INCREMENT
    id_session: currentSession?.id_session || '',
    dateExam: '',
    h_debut: '',
    h_fin: '',
    type_ex: 'E', // E = Écrit, O = Oral, TP = TP
    semestre: 'SEMESTRE 2',
    enseignant: '', // code_smartex_ens (INTEGER)
    cod_salle: ''
  })

  const [errors, setErrors] = useState({})
  const [teachers, setTeachers] = useState([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)

  // Charger les enseignants
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const data = await fetchEnseignants()
        // Filtrer seulement ceux avec participe_surveillance = true
        setTeachers(data.filter(t => t.participe_surveillance === true))
      } catch (error) {
        console.error('Erreur lors du chargement des enseignants:', error)
      }
    }
    if (isOpen) {
      loadTeachers()
    }
  }, [isOpen])

  useEffect(() => {
    if (creneau) {
      // Normaliser la date pour qu'elle corresponde au format YYYY-MM-DD des options
      let normalizedDate = creneau.dateExam || ''
      if (normalizedDate && normalizedDate.includes('/')) {
        // Convertir DD/MM/YYYY vers YYYY-MM-DD
        const [day, month, year] = normalizedDate.split('/')
        normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Normaliser h_debut pour enlever les secondes si présentes (08:30:00 → 08:30)
      let normalizedHDebut = creneau.h_debut || ''
      if (normalizedHDebut && normalizedHDebut.length > 5) {
        normalizedHDebut = normalizedHDebut.substring(0, 5) // Garder seulement HH:MM
      }
      
      setFormData({
        creneau_id: creneau.creneau_id || null,
        id_session: creneau.id_session || currentSession?.id_session || '',
        dateExam: normalizedDate,
        h_debut: normalizedHDebut,
        h_fin: creneau.h_fin || '',
        type_ex: creneau.type_ex || 'E',
        semestre: creneau.semestre || 'SEMESTRE 2',
        enseignant: creneau.enseignant || '',
        cod_salle: creneau.cod_salle || ''
      })
      
      // Trouver et afficher l'enseignant si présent
      if (creneau.enseignant) {
        const teacher = teachers.find(t => t.code_smartex_ens === creneau.enseignant)
        if (teacher) {
          setSelectedTeacher(teacher)
          setTeacherSearch(`${teacher.nom_ens} ${teacher.prenom_ens}`)
        }
      }
    } else {
      setFormData({
        creneau_id: null,
        id_session: currentSession?.id_session || '',
        dateExam: '',
        h_debut: '',
        h_fin: '',
        type_ex: 'E',
        semestre: 'SEMESTRE 2',
        enseignant: '',
        cod_salle: ''
      })
      setSelectedTeacher(null)
      setTeacherSearch('')
    }
    setErrors({})
    setShowTeacherDropdown(false)
  }, [creneau, isOpen, currentSession, teachers])

  const validate = () => {
    const newErrors = {}
    
    if (!formData.id_session) newErrors.id_session = 'Session obligatoire'
    if (!formData.dateExam) newErrors.dateExam = 'Date obligatoire'
    if (!formData.h_debut) newErrors.h_debut = 'Heure de début obligatoire'
    if (!formData.h_fin) newErrors.h_fin = 'Heure de fin obligatoire'
    if (!formData.cod_salle) newErrors.cod_salle = 'Salle obligatoire'

    // Vérifier que h_fin > h_debut
    if (formData.h_debut && formData.h_fin && formData.h_debut >= formData.h_fin) {
      newErrors.h_fin = 'L\'heure de fin doit être après l\'heure de début'
    }

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
    // Si on change l'heure de début, calculer automatiquement l'heure de fin
    if (field === 'h_debut' && TIME_SLOTS[value]) {
      setFormData(prev => ({ 
        ...prev, 
        h_debut: value,
        h_fin: TIME_SLOTS[value] // Remplir automatiquement l'heure de fin
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
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
            {creneau ? 'Modifier le créneau' : 'Ajouter un créneau'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Date d'examen *
              </label>
              {availableDates.length > 0 ? (
                <select
                  value={formData.dateExam}
                  onChange={(e) => handleChange('dateExam', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.dateExam ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Sélectionner une date</option>
                  {availableDates.map(date => {
                    // Normaliser la date vers YYYY-MM-DD pour la valeur
                    let normalizedValue = date
                    if (date.includes('/')) {
                      const [day, month, year] = date.split('/')
                      normalizedValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                    }
                    
                    const dateObj = date.includes('/') 
                      ? new Date(date.split('/').reverse().join('-'))
                      : new Date(date)
                    const displayDate = dateObj.toLocaleDateString('fr-FR', { 
                      weekday: 'short',
                      day: '2-digit', 
                      month: 'short',
                      year: 'numeric'
                    })
                    return (
                      <option key={date} value={normalizedValue}>
                        {displayDate}
                      </option>
                    )
                  })}
                </select>
              ) : (
                <input
                  type="date"
                  value={formData.dateExam}
                  onChange={(e) => handleChange('dateExam', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.dateExam ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              )}
              {errors.dateExam && <p className="text-red-500 text-xs mt-1">{errors.dateExam}</p>}
            </div>

            {/* Heure début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                Plage horaire *
              </label>
              <select
                value={formData.h_debut}
                onChange={(e) => handleChange('h_debut', e.target.value)}
                className={`w-full px-4 py-2 border ${errors.h_debut ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sélectionner une plage horaire</option>
                {Object.entries(TIME_SLOTS).map(([debut, fin]) => (
                  <option key={debut} value={debut}>
                    {debut} - {fin}
                  </option>
                ))}
              </select>
              {errors.h_debut && <p className="text-red-500 text-xs mt-1">{errors.h_debut}</p>}
            </div>

            {/* Semestre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semestre
              </label>
              <select
                value={formData.semestre}
                onChange={(e) => handleChange('semestre', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                {existingSemesters.length > 0 && existingSemesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
                {!existingSemesters.includes('SEMESTRE 1') && <option value="SEMESTRE 1">SEMESTRE 1</option>}
                {!existingSemesters.includes('SEMESTRE 2') && <option value="SEMESTRE 2">SEMESTRE 2</option>}
              </select>
            </div>

            {/* Code salle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Code salle *
              </label>
              {existingRooms.length > 0 ? (
                <select
                  value={formData.cod_salle}
                  onChange={(e) => handleChange('cod_salle', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.cod_salle ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Sélectionner</option>
                  {existingRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.cod_salle}
                  onChange={(e) => handleChange('cod_salle', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.cod_salle ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="B203"
                />
              )}
              {errors.cod_salle && <p className="text-red-500 text-xs mt-1">{errors.cod_salle}</p>}
            </div>

            {/* Enseignant (optionnel) - recherche par nom - PLEINE LARGEUR */}
            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-2" />
                Enseignant responsable
              </label>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value)
                      setShowTeacherDropdown(true)
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom, prénom ou code (ex: 135)..."
                  />
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  
                  {/* Dropdown de recherche */}
                  {showTeacherDropdown && teacherSearch && (() => {
                    // Filtrer les enseignants par nom, prénom OU code
                    const searchLower = teacherSearch.toLowerCase()
                    const filteredTeachers = teachers.filter(teacher => 
                      teacher.nom_ens.toLowerCase().includes(searchLower) ||
                      teacher.prenom_ens.toLowerCase().includes(searchLower) ||
                      teacher.code_smartex_ens.toString().includes(teacherSearch)
                    )
                    
                    return (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map(teacher => (
                            <div
                              key={teacher.code_smartex_ens}
                              onClick={() => {
                                setSelectedTeacher(teacher)
                                setTeacherSearch(`${teacher.nom_ens} ${teacher.prenom_ens}`)
                                setFormData(prev => ({ ...prev, enseignant: teacher.code_smartex_ens }))
                                setShowTeacherDropdown(false)
                              }}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">
                                  {teacher.nom_ens} {teacher.prenom_ens}
                                </p>
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {teacher.code_smartex_ens}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-sm text-center">
                            Aucun enseignant trouvé pour "{teacherSearch}"
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                
                {/* Affichage de l'enseignant sélectionné - À DROITE avec flex-1 */}
                {selectedTeacher && (
                  <div className="flex-1 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg flex items-center gap-3 shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <p className="text-sm font-semibold text-green-900">
                          {selectedTeacher.nom_ens} {selectedTeacher.prenom_ens}
                        </p>
                      </div>
                      <p className="text-xs text-green-700 ml-6">Code: {selectedTeacher.code_smartex_ens}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeacher(null)
                        setTeacherSearch('')
                        setFormData(prev => ({ ...prev, enseignant: '' }))
                      }}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Optionnel - Enseignant responsable du créneau</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} type="button">
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {creneau ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreneauModal
