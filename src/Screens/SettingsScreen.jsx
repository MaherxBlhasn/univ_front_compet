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

  // Save all modified grades at once
  const handleSaveAllGrades = async () => {
    const modifiedGrades = gradesArray.filter(grade => isModified(grade.code_grade))

    if (modifiedGrades.length === 0) {
      return
    }

    // Save all modified grades
    for (const gradeObj of modifiedGrades) {
      await handleSaveGrade(gradeObj.code_grade)
    }
  }

  // Check if any grade has been modified
  const hasAnyModification = () => {
    return gradesArray.some(grade => isModified(grade.code_grade))
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <GraduationCap size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Quotas des grades d'enseignants</h3>
                  <p className="text-xs text-gray-600">Nombre maximum par grade</p>
                </div>
              </div>

              {/* Save All Button */}
              {hasAnyModification() && (
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSaveAllGrades}
                  className="whitespace-nowrap"
                >
                  Enregistrer tout
                </Button>
              )}
            </div>

            {/* Grid Layout for Grades */}
            <div className="p-4">
              {/* Grades Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {gradesArray.map((gradeObj) => {
                  const colors = getGradeColor(gradeObj.code_grade)
                  return (
                    <div
                      key={gradeObj.code_grade}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Grade Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {gradeObj.code_grade}
                        </span>
                        {/* Status Indicators */}
                        {saveStatus[gradeObj.code_grade] === 'success' && (
                          <CheckCircle size={16} className="text-green-500 animate-pulse" />
                        )}
                        {saveStatus[gradeObj.code_grade] === 'error' && (
                          <XCircle size={16} className="text-red-500 animate-pulse" />
                        )}
                        {isModified(gradeObj.code_grade) && !saveStatus[gradeObj.code_grade] && (
                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Modifié" />
                        )}
                      </div>

                      {/* Grade Name */}
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {gradeObj.grade}
                      </h4>

                      {/* Quota Input */}
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Quota maximum</label>
                        <input
                          type="number"
                          min="0"
                          value={gradeQuotas[gradeObj.code_grade] || 0}
                          onChange={(e) => handleQuotaChange(gradeObj.code_grade, e.target.value)}
                          className="w-full px-3 py-2 text-center text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total Footer */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-orange-600" />
                    <span className="text-sm font-bold text-gray-900">Total des quotas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-orange-600">
                      {Object.values(gradeQuotas).reduce((sum, quota) => sum + quota, 0)}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">max</span>
                  </div>
                </div>
              </div>
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
              {/* Note d'aide */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Comment trouver ces informations ?</strong>
                </p>
                <ul className="mt-2 text-xs text-blue-700 space-y-1 ml-4 list-disc">
                  <li><strong>Gmail :</strong> Serveur: smtp.gmail.com, Port: 587, utilisez un "Mot de passe d'application" (Compte Google → Sécurité → Validation en 2 étapes → Mots de passe d'application)</li>
                  <li><strong>Outlook :</strong> Serveur: smtp-mail.outlook.com, Port: 587</li>
                  <li><strong>Yahoo :</strong> Serveur: smtp.mail.yahoo.com, Port: 587</li>
                  <li>Le mot de passe d'application est différent de votre mot de passe email habituel pour des raisons de sécurité</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Serveur email
                    <span className="text-xs text-gray-500">(SMTP)</span>
                  </label>
                  <input
                    name="SMTP_SERVER"
                    placeholder="Ex: smtp.gmail.com"
                    value={emailConfig.SMTP_SERVER}
                    onChange={(e) => handleEmailFieldChange('SMTP_SERVER', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Adresse du serveur d'envoi d'emails</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Port du serveur</label>
                  <input
                    name="SMTP_PORT"
                    type="number"
                    placeholder="Ex: 587"
                    value={emailConfig.SMTP_PORT}
                    onChange={(e) => handleEmailFieldChange('SMTP_PORT', parseInt(e.target.value) || 0)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Généralement 587 ou 465</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email de connexion</label>
                  <input
                    name="SMTP_USER"
                    placeholder="Ex: votreemail@gmail.com"
                    value={emailConfig.SMTP_USER}
                    onChange={(e) => handleEmailFieldChange('SMTP_USER', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Votre adresse email complète</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Mot de passe d'application</label>
                  <input
                    name="SMTP_PASSWORD"
                    placeholder="Votre mot de passe"
                    value={emailConfig.SMTP_PASSWORD}
                    type="password"
                    onChange={(e) => handleEmailFieldChange('SMTP_PASSWORD', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">⚠️ Utilisez un mot de passe d'application, pas votre mot de passe habituel</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email d'envoi</label>
                  <input
                    name="FROM_EMAIL"
                    placeholder="Ex: noreply@votredomaine.com"
                    value={emailConfig.FROM_EMAIL}
                    onChange={(e) => handleEmailFieldChange('FROM_EMAIL', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email qui apparaîtra comme expéditeur</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Nom de l'expéditeur</label>
                  <input
                    name="FROM_NAME"
                    placeholder="Ex: Service des Examens"
                    value={emailConfig.FROM_NAME}
                    onChange={(e) => handleEmailFieldChange('FROM_NAME', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Nom affiché dans les emails reçus</p>
                </div>
              </div>

              {/* Test recipient field - explicit input for testing the mail */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Email de test</label>
                <input
                  placeholder="Ex: test@example.com"
                  name="TEST_RECIPIENT"
                  value={emailConfig.TEST_RECIPIENT || emailConfig.FROM_EMAIL}
                  onChange={(e) => handleEmailFieldChange('TEST_RECIPIENT', e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="mt-1 text-xs text-gray-500">Adresse email pour tester la configuration</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
                {/* Status Messages */}
                <div className="flex-1">
                  {emailSaveStatus === 'success' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle size={16} />
                      {emailSaveMessage}
                    </div>
                  )}
                  {emailSaveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                      <XCircle size={16} />
                      {emailSaveMessage}
                    </div>
                  )}
                  {emailTestStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                      <XCircle size={16} />
                      {emailTestMessage}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestEmail}
                    disabled={emailLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${emailTestStatus === 'success' ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : emailTestStatus === 'error' ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-50`}
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
                      <>
                        <RefreshCw size={16} /> Tester
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveEmailConfig}
                    disabled={emailLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} /> Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default SettingsScreen
