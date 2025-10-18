// Configuration de l'API Flask
// Utilise la variable d'environnement ou localhost par défaut
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
  endpoints: {
    // Enseignants
    enseignants: '/api/enseignants',
    enseignant: (code) => `/api/enseignants/${code}`,
    deleteAllEnseignants: '/api/enseignants/all',
    
    // Grades
    grades: '/api/grades',
    gradeQuotas: '/api/grades/quotas',
    updateGradeQuota: (code) => `/api/grades/${code}`,
    
    // Sessions
    sessions: '/api/sessions',
    session: (id) => `/api/sessions/${id}`,
    deleteAllSessions: '/api/sessions/all',
    checkSessionData: (id) => `/api/sessions/${id}/check-data`,
    
    // Salles
    salles: '/api/salles',
    
    // Planning
    planning: '/api/planning',
    
    // Voeux
    voeux: '/api/voeux',
    voeu: (id) => `/api/voeux/${id}`,
    deleteAllVoeux: '/api/voeux/all',
    
    // Upload / Import (New unified endpoint)
    uploadAndImport: '/api/upload/upload',
    uploadFile: '/api/upload',
    importVoeux: '/api/upload/import/voeux',
    
    // Créneaux
    creneaux: '/api/creneaux',
    creneau: (id) => `/api/creneaux/${id}`,
    creneauxBatch: '/api/creneaux/batch',
    creneauxSession: (id) => `/api/creneaux/session/${id}`,
    creneauxStats: (id) => `/api/creneaux/session/${id}/statistiques`,
    deleteAllCreneaux: '/api/creneaux/all',
    
    // Optimization
    optimizeRun: '/api/optimize/run',
    
    // Affectations
    affectations: '/api/affectations',
    affectation: (id) => `/api/affectations/${id}`,
    permuterAffectations: '/api/affectations/permuter',
    
    // Statistics
    sessionStatistics: (id) => `/api/statistics/session/${id}`,
    allSessionsStatistics: '/api/statistics/sessions',
    
    // Storage Management
    storage: '/api/storage/',
    deleteAllFiles: '/api/storage/delete-all',
    deleteSessionFiles: (id) => `/api/storage/delete/session/${id}`,
    cleanupEmptyFolders: '/api/storage/cleanup/empty',
    
    // Quota Enseignants
    quotaEnseignants: '/api/quota-enseignants',
    quotaEnseignant: (code) => `/api/quota-enseignants/enseignant/${code}`,
    deleteAllQuotas: '/api/quota-enseignants/all',
    deleteQuotasBySession: (id) => `/api/quota-enseignants/session/${id}`,
    resetQuotasBySession: (id) => `/api/quota-enseignants/reset/session/${id}`,
    resetAllQuotas: '/api/quota-enseignants/reset/all',
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export default API_CONFIG
