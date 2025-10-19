import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Edit, Trash2, Eye, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import Header from '@components/Layout/Header';
import Button from '@components/Common/Button';
import Card from '@components/Common/Card';
import Modal from '@components/Common/Modal';
import SessionModal from '@components/Common/SessionModal';
import SessionDetailsModal from '@components/Common/SessionDetailsModal';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import Pagination from '@components/Common/Pagination';
import { formatDate } from '../utils/formatters';
import { exportToCSV, showNotification } from '../utils/exports';
import { fetchSessions, createSession, updateSession, deleteSession } from '../services/api';

const SessionsScreen = () => {
  const navigate = useNavigate();
  const { refreshSessions } = useSession();
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Load sessions from backend
  useEffect(() => {
    loadSessions()
  }, [])

  // Get unique session types from backend data
  const sessionTypes = [...new Set(sessions
    .map(s => s.type_session)
    .filter(type => type && type.trim() !== '')
  )]
  const hasTypes = sessionTypes.length > 0

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await fetchSessions()
      setSessions(data)
      console.log('✅ Sessions chargées:', data.length)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des sessions:', error)
      showNotification('Erreur', 'Impossible de charger les sessions', 'error')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  // Determine session status based on dates
  const getSessionStatus = (session) => {
    if (!session.date_debut || !session.date_fin) return 'Planifiée'

    const now = new Date()
    const debut = new Date(session.date_debut)
    const fin = new Date(session.date_fin)

    if (now < debut) return 'Planifiée'
    if (now > fin) return 'Terminée'
    return 'En cours'
  }

  const getStatusBadge = (status) => {
    const styles = {
      'En cours': 'bg-green-100 text-green-700',
      'Terminée': 'bg-gray-100 text-gray-700',
      'Planifiée': 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.libelle_session?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !hasTypes || typeFilter === 'all' || session.type_session === typeFilter
    return matchesSearch && matchesType
  })

  // Pagination calculations
  const totalItems = filteredSessions.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Add/Update session
  const handleSaveSession = async (sessionData) => {
    try {
      if (editingSession) {
        // Update existing session
        await updateSession(editingSession.id_session, sessionData)
        showNotification('Succès', 'Session modifiée avec succès', 'success')
      } else {
        // Create new session
        await createSession(sessionData)
        showNotification('Succès', 'Session créée avec succès', 'success')
      }
      setEditingSession(null)
      setShowModal(false)
      await loadSessions() // Reload sessions
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      showNotification('Erreur', error.message || 'Impossible de sauvegarder la session', 'error')
    }
  }

  // Delete session with confirmation
  const handleDeleteSession = (session) => {
    setDeleteConfirm(session)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteSession(deleteConfirm.id_session)
      showNotification('Succès', 'Session supprimée avec succès', 'success')
      setDeleteConfirm(null)
      await loadSessions() // Reload local sessions list

      // Rafraîchir les sessions dans le contexte et vérifier si la session courante existe encore
      const currentSessionWasDeleted = await refreshSessions()

      // Si la session courante a été supprimée, rediriger vers /sessions
      if (currentSessionWasDeleted) {
        showNotification(
          'Session supprimée',
          'La session active a été supprimée. Veuillez sélectionner une autre session.',
          'warning'
        )
        navigate('/sessions')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showNotification('Erreur', error.message || 'Impossible de supprimer la session', 'error')
    }
  }

  // Éditer une session
  const handleEditSession = (session) => {
    setEditingSession(session)
    setShowModal(true)
  }

  // Voir les détails
  const handleViewDetails = (session) => {
    setSelectedSession(session)
    setShowDetailsModal(true)
  }

  // Exporter
  const handleExport = () => {
    exportToCSV(sessions, 'sessions_examens')
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
        title="Sessions d'examens"
        subtitle={`${filteredSessions.length} session(s) affichée(s)`}
        actions={
          <>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={loadSessions}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              icon={Download}
              className="hidden sm:inline-flex"
              onClick={handleExport}
            >
              Exporter
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingSession(null)
                setShowModal(true)
              }}
            >
              Nouvelle session
            </Button>
          </>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une session par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Conditional Type Filter - Only show if sessions have types */}
          {hasTypes && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">Tous les types</option>
              {sessionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Sessions Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* Pagination */}
        {filteredSessions.length > 0 && (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {paginatedSessions.map((session) => {
            const hasAllData = session.AU && session.Semestre && session.type_session

            return (
              <Card key={session.id_session} className="hover:shadow-xl transition-all duration-200 flex flex-col">
                <div className="flex flex-col h-full space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{session.libelle_session}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="space-y-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-blue-500" />
                      <span className="text-gray-600 min-w-[50px]">Début:</span>
                      <span className="text-gray-900 font-medium">
                        {session.date_debut ? formatDate(session.date_debut, 'short') : 'Non défini'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-purple-500" />
                      <span className="text-gray-600 min-w-[50px]">Fin:</span>
                      <span className="text-gray-900 font-medium">
                        {session.date_fin ? formatDate(session.date_fin, 'short') : 'Non défini'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info with inline edit button */}
                  <div className="flex gap-3 flex-grow">
                    {/* Info Section */}
                    <div className="space-y-2 flex-1">
                      <div className="text-sm flex items-start">
                        <span className="text-gray-600 min-w-[145px] flex-shrink-0">Année universitaire:</span>
                        <span className={session.AU ? "text-gray-900 font-medium" : "text-gray-400 italic text-xs"}>
                          {session.AU || 'Non défini'}
                        </span>
                      </div>
                      <div className="text-sm flex items-start">
                        <span className="text-gray-600 min-w-[145px] flex-shrink-0">Semestre:</span>
                        <span className={session.Semestre ? "text-gray-900 font-medium" : "text-gray-400 italic text-xs"}>
                          {session.Semestre || 'Non défini'}
                        </span>
                      </div>
                      <div className="text-sm flex items-start">
                        <span className="text-gray-600 min-w-[145px] flex-shrink-0">Type:</span>
                        <span className={session.type_session ? "text-gray-900 font-medium" : "text-gray-400 italic text-xs"}>
                          {session.type_session || 'Non défini'}
                        </span>
                      </div>
                    </div>

                    {/* Compact edit button on the right if data is missing */}
                    {!hasAllData && (
                      <div className="flex items-center">
                        <button
                          onClick={() => handleEditSession(session)}
                          className="flex flex-col items-center justify-center gap-1 p-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-300 rounded-lg cursor-pointer transition-all group h-fit"
                          title="Cliquez pour compléter les informations"
                        >
                          <Edit size={18} className="text-blue-600 group-hover:text-blue-700" />
                          <span className="text-[10px] text-blue-700 group-hover:text-blue-800 font-semibold text-center leading-tight">
                            Compléter
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Always at bottom */}
                  <div className="pt-3 border-t border-gray-100 mt-auto">
                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      className="w-full"
                      onClick={() => handleViewDetails(session)}
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Calendar size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h3>
            <p className="text-gray-500 mb-6">Créez votre première session d'examens</p>
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Nouvelle session
            </Button>
          </div>
        )}
      </main>

      {/* Modal */}
      <SessionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingSession(null)
        }}
        onSave={handleSaveSession}
        session={editingSession}
      />

      <SessionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedSession(null)
        }}
        session={selectedSession}
        onEdit={() => {
          setShowDetailsModal(false)
          setEditingSession(selectedSession)
          setShowModal(true)
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title="Confirmer la suppression"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer la session{' '}
              <span className="font-semibold text-gray-900">
                "{deleteConfirm.libelle_session}"
              </span>
              {' '}? Tous les données relatives à cette session seront <span className="font-semibold text-red-600">supprimées.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SessionsScreen
