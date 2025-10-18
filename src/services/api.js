import API_CONFIG from '../config/api'

// Fonction utilitaire pour gérer les requêtes
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_CONFIG.baseURL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

// ==================== ENSEIGNANTS ====================

// Convertir les valeurs SQLite (0/1) en boolean JavaScript (true/false)
const convertEnseignantBooleans = (enseignant) => {
  return {
    ...enseignant,
    participe_surveillance: Boolean(enseignant.participe_surveillance)
  }
}

export const fetchEnseignants = async () => {
  const data = await apiRequest(API_CONFIG.endpoints.enseignants)
  // Convertir tous les enseignants
  return data.map(convertEnseignantBooleans)
}

export const fetchEnseignant = async (code_smartex_ens) => {
  const data = await apiRequest(API_CONFIG.endpoints.enseignant(code_smartex_ens))
  return convertEnseignantBooleans(data)
}

export const createEnseignant = async (enseignantData) => {
  // Convertir boolean en 0/1 pour SQLite
  const dataForDB = {
    ...enseignantData,
    participe_surveillance: enseignantData.participe_surveillance ? 1 : 0
  }
  
  const result = await apiRequest(API_CONFIG.endpoints.enseignants, {
    method: 'POST',
    body: JSON.stringify(dataForDB),
  })
  
  return convertEnseignantBooleans(result)
}

export const updateEnseignant = async (code_smartex_ens, enseignantData) => {
  // Convertir boolean en 0/1 pour SQLite
  const dataForDB = {
    ...enseignantData,
    participe_surveillance: enseignantData.participe_surveillance ? 1 : 0
  }
  
  const result = await apiRequest(API_CONFIG.endpoints.enseignant(code_smartex_ens), {
    method: 'PUT',
    body: JSON.stringify(dataForDB),
  })
  
  return convertEnseignantBooleans(result)
}

export const deleteEnseignant = async (code_smartex_ens) => {
  return await apiRequest(API_CONFIG.endpoints.enseignant(code_smartex_ens), {
    method: 'DELETE',
  })
}

export const deleteAllEnseignants = async () => {
  return await apiRequest(API_CONFIG.endpoints.deleteAllEnseignants, {
    method: 'DELETE',
  })
}

// ==================== GRADES ====================

export const fetchGrades = async () => {
  return await apiRequest(API_CONFIG.endpoints.grades)
}

export const fetchGradeQuotas = async () => {
  return await apiRequest(API_CONFIG.endpoints.gradeQuotas)
}

export const updateGradeQuota = async (code_grade, quota) => {
  return await apiRequest(API_CONFIG.endpoints.updateGradeQuota(code_grade), {
    method: 'PUT',
    body: JSON.stringify({ quota })
  })
}

// ==================== SESSIONS ====================

export const fetchSessions = async () => {
  return await apiRequest(API_CONFIG.endpoints.sessions)
}

export const fetchSession = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.session(id_session))
}

export const createSession = async (sessionData) => {
  return await apiRequest(API_CONFIG.endpoints.sessions, {
    method: 'POST',
    body: JSON.stringify(sessionData),
  })
}

export const updateSession = async (id_session, sessionData) => {
  return await apiRequest(API_CONFIG.endpoints.session(id_session), {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  })
}

export const deleteSession = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.session(id_session), {
    method: 'DELETE',
  })
}

export const deleteAllSessions = async () => {
  return await apiRequest(API_CONFIG.endpoints.deleteAllSessions, {
    method: 'DELETE',
  })
}

export const checkSessionData = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.checkSessionData(id_session))
}

// ==================== SALLES ====================

export const fetchSalles = async () => {
  return await apiRequest(API_CONFIG.endpoints.salles)
}

// ==================== PLANNING ====================

export const fetchPlanning = async () => {
  return await apiRequest(API_CONFIG.endpoints.planning)
}

// ==================== VOEUX ====================

