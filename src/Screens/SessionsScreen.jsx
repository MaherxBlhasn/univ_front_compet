import { useState } from 'react'
import { Plus, Search, Calendar, Edit, Trash2, Eye, Download, Filter } from 'lucide-react'
import Header from '@components/Layout/Header'
import Button from '@components/Common/Button'
import Card from '@components/Common/Card'
import SessionModal from '@components/Common/SessionModal'
import SessionDetailsModal from '@components/Common/SessionDetailsModal'
import { MOCK_SESSIONS } from '../data/mockData'
import { formatDate } from '../utils/formatters'
import { exportToCSV, showNotification } from '../utils/exports'

const SessionsScreen = () => {
  const [sessions, setSessions] = useState(MOCK_SESSIONS)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const getStatusBadge = (status) => {
    const styles = {
      'En cours': 'bg-green-100 text-green-700',
      'Terminée': 'bg-gray-100 text-gray-700',
      'Planifiée': 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  // Filtrer les sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Ajouter/modifier une session
  const handleSaveSession = (sessionData) => {
    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...sessionData, id: s.id } : s))
      showNotification('Succès', 'Session modifiée avec succès', 'success')
    } else {
      const newSession = { ...sessionData, id: sessions.length + 1, nbExamens: 0, nbSalles: 0 }
      setSessions([...sessions, newSession])
      showNotification('Succès', 'Session créée avec succès', 'success')
    }
    setEditingSession(null)
  }

  // Supprimer une session
  const handleDeleteSession = (sessionId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      setSessions(sessions.filter(s => s.id !== sessionId))
      showNotification('Succès', 'Session supprimée', 'success')
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <Header
        title="Sessions d'examens"
        subtitle={`${filteredSessions.length} session(s) affichée(s)`}
        actions={
          <>
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

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="Planifiée">Planifiée</option>
            <option value="Terminée">Terminée</option>
          </select>
          <Button variant="outline" icon={Filter}>
            <span className="hidden lg:inline">Plus de filtres</span>
            <span className="lg:hidden">Filtres</span>
          </Button>
        </div>
      </div>

      {/* Sessions Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-xl transition-all duration-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{session.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                      {session.status}
                    </span>
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
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">Début:</span>
                    <span className="text-gray-900 font-medium">{formatDate(session.dateDebut, 'short')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">Fin:</span>
                    <span className="text-gray-900 font-medium">{formatDate(session.dateFin, 'short')}</span>
                  </div>
                </div>

                {/* Niveaux */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Niveaux concernés:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.niveaux.map((niveau) => (
                      <span key={niveau} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {niveau}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{session.nbExamens}</p>
                    <p className="text-xs text-gray-500">Examens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{session.nbSalles}</p>
                    <p className="text-xs text-gray-500">Salles</p>
                  </div>
                </div>

                {/* Actions */}
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
            </Card>
          ))}
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
    </div>
  )
}

export default SessionsScreen
