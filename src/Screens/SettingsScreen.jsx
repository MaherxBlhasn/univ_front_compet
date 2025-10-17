import { useState, useEffect } from 'react'
import { Save, GraduationCap } from 'lucide-react'
import Header from '@components/Layout/Header'
import Button from '@components/Common/Button'
import Card from '@components/Common/Card'
import LoadingSpinner from '@components/Common/LoadingSpinner'
import { GRADE_LABELS } from '../data/mockData'
import { fetchGrades, updateGradeQuota } from '../services/api'

const SettingsScreen = () => {
  const [gradeQuotas, setGradeQuotas] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les grades et leurs quotas depuis l'API
  useEffect(() => {
    loadGrades()
  }, [])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const grades = await fetchGrades()
      
      // Créer un objet avec les quotas pour chaque grade
      const quotasMap = {}
      grades.forEach(grade => {
        quotasMap[grade.code_grade] = grade.quota || 0
      })
      
      setGradeQuotas(quotasMap)
    } catch (error) {
      console.error('Error loading grades:', error)
      // En cas d'erreur, utiliser les valeurs par défaut
      setGradeQuotas({
        'PR': 0, 'MA': 0, 'PTC': 0, 'AC': 0, 'VA': 0,
        'AS': 0, 'EX': 0, 'PES': 0, 'MC': 0, 'V': 0
      })
    } finally {
      setLoading(false)
    }
  }

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
      'V': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    }
    return gradeColors[gradeCode] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  }

  const handleQuotaChange = (gradeCode, value) => {
    setGradeQuotas(prev => ({
      ...prev,
      [gradeCode]: parseInt(value) || 0
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Sauvegarder chaque quota individuellement
      const savePromises = Object.entries(gradeQuotas).map(([code, quota]) => 
        updateGradeQuota(code, quota)
      )
      
      await Promise.all(savePromises)
      
      console.log('✅ Quotas de grades sauvegardés avec succès!')
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des quotas:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Header
        title="Gestion des Grades"
        subtitle="Configurez les quotas d'enseignants par grade"
        actions={
          <Button 
            variant="primary" 
            icon={Save} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <Card title="Gestion des Quotas de Grades" className="border-t-4 border-t-orange-500 shadow-lg">
          <div className="space-y-6">
              {/* Description */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-l-4 border-orange-500">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <GraduationCap size={24} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Définissez le nombre maximum d'enseignants par grade</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Configurez les quotas pour optimiser la répartition des enseignants</p>
                </div>
              </div>
              
              {/* Grid de grades - prend tout l'espace disponible */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                {Object.entries(GRADE_LABELS).map(([code, name]) => (
                  <div 
                    key={code} 
                    className="group relative bg-white p-5 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    {/* Badge en haut */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 ${
                        getGradeColor(code).bg
                      } ${
                        getGradeColor(code).text
                      } ${
                        getGradeColor(code).border
                      } group-hover:scale-110 transition-transform duration-200`}>
                        {code}
                      </span>
                    </div>
                    
                    {/* Nom du grade */}
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {name}
                    </label>
                    
                    {/* Input */}
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={gradeQuotas[code]}
                        onChange={(e) => handleQuotaChange(code, e.target.value)}
                        className="w-full px-4 py-2.5 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="0"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                        max
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total - sticky en bas */}
              <div className="mt-auto pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-xl border-2 border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <GraduationCap size={20} className="text-orange-600" />
                    </div>
                    <span className="text-base font-bold text-gray-800">Quota total :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-orange-600">
                      {Object.values(gradeQuotas).reduce((sum, quota) => sum + quota, 0)}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">enseignants</span>
                  </div>
                </div>
              </div>
            </div>
        </Card>
      </main>
    </div>
  )
}

export default SettingsScreen
