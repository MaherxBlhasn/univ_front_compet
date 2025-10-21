import { useState, useEffect } from 'react'
import { Save, GraduationCap, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Header from '@components/Layout/Header'
import Button from '@components/Common/Button'
import Card from '@components/Common/Card'
import LoadingSpinner from '@components/Common/LoadingSpinner'
import { fetchGrades, updateGradeQuota, getEmailConfig, setEmailConfig, testEmailConfig } from '../services/api'
import { validateEmail } from '../utils/validators'

const SettingsScreen = () => {
  const [gradeQuotas, setGradeQuotas] = useState({})
  const [originalQuotas, setOriginalQuotas] = useState({}) // Track original values from backend
  const [gradesArray, setGradesArray] = useState([]) // Array of grades from backend
  const [loading, setLoading] = useState(true)
  const [savingGrades, setSavingGrades] = useState({}) // Track which grade is currently saving
  const [saveStatus, setSaveStatus] = useState({}) // Track save status per grade: { code_grade: 'success' | 'error' | null }
  // Email config state
  const [emailConfig, setEmailConfigState] = useState({
    SMTP_SERVER: '',
    SMTP_PORT: 587,
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    FROM_EMAIL: '',
    FROM_NAME: ''
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailTestStatus, setEmailTestStatus] = useState(null) // 'success' | 'error' | null
  const [emailTestMessage, setEmailTestMessage] = useState('')
  const [emailSaveStatus, setEmailSaveStatus] = useState(null) // 'success' | 'error' | null
  const [emailSaveMessage, setEmailSaveMessage] = useState('')

  // Charger les grades et leurs quotas depuis l'API
  useEffect(() => {
    loadGrades()
    loadEmailConfig()
  }, [])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const grades = await fetchGrades()

      // Save the grades array for rendering
      setGradesArray(grades)

      // Créer un objet avec les quotas pour chaque grade
      const quotasMap = {}
      grades.forEach(grade => {
        quotasMap[grade.code_grade] = grade.quota || 0
      })

      setGradeQuotas(quotasMap)
      setOriginalQuotas(quotasMap) // Save original values
    } catch (error) {
      console.error('Error loading grades:', error)
      setGradeQuotas({})
      setOriginalQuotas({})
      setGradesArray([])
    } finally {
      setLoading(false)
    }
  }

  const loadEmailConfig = async () => {
    try {
      setEmailLoading(true)
      const config = await getEmailConfig()
      // The backend returns keys like FROM_EMAIL etc. We'll merge defaults to be safe
      setEmailConfigState(prev => ({ ...prev, ...config }))
    } catch (error) {
      // ignore if not configured yet
      console.warn('No email config found or error loading it:', error)
    } finally {
      setEmailLoading(false)
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
    // Clear any previous status when user changes value
    setSaveStatus(prev => ({ ...prev, [gradeCode]: null }))
  }

  // Check if a grade has been modified
  const isModified = (gradeCode) => {
    return gradeQuotas[gradeCode] !== originalQuotas[gradeCode]
  }

  // Save individual grade quota
  const handleSaveGrade = async (gradeCode) => {
    try {
      setSavingGrades(prev => ({ ...prev, [gradeCode]: true }))
      setSaveStatus(prev => ({ ...prev, [gradeCode]: null }))

      await updateGradeQuota(gradeCode, gradeQuotas[gradeCode])

      // Update original value after successful save
      setOriginalQuotas(prev => ({ ...prev, [gradeCode]: gradeQuotas[gradeCode] }))
      setSaveStatus(prev => ({ ...prev, [gradeCode]: 'success' }))

      // Clear success indicator after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [gradeCode]: null }))
      }, 2000)

    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde du grade ${gradeCode}:`, error)
      setSaveStatus(prev => ({ ...prev, [gradeCode]: 'error' }))

      // Clear error indicator after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [gradeCode]: null }))
      }, 3000)
    } finally {
      setSavingGrades(prev => ({ ...prev, [gradeCode]: false }))
    }
  }

  // Email handlers
  const handleEmailFieldChange = (field, value) => {
    setEmailConfigState(prev => ({ ...prev, [field]: value }))
    setEmailTestStatus(null)
    setEmailTestMessage('')
  }

  const handleSaveEmailConfig = async () => {
    try {
      setEmailLoading(true)
      // Basic validation
      if (!emailConfig.SMTP_SERVER || !emailConfig.SMTP_USER || !emailConfig.SMTP_PASSWORD || !validateEmail(emailConfig.FROM_EMAIL)) {
        setEmailSaveStatus('error')
        setEmailSaveMessage('Veuillez renseigner SMTP_SERVER, SMTP_USER, SMTP_PASSWORD et un FROM_EMAIL valide')
        return
      }

      await setEmailConfig(emailConfig)
      setEmailSaveStatus('success')
      setEmailSaveMessage('Configuration enregistrée')
      setTimeout(() => {
        setEmailSaveStatus(null)
        setEmailSaveMessage('')
      }, 2000)
    } catch (error) {
      console.error('Error saving email config', error)
      setEmailSaveStatus('error')
      setEmailSaveMessage(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setEmailLoading(true)
      setEmailTestStatus(null)
      setEmailTestMessage('')
      // First save current config so backend test uses the latest values
      try {
        await setEmailConfig(emailConfig)
      } catch (saveErr) {
        // If saving fails, abort test and show save error
        setEmailTestStatus('error')
        setEmailTestMessage(`Impossible d'enregistrer la configuration avant le test: ${saveErr.message || saveErr}`)
        return
      }
      // Prefer explicit TEST_RECIPIENT if provided, otherwise use FROM_EMAIL
      const to = (emailConfig.TEST_RECIPIENT && validateEmail(emailConfig.TEST_RECIPIENT))
        ? emailConfig.TEST_RECIPIENT
        : (emailConfig.FROM_EMAIL && validateEmail(emailConfig.FROM_EMAIL)) ? emailConfig.FROM_EMAIL : ''
      if (!to) {
        setEmailTestStatus('error')
        setEmailTestMessage('Veuillez renseigner un FROM_EMAIL valide pour le test')
        return
      }

      const res = await testEmailConfig(to)
      if (res && res.success) {
        setEmailTestStatus('success')
        setEmailTestMessage('Test réussi')
        // Clear after a few seconds
        setTimeout(() => setEmailTestStatus(null), 2000)
      } else {
        setEmailTestStatus('error')
        setEmailTestMessage(res.error || 'Test échoué')
      }
    } catch (error) {
      console.error('Email test failed', error)
      setEmailTestStatus('error')
      setEmailTestMessage(error.message || 'Erreur lors du test')
    } finally {
      setEmailLoading(false)
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
        title="Gestion des paramètres"
        subtitle="Modifiez les quotas par grade et configurez l'envoi d'emails"
        actions={
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={loadGrades}
          >
            Actualiser
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="w-full">
          <Card className="shadow-lg">
            {/* Header Section */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <GraduationCap size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Quotas des grades d'enseignants</h3>
                <p className="text-xs text-gray-600">Nombre maximum par grade</p>
              </div>
            </div>

            {/* Compact Table Layout */}
            {/* Grades Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Quota Maximum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gradesArray.map((gradeObj, index) => {
                    const colors = getGradeColor(gradeObj.code_grade)
                    return (
                      <tr
                        key={gradeObj.code_grade}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Grade Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {gradeObj.code_grade}
                          </span>
                        </td>

                        {/* Grade Name */}
                        <td className="px-6 py-4">
                          <span className="text-base font-medium text-gray-900">
                            {gradeObj.grade}
                          </span>
                        </td>

                        {/* Quota Input */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-4">
                            <input
                              type="number"
                              min="0"
                              value={gradeQuotas[gradeObj.code_grade] || 0}
                              onChange={(e) => handleQuotaChange(gradeObj.code_grade, e.target.value)}
                              className="w-24 px-3 py-2 text-center text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            />

                            {/* Save Button - Shows when modified */}
                              {isModified(gradeObj.code_grade) && saveStatus[gradeObj.code_grade] !== 'success' && (
                              <button
                                onClick={() => handleSaveGrade(gradeObj.code_grade)}
                                disabled={savingGrades[gradeObj.code_grade]}
                                className="p-2 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Enregistrer ce quota"
                              >
                                <Save size={16} className="text-orange-600" />
                              </button>
                            )}

                            {/* Status Indicators */}
                            {saveStatus[gradeObj.code_grade] === 'success' && (
                              <CheckCircle size={18} className="text-green-500 animate-pulse" />
                            )}
                            {saveStatus[gradeObj.code_grade] === 'error' && (
                              <XCircle size={18} className="text-red-500 animate-pulse" />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Total Footer */}
                <tfoot>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 border-t-2 border-orange-200">
                    <td colSpan="2" className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={18} className="text-orange-600" />
                        <span className="text-sm font-bold text-gray-900">Total des quotas</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-orange-600">
                          {Object.values(gradeQuotas).reduce((sum, quota) => sum + quota, 0)}
                        </span>
                        <span className="text-xs text-gray-600 font-medium">max</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Email Configuration Card - placed below the grades */}
          <Card className="shadow-lg mt-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-sky-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <GraduationCap size={20} className="text-cyan-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Configuration Email (SMTP)</h3>
                <p className="text-xs text-gray-600">Configurer et tester l'envoi d'emails</p>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP Server</label>
                  <input
                    name="SMTP_SERVER"
                    placeholder="smtp.example.com"
                    value={emailConfig.SMTP_SERVER}
                    onChange={(e) => handleEmailFieldChange('SMTP_SERVER', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP Port</label>
                  <input
                    name="SMTP_PORT"
                    type="number"
                    placeholder="587"
                    value={emailConfig.SMTP_PORT}
                    onChange={(e) => handleEmailFieldChange('SMTP_PORT', parseInt(e.target.value) || 0)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP User</label>
                  <input
                    name="SMTP_USER"
                    placeholder="user@example.com"
                    value={emailConfig.SMTP_USER}
                    onChange={(e) => handleEmailFieldChange('SMTP_USER', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">SMTP Password</label>
                  <input
                    name="SMTP_PASSWORD"
                    placeholder="Mot de passe"
                    value={emailConfig.SMTP_PASSWORD}
                    type="password"
                    onChange={(e) => handleEmailFieldChange('SMTP_PASSWORD', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">From Email</label>
                  <input
                    name="FROM_EMAIL"
                    placeholder="from@example.com"
                    value={emailConfig.FROM_EMAIL}
                    onChange={(e) => handleEmailFieldChange('FROM_EMAIL', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">From Name</label>
                  <input
                    name="FROM_NAME"
                    placeholder="Service Exams"
                    value={emailConfig.FROM_NAME}
                    onChange={(e) => handleEmailFieldChange('FROM_NAME', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Test recipient field - explicit input for testing the mail */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Adresse destinataire pour le test</label>
                <input
                  placeholder="ex: test@example.com"
                  name="TEST_RECIPIENT"
                  value={emailConfig.TEST_RECIPIENT || emailConfig.FROM_EMAIL}
                  onChange={(e) => handleEmailFieldChange('TEST_RECIPIENT', e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleSaveEmailConfig}
                  disabled={emailLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <Save size={16} /> Enregistrer
                </button>
                {emailSaveStatus === 'success' && (
                  <span className="text-sm text-green-600 font-medium">{emailSaveMessage}</span>
                )}
                {emailSaveStatus === 'error' && (
                  <span className="text-sm text-red-600 font-medium">{emailSaveMessage}</span>
                )}

                <button
                  onClick={handleTestEmail}
                  disabled={emailLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${emailTestStatus === 'success' ? 'bg-green-600 text-white border-green-700' : emailTestStatus === 'error' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-gray-700 border-gray-200'} disabled:opacity-50`}
                >
                  {emailTestStatus === 'success' ? (
                    <>
                      <CheckCircle size={16} /> Test réussi
                    </>
                  ) : emailTestStatus === 'error' ? (
                    <>
                      <XCircle size={16} /> Test échoué
                    </>
                  ) : (
                    'Tester le mail'
                  )}
                </button>
              </div>

              {emailTestStatus === 'error' && (
                <p className="mt-2 text-sm text-red-600">{emailTestMessage}</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default SettingsScreen