export const fetchVoeux = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.code_smartex_ens) {
    params.append('code_smartex_ens', filters.code_smartex_ens)
  }
  if (filters.id_session) {
    params.append('id_session', filters.id_session)
  }
  
  const queryString = params.toString()
  const endpoint = queryString ? `${API_CONFIG.endpoints.voeux}?${queryString}` : API_CONFIG.endpoints.voeux
  return await apiRequest(endpoint)
}

export const fetchVoeu = async (voeu_id) => {
  return await apiRequest(API_CONFIG.endpoints.voeu(voeu_id))
}

export const createVoeu = async (voeuData) => {
  return await apiRequest(API_CONFIG.endpoints.voeux, {
    method: 'POST',
    body: JSON.stringify(voeuData)
  })
}

export const updateVoeu = async (voeu_id, voeuData) => {
  return await apiRequest(API_CONFIG.endpoints.voeu(voeu_id), {
    method: 'PUT',
    body: JSON.stringify(voeuData)
  })
}

export const deleteVoeu = async (voeu_id) => {
  return await apiRequest(API_CONFIG.endpoints.voeu(voeu_id), {
    method: 'DELETE'
  })
}

export const deleteAllVoeux = async () => {
  return await apiRequest(API_CONFIG.endpoints.deleteAllVoeux, {
    method: 'DELETE'
  })
}

// ==================== UPLOAD / IMPORT ====================

/**
 * Upload and import file in one step (supports CSV and XLSX)
 * @param {File} file - Le fichier à uploader (CSV ou XLSX)
 * @param {string} type - Type: 'enseignants', 'creneaux', ou 'voeux'
 * @param {number} id_session - ID de la session (requis pour creneaux et voeux)
 * @returns {Promise<{success: boolean, upload: object, import: object}>}
 */
export const uploadAndImportFile = async (file, type, id_session = null) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  if (id_session) {
    formData.append('id_session', id_session)
  }
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadAndImport}`
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Ne pas ajouter Content-Type, le navigateur le fera automatiquement avec boundary
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Upload failed: ${response.status}`)
  }
  
  return await response.json()
}

/**
 * Upload un fichier et retourne le chemin
 * @param {File} file - Le fichier à uploader
 * @returns {Promise<{filepath: string}>}
 */
