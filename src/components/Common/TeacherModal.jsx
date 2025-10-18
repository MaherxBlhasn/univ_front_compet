import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import { fetchGrades } from '../../services/api'

const TeacherModal = ({ isOpen, onClose, onSave, teacher = null }) => {
  const [formData, setFormData] = useState({
    code_smartex_ens: '',
    nom_ens: '',
    prenom_ens: '',
    email_ens: '',
    grade_code_ens: '',
    participe_surveillance: true
  })

  const [errors, setErrors] = useState({})
  const [grades, setGrades] = useState([])
  const [showGradeDropdown, setShowGradeDropdown] = useState(false)

  // Couleurs pour chaque grade (même que dans TeachersScreen)
  const getGradeColor = (gradeCode) => {
    const gradeColors = {
      'PR': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
      'PES': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
      'MC': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      'MA': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
      'PTC': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
      'AS': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      'AC': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
      'VA': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
      'EX': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    }
    return gradeColors[gradeCode] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  }

  // Charger les grades depuis l'API
  useEffect(() => {
    if (isOpen) {
      loadGrades()
    }
  }, [isOpen])

  const loadGrades = async () => {
    try {
      const gradesData = await fetchGrades()
      setGrades(gradesData)
      
      // Si pas de grade sélectionné et qu'on crée un nouveau, prendre le premier de la liste
      if (!teacher && gradesData.length > 0) {
        setFormData(prev => ({ ...prev, grade_code_ens: gradesData[0].code_grade }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des grades:', error)
    }
  }

  useEffect(() => {
    if (teacher) {
      setFormData(teacher)
    } else {
      setFormData({
        code_smartex_ens: '',
        nom_ens: '',
        prenom_ens: '',
        email_ens: '',
        grade_code_ens: grades.length > 0 ? grades[0].code_grade : '',
        participe_surveillance: true
      })
    }
    setErrors({})
  }, [teacher, isOpen, grades])

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGradeDropdown && !event.target.closest('.grade-dropdown-container')) {
        setShowGradeDropdown(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showGradeDropdown, isOpen])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.code_smartex_ens) {
      newErrors.code_smartex_ens = 'Le code Smartex est obligatoire'
    } else if (isNaN(formData.code_smartex_ens)) {
      newErrors.code_smartex_ens = 'Le code doit être un nombre'
    }

    if (!formData.nom_ens || formData.nom_ens.trim() === '') {
      newErrors.nom_ens = 'Le nom est obligatoire'
    }

    if (!formData.prenom_ens || formData.prenom_ens.trim() === '') {
      newErrors.prenom_ens = 'Le prénom est obligatoire'
    }

    if (formData.email_ens && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_ens)) {
      newErrors.email_ens = 'Email invalide'
    }

    if (!formData.grade_code_ens) {
      newErrors.grade_code_ens = 'Le grade est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        code_smartex_ens: parseInt(formData.code_smartex_ens)
      })
      onClose()
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {teacher ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Code Smartex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Smartex <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.code_smartex_ens}
                onChange={(e) => handleChange('code_smartex_ens', e.target.value)}
                disabled={!!teacher} // Ne pas modifier le code si on édite
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                  errors.code_smartex_ens ? 'border-red-500' : 'border-gray-300'
                } ${teacher ? '!bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Ex: 1001"
              />
              {errors.code_smartex_ens && (
                <p className="mt-1 text-sm text-red-600">{errors.code_smartex_ens}</p>
              )}
            </div>

            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom_ens}
                  onChange={(e) => handleChange('nom_ens', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                    errors.nom_ens ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ben Ahmed"
                />
                {errors.nom_ens && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom_ens}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prenom_ens}
                  onChange={(e) => handleChange('prenom_ens', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                    errors.prenom_ens ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mohamed"
                />
                {errors.prenom_ens && (
                  <p className="mt-1 text-sm text-red-600">{errors.prenom_ens}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email_ens}
                onChange={(e) => handleChange('email_ens', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                  errors.email_ens ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="mohamed.benahmed@isi.tn"
              />
              {errors.email_ens && (
                <p className="mt-1 text-sm text-red-600">{errors.email_ens}</p>
              )}
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="relative grade-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 cursor-pointer flex items-center gap-2 justify-between ${
                      errors.grade_code_ens ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {!formData.grade_code_ens ? (
                      <span className="text-gray-500">Sélectionnez un grade</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          getGradeColor(formData.grade_code_ens).bg
                        } ${
                          getGradeColor(formData.grade_code_ens).text
                        } ${
                          getGradeColor(formData.grade_code_ens).border
                        }`}>
                          {formData.grade_code_ens}
                        </span>
                        <span className="text-sm text-gray-700">
                          {grades.find(g => g.code_grade === formData.grade_code_ens)?.grade || formData.grade_code_ens}
                        </span>
                      </div>
                    )}
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showGradeDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {grades.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">Chargement des grades...</div>
                      ) : (
                        grades.sort((a, b) => a.code_grade.localeCompare(b.code_grade)).map((grade) => (
                          <button
                            type="button"
                            key={grade.code_grade}
                            onClick={() => {
                              handleChange('grade_code_ens', grade.code_grade)
                              setShowGradeDropdown(false)
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              getGradeColor(grade.code_grade).bg
                            } ${
                              getGradeColor(grade.code_grade).text
                            } ${
                              getGradeColor(grade.code_grade).border
                            }`}>
                              {grade.code_grade}
                            </span>
                            <span className="text-sm text-gray-600">
                              {grade.grade}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {/* Aperçu du grade sélectionné */}
                {formData.grade_code_ens && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Aperçu:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getGradeColor(formData.grade_code_ens).bg
                    } ${
                      getGradeColor(formData.grade_code_ens).text
                    } ${
                      getGradeColor(formData.grade_code_ens).border
                    }`}>
                      {formData.grade_code_ens}
                    </span>
                  </div>
                )}
              </div>
              {errors.grade_code_ens && (
                <p className="mt-1 text-sm text-red-600">{errors.grade_code_ens}</p>
              )}
            </div>

            {/* Participe Surveillance */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="participe_surveillance"
                checked={formData.participe_surveillance}
                onChange={(e) => handleChange('participe_surveillance', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="participe_surveillance" className="text-sm font-medium text-gray-700 cursor-pointer">
                Participe aux surveillances d'examens
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {teacher ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TeacherModal
