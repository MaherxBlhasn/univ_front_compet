import { useState, useEffect } from 'react'
import { Calendar, Clock, Download, Plus, Edit2, Trash2, Users, MapPin, Trash, Upload, RefreshCw, Search } from 'lucide-react'
import Header from '@components/Layout/Header'
import Button from '@components/Common/Button'
import LoadingSpinner from '@components/Common/LoadingSpinner'
import CreneauModal from '@components/Common/CreneauModal'
import CSVImportModal from '@components/Common/CSVImportModal'
import Pagination from '@components/Common/Pagination'
import { exportToCSV, showNotification } from '../utils/exports'
import { notifyDataDeleted } from '../utils/events'
import { useSession } from '../contexts/SessionContext'
import {
  fetchCreneaux,
  createCreneau,
  updateCreneau,
  deleteCreneau,
  fetchCreneauxStats,
  deleteAllCreneaux,
  uploadAndImportFile
} from '../services/api'

const PlanningScreen = () => {
  const { currentSession } = useSession()
  const [creneaux, setCreneaux] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreneauModal, setShowCreneauModal] = useState(false)
  const [editingCreneau, setEditingCreneau] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [stats, setStats] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Charger les créneaux depuis l'API
  useEffect(() => {
    if (currentSession) {
      loadCreneaux()
      loadStats()
    }
  }, [currentSession])

  const loadCreneaux = async () => {
    setLoading(true)
    try {
      const filters = { id_session: currentSession?.id_session }
      const data = await fetchCreneaux(filters)
      console.log('📊 Créneaux reçus:', data)
      console.log('📅 Premier créneau dateExam:', data[0]?.dateExam, 'Type:', typeof data[0]?.dateExam)
      setCreneaux(data)
      showNotification('Succès', `${data.length} créneaux chargés`, 'success')
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error)
      showNotification('Erreur', 'Impossible de charger les créneaux', 'error')
      setCreneaux([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!currentSession) return
    try {
      const data = await fetchCreneauxStats(currentSession.id_session)
      setStats(data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const handleSaveCreneau = async (creneauData) => {
    try {
      // Normaliser les heures pour ajouter :00 si nécessaire (HH:MM → HH:MM:00)
      const normalizeTimeForDB = (time) => {
        if (!time) return time
        // Si l'heure n'a pas de secondes, ajouter :00
        if (time.length === 5) {
          return `${time}:00`
        }
        return time
      }

      // Ajouter l'id de la session courante si ce n'est pas déjà fait
      const dataToSave = {
        ...creneauData,
        id_session: currentSession?.id_session,
        h_debut: normalizeTimeForDB(creneauData.h_debut),
        h_fin: normalizeTimeForDB(creneauData.h_fin)
      }

      if (editingCreneau && editingCreneau.creneau_id) {
        await updateCreneau(editingCreneau.creneau_id, dataToSave)
        showNotification('Succès', 'Créneau mis à jour', 'success')
      } else {
        await createCreneau(dataToSave)
        showNotification('Succès', 'Créneau créé', 'success')
      }
      loadCreneaux()
      loadStats()
      setShowCreneauModal(false)
      setEditingCreneau(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      showNotification('Erreur', 'Impossible de sauvegarder le créneau', 'error')
    }
  }

  const handleDeleteCreneau = (creneau) => {
    setDeleteConfirm(creneau)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteCreneau(deleteConfirm.creneau_id)
      showNotification('Succès', 'Créneau supprimé', 'success')
      loadCreneaux()
      loadStats()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showNotification('Erreur', 'Impossible de supprimer le créneau', 'error')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleDeleteAll = () => {
    setDeleteAllConfirm(true)
  }

  const confirmDeleteAll = async () => {
    try {
      await deleteAllCreneaux()
      setCreneaux([])
      setStats(null)
      showNotification('Succès', 'Tous les créneaux ont été supprimés', 'success')
      // Notifier que les données ont été supprimées pour mettre à jour le statut d'affectation
      notifyDataDeleted()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showNotification('Erreur', 'Impossible de supprimer tous les créneaux', 'error')
    } finally {
      setDeleteAllConfirm(false)
    }
  }

  const cancelDeleteAll = () => {
    setDeleteAllConfirm(false)
  }

  const handleEditCreneau = (creneau) => {
    setEditingCreneau(creneau)
    setShowCreneauModal(true)
  }

  const handleImportCSV = async (file) => {
    if (!currentSession?.id_session) {
      showNotification('Erreur', 'Aucune session sélectionnée', 'error')
      return
    }

    try {
      setLoading(true)

      // Ajouter la colonne 'session' au fichier avant l'upload
      const fileWithSession = await addSessionColumnToFile(file, currentSession.id_session)

      const result = await uploadAndImportFile(fileWithSession, 'creneaux', currentSession.id_session)

      if (result.success && result.import) {
        const importData = result.import
        const message = importData.inserted > 0
          ? `${importData.inserted} créneaux importés avec succès`
          : 'Aucun créneau importé'

        showNotification('Succès', message, 'success')

        if (importData.errors && importData.errors.length > 0) {
          console.warn('Erreurs d\'import:', importData.errors)
          showNotification('Attention', `${importData.errors.length} lignes avec erreurs`, 'warning')
        }

        await loadCreneaux()
        await loadStats()
        setShowImportModal(false)

        // Notifier le changement pour mettre à jour le statut d'affectation
        notifyDataDeleted()
      } else {
        showNotification('Erreur', result.error || 'Erreur lors de l\'import', 'error')
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      showNotification('Erreur', `Impossible d'importer: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour ajouter la colonne 'session' à chaque ligne du fichier
  const addSessionColumnToFile = (file, sessionId) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

      if (isExcel) {
        // Pour Excel
        import('xlsx').then(XLSX => {
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result)
              const workbook = XLSX.read(data, { type: 'array' })
              const firstSheetName = workbook.SheetNames[0]
              const worksheet = workbook.Sheets[firstSheetName]
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

              if (jsonData.length < 2) {
                reject(new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données'))
                return
              }

              // Ajouter 'session' à l'en-tête
              const headers = jsonData[0]
              headers.push('session')

              // Ajouter sessionId à chaque ligne de données
              for (let i = 1; i < jsonData.length; i++) {
                jsonData[i].push(sessionId)
              }

              // Créer un nouveau workbook
              const newWorksheet = XLSX.utils.aoa_to_sheet(jsonData)
              const newWorkbook = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1')

              // Convertir en fichier
              const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' })
              const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
              const newFile = new File([blob], file.name, { type: file.type })

              resolve(newFile)
            } catch (error) {
              reject(error)
            }
          }
          reader.readAsArrayBuffer(file)
        }).catch(reject)
      } else {
        // Pour CSV
        reader.onload = (e) => {
          try {
            const text = e.target.result
            const lines = text.split('\n').filter(line => line.trim())

            if (lines.length < 2) {
              reject(new Error('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données'))
              return
            }

            // Détecter le délimiteur
            const delimiter = lines[0].includes(';') ? ';' : ','

            // Ajouter 'session' à l'en-tête
            lines[0] = lines[0] + delimiter + 'session'

            // Ajouter sessionId à chaque ligne de données
            for (let i = 1; i < lines.length; i++) {
              lines[i] = lines[i] + delimiter + sessionId
            }

            // Créer le nouveau fichier
            const newText = lines.join('\n')
            const blob = new Blob([newText], { type: 'text/csv' })
            const newFile = new File([blob], file.name, { type: file.type })

            resolve(newFile)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsText(file)
      }
    })
  }

  // Normaliser une date pour le tri et le groupement
  const normalizeDate = (dateStr) => {
    if (!dateStr) return ''

    // Format DD/MM/YYYY -> YYYY-MM-DD
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    return dateStr
  }

  // Grouper les créneaux par date (NORMALISER pour éviter les doublons)
  const groupByDate = (items) => {
    return items.reduce((acc, item) => {
      const date = normalizeDate(item.dateExam) // ← NORMALISER ICI pour grouper correctement
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    }, {})
  }

  // Filtrer les créneaux
  const filteredCreneaux = creneaux.filter(creneau => {
    // Filtre par date
    if (filterDate) {
      const creneauDate = normalizeDate(creneau.dateExam)
      const filterDateNormalized = normalizeDate(filterDate)
      if (creneauDate !== filterDateNormalized) return false
    }

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        creneau.codeModule?.toLowerCase().includes(search) ||
        creneau.libelleModule?.toLowerCase().includes(search) ||
        creneau.dateExam?.toLowerCase().includes(search) ||
        creneau.heureDebut?.toLowerCase().includes(search) ||
        creneau.heureFin?.toLowerCase().includes(search) ||
        creneau.nom_ens?.toLowerCase().includes(search) ||
        creneau.prenom_ens?.toLowerCase().includes(search) ||
        `${creneau.prenom_ens} ${creneau.nom_ens}`.toLowerCase().includes(search) ||
        creneau.cod_salle?.toLowerCase().includes(search)
      )
    }

    return true
  })

  const groupedCreneaux = groupByDate(filteredCreneaux)
  const dates = Object.keys(groupedCreneaux).sort()

  // Pagination calculations
  const totalItems = filteredCreneaux.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCreneaux = filteredCreneaux.slice(startIndex, endIndex)
  const paginatedGroupedCreneaux = groupByDate(paginatedCreneaux)
  const paginatedDates = Object.keys(paginatedGroupedCreneaux).sort()

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterDate, searchTerm])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Obtenir toutes les dates uniques des créneaux (pour le filtre)
  // Normaliser TOUTES les dates pour éviter les doublons (DD/MM/YYYY vs YYYY-MM-DD)
  const allDates = [...new Set(creneaux.map(c => normalizeDate(c.dateExam)).filter(Boolean))].sort()

  console.log('🔍 DEBUG - Dates brutes:', creneaux.map(c => c.dateExam))
  console.log('🔍 DEBUG - Dates normalisées:', allDates)

  // Formater une date en format lisible (supporte plusieurs formats d'entrée)
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date invalide'

    let date

    // Si c'est déjà un objet Date
    if (dateStr instanceof Date) {
      date = dateStr
    }
    // Format DD/MM/YYYY
    else if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      date = new Date(year, month - 1, day)
    }
    // Format YYYY-MM-DD
    else if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-')
      date = new Date(year, month - 1, day)
    }
    // Timestamp ou autre
    else {
      date = new Date(dateStr)
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return `Date invalide (${dateStr})`
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Formater une heure pour supprimer les secondes (HH:MM:SS → HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    // Si l'heure contient des secondes (08:30:00), on garde seulement HH:MM
    if (timeStr.length > 5) {
      return timeStr.substring(0, 5)
    }
    return timeStr
  }

  // Export CSV
  const handleExportCSV = () => {
    exportToCSV(filteredCreneaux, 'creneaux_examens')
    showNotification('Succès', 'Export CSV réussi', 'success')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <Header
        title="Planning des Créneaux d'Examens"
        subtitle={currentSession ? `${currentSession.libelle_session} - ${filteredCreneaux.length} créneau(x)` : "Gérez les créneaux d'examens"}
        actions={
          <>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => {
                loadCreneaux()
                loadStats()
              }}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => setShowImportModal(true)}
            >
              Importer
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportCSV}
              disabled={creneaux.length === 0}
            >
              Exporter
            </Button>
            {creneaux.length > 0 && (
              <Button
                variant="danger"
                icon={Trash}
                onClick={handleDeleteAll}
              >
                Supprimer tout
              </Button>
            )}
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingCreneau(null)
                setShowCreneauModal(true)
              }}
            >
              Ajouter créneau
            </Button>
          </>
        }
      />

      {/* Statistiques */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Créneaux</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_creneaux || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Jours d'examen</p>
              <p className="text-2xl font-bold text-green-900">{stats.nb_jours || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Affectations</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total_affectations || 0}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Moy. par jour</p>
              <p className="text-2xl font-bold text-orange-900">
                {stats.nb_jours > 0 ? (stats.total_creneaux / stats.nb_jours).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par responsable, code, salle,  date ou heure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="space-y-3">
          {/* Quick Date Filters - Boutons pour dates disponibles */}
          {allDates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  <Calendar size={16} className="inline mr-2" />
                  Accès rapide aux dates
                  <span className="ml-2 text-gray-500 font-normal">
                    ({allDates.length} date(s) disponible(s))
                  </span>
                </label>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allDates.map((date) => {
                  const dateObj = date.includes('/')
                    ? new Date(date.split('/').reverse().join('-'))
                    : new Date(date)
                  const displayDate = dateObj.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                  const creneauxCount = creneaux.filter(c => normalizeDate(c.dateExam) === date).length
                  const isActive = filterDate === date

                  return (
                    <button
                      key={date}
                      onClick={() => setFilterDate(date)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border-2 ${isActive
                        ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                      {displayDate} <span className="font-bold">({creneauxCount})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {allDates.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune date disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Liste des créneaux */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Pagination */}
        {filteredCreneaux.length > 0 && (
          <div className="mb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={true}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}

        {filteredCreneaux.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Calendar size={64} className="text-gray-300 mb-4" />
            <p className="text-gray-700 text-xl font-semibold mb-2">Aucun créneau</p>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
              Commencez par créer des créneaux d'examens pour cette session
            </p>
            <Button variant="primary" icon={Plus} onClick={() => {
              setEditingCreneau(null)
              setShowCreneauModal(true)
            }}>
              Créer un créneau
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedDates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* En-tête de date */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <Calendar size={24} />
                      <div>
                        <p className="text-2xl font-bold">
                          {formatDate(date)}
                        </p>
                        <p className="text-sm text-blue-100">
                          {paginatedGroupedCreneaux[date].length} créneau(x)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des créneaux pour cette date */}
                <div className="p-4 space-y-3">
                  {paginatedGroupedCreneaux[date]
                    .sort((a, b) => a.h_debut.localeCompare(b.h_debut))
                    .map((creneau) => (
                      <div
                        key={creneau.creneau_id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              {/* Horaire */}
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock size={16} />
                                <span className="font-semibold">
                                  {formatTime(creneau.h_debut)} - {formatTime(creneau.h_fin)}
                                </span>
                              </div>

                              {/* Session Details */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">{currentSession?.libelle_session || 'Session'}</span>
                                {(creneau.semestre || currentSession?.Semestre) && (
                                  <>
                                    <span>-</span>
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                      {creneau.semestre || currentSession.Semestre}
                                    </span>
                                  </>
                                )}
                                {currentSession?.type_session && (
                                  <>
                                    <span>,</span>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                      {currentSession.type_session}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              {/* Enseignant responsable */}
                              {creneau.enseignant && (
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-blue-500" />
                                  <span className="text-gray-600">
                                    <strong>Resp.:</strong>
                                  </span>
                                  <span className="px-2 py-1 bg-red-50 rounded text-red-600 font-medium">
                                    {creneau.prenom_ens} {creneau.nom_ens}
                                  </span>
                                </div>
                              )}

                              {/* Salle */}
                              {creneau.cod_salle && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin size={14} className="text-green-500" />
                                  <span>
                                    <strong>Salle:</strong> {creneau.cod_salle}
                                  </span>
                                </div>
                              )}

                              {/* ID Créneau */}
                              <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-xs font-mono">
                                  ID: {creneau.creneau_id}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditCreneau(creneau)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCreneau(creneau)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Créneau */}
      <CreneauModal
        isOpen={showCreneauModal}
        onClose={() => {
          setShowCreneauModal(false)
          setEditingCreneau(null)
        }}
        onSave={handleSaveCreneau}
        creneau={editingCreneau}
        availableDates={allDates}
        existingCreneaux={creneaux}
      />

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-2">
                Voulez-vous vraiment supprimer ce créneau ?
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {formatDate(deleteConfirm.dateExam)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Horaire:</strong> {formatTime(deleteConfirm.h_debut)} - {formatTime(deleteConfirm.h_fin)}
                </p>
                {deleteConfirm.semestre && (
                  <p className="text-sm text-gray-600">
                    <strong>Semestre:</strong> {deleteConfirm.semestre}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <Button variant="danger" icon={Trash2} onClick={confirmDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de tous les créneaux */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Supprimer tous les créneaux</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ⚠️ Êtes-vous absolument sûr de vouloir supprimer <strong>TOUS les créneaux</strong> ({creneaux.length}) ?
              Cette action est <strong>irréversible</strong> et supprimera toutes les données associées.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={cancelDeleteAll}>
                Annuler
              </Button>
              <Button variant="danger" icon={Trash} onClick={confirmDeleteAll}>
                Supprimer tout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import CSV/Excel */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
        title="Importer des créneaux"
        description="Le champ 'session' sera automatiquement ajouté depuis la session courante"
        expectedFields={['dateExam', 'h_debut', 'h_fin', 'type_ex', 'semestre', 'enseignant', 'cod_salle']}
        templateExample={`dateExam,h_debut,h_fin,type_ex,semestre,enseignant,cod_salle
13/05/2025,08:30:00,10:00:00,E,SEMESTRE 2,A102,B203
13/05/2025,10:30:00,12:00:00,E,SEMESTRE 2,A124,B203
13/05/2025,14:30:00,16:00:00,E,SEMESTRE 2,A405,A208`}
      />
    </div>
  )
}

export default PlanningScreen