export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('filepath', file)
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.uploadFile}`
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Ne pas ajouter Content-Type, le navigateur le fera automatiquement avec boundary
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
  
  return await response.json()
}

/**
 * Importer des vœux depuis un fichier déjà uploadé
 * @param {string} filepath - Chemin du fichier uploadé
 * @param {number} id_session - ID de la session
 * @returns {Promise<{success: boolean, inserted: number, errors: array}>}
 */
export const importVoeux = async (filepath, id_session) => {
  return await apiRequest(API_CONFIG.endpoints.importVoeux, {
    method: 'POST',
    body: JSON.stringify({ filepath, id_session })
  })
}

// ==================== CRÉNEAUX ====================

export const fetchCreneaux = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.id_session) {
    params.append('id_session', filters.id_session)
  }
  if (filters.dateExam) {
    params.append('dateExam', filters.dateExam)
  }
  
  const queryString = params.toString()
  const endpoint = queryString ? `${API_CONFIG.endpoints.creneaux}?${queryString}` : API_CONFIG.endpoints.creneaux
  return await apiRequest(endpoint)
}

export const fetchCreneau = async (creneau_id) => {
  return await apiRequest(API_CONFIG.endpoints.creneau(creneau_id))
}

export const createCreneau = async (creneauData) => {
  return await apiRequest(API_CONFIG.endpoints.creneaux, {
    method: 'POST',
    body: JSON.stringify(creneauData)
  })
}

export const updateCreneau = async (creneau_id, creneauData) => {
  return await apiRequest(API_CONFIG.endpoints.creneau(creneau_id), {
    method: 'PUT',
    body: JSON.stringify(creneauData)
  })
}

export const deleteCreneau = async (creneau_id) => {
  return await apiRequest(API_CONFIG.endpoints.creneau(creneau_id), {
    method: 'DELETE'
  })
}

export const createCreneauxBatch = async (creneauxList) => {
  return await apiRequest(API_CONFIG.endpoints.creneauxBatch, {
    method: 'POST',
    body: JSON.stringify({ creneaux: creneauxList })
  })
}

export const updateCreneauxBatch = async (creneauxList) => {
  return await apiRequest(API_CONFIG.endpoints.creneauxBatch, {
    method: 'PUT',
    body: JSON.stringify({ creneaux: creneauxList })
  })
}

export const deleteCreneauxBySession = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.creneauxSession(id_session), {
    method: 'DELETE'
  })
}

export const fetchCreneauxStats = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.creneauxStats(id_session))
}

export const deleteAllCreneaux = async () => {
  return await apiRequest(API_CONFIG.endpoints.deleteAllCreneaux, {
    method: 'DELETE'
  })
}

// ==================== OPTIMIZATION ====================

/**
 * Run optimization for a session
 * @param {number} sessionId - ID of the session
 * @param {object} options - Optimization options
 * @returns {Promise<object>} Optimization results
 */
export const runOptimization = async (sessionId, options = {}) => {
  const {
    save = true,
    clear = true,
    generate_files = true,
    generate_stats = true
  } = options

  const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.optimizeRun}`, {
    method: 'POST',
    headers: API_CONFIG.headers,
    body: JSON.stringify({
      session_id: sessionId,
      save,
      clear,
      generate_files,
      generate_stats
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Optimization failed: ${response.status}`)
  }

  return await response.json()
}

// Affectations
export const fetchAffectations = async (sessionId) => {
  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.affectations}?id_session=${sessionId}`,
    {
      method: 'GET',
      headers: API_CONFIG.headers
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch affectations: ${response.status}`)
  }

  return await response.json()
}

export const updateAffectation = async (affectationId, data) => {
  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.affectation(affectationId)}`,
    {
      method: 'PUT',
      headers: API_CONFIG.headers,
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to update affectation: ${response.status}`)
  }

  return await response.json()
}

// Permuter deux enseignants entre leurs créneaux
export const permuterAffectations = async (affectationId1, affectationId2) => {
  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.permuterAffectations}`,
    {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        affectation_id_1: affectationId1,
        affectation_id_2: affectationId2
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to swap affectations: ${response.status}`)
  }

  return await response.json()
}

// Supprimer toutes les affectations
export const deleteAllAffectations = async () => {
  return await apiRequest('/api/affectations/delete-all', {
    method: 'DELETE',
  })
}

// ==================== STATISTICS ====================

export const fetchSessionStatistics = async (id_session) => {
  return await apiRequest(API_CONFIG.endpoints.sessionStatistics(id_session))
}

export const fetchAllSessionsStatistics = async () => {
  return await apiRequest(API_CONFIG.endpoints.allSessionsStatistics)
}

export default {
  // Enseignants
  fetchEnseignants,
  fetchEnseignant,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
  deleteAllEnseignants,
  
  // Grades
  fetchGrades,
  fetchGradeQuotas,
  updateGradeQuota,
  
  // Sessions
  fetchSessions,
  fetchSession,
  createSession,
  updateSession,
  deleteSession,
  deleteAllSessions,
  checkSessionData,
  
  // Salles
  fetchSalles,
  
  // Planning
  fetchPlanning,
  
  // Voeux
  fetchVoeux,
  fetchVoeu,
  createVoeu,
  updateVoeu,
  deleteVoeu,
  deleteAllVoeux,
  
  // Upload / Import
  uploadAndImportFile,
  uploadFile,
  importVoeux,
  
  // Créneaux
  fetchCreneaux,
  fetchCreneau,
  createCreneau,
  updateCreneau,
  deleteCreneau,
  createCreneauxBatch,
  updateCreneauxBatch,
  deleteCreneauxBySession,
  fetchCreneauxStats,
  deleteAllCreneaux,
  
  // Optimization
  runOptimization,
  
  // Affectations
  fetchAffectations,
  updateAffectation,
  permuterAffectations,
  deleteAllAffectations,
  
  // Statistics
  fetchSessionStatistics,
  fetchAllSessionsStatistics,
}
