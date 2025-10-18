import { useState } from 'react'
import { Plus, Search, MapPin, Edit, Trash2, CheckCircle, XCircle, Monitor, Users, RefreshCw } from 'lucide-react'
import Header from '@components/Layout/Header'
import Button from '@components/Common/Button'
import Card from '@components/Common/Card'
import RoomModal from '@components/Common/RoomModal'
import { MOCK_ROOMS } from '../data/mockData'
import { showNotification } from '../utils/exports';

const RoomsScreen = () => {
  const [rooms, setRooms] = useState(MOCK_ROOMS)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const getTypeColor = (type) => {
    const colors = {
      'Amphi': 'bg-blue-100 text-blue-700',
      'Salle TP': 'bg-green-100 text-green-700',
      'Salle TD': 'bg-purple-100 text-purple-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.nom.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'available') return room.disponible && matchesSearch
    if (filter === 'unavailable') return !room.disponible && matchesSearch
    return matchesSearch
  })

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.disponible).length,
    unavailable: rooms.filter(r => !r.disponible).length
  }

  // Ajouter/modifier une salle
  const handleSaveRoom = (roomData) => {
    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...roomData, id: r.id } : r))
      showNotification('Succès', 'Salle modifiée avec succès', 'success')
    } else {
      const newRoom = { ...roomData, id: rooms.length + 1 }
      setRooms([...rooms, newRoom])
      showNotification('Succès', 'Salle ajoutée avec succès', 'success')
    }
    setEditingRoom(null)
  }

  // Supprimer une salle
  const handleDeleteRoom = (roomId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
      setRooms(rooms.filter(r => r.id !== roomId))
      showNotification('Succès', 'Salle supprimée', 'success')
    }
  }

  // Éditer une salle
  const handleEditRoom = (room) => {
    setEditingRoom(room)
    setShowModal(true)
  }

  // Voir le plan (exemple)
  const handleViewPlan = () => {
    showNotification('Info', 'Plan des salles - Fonctionnalité à venir', 'info')
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <Header
        title="Salles d'examen"
        subtitle={`${stats.total} salles enregistrées`}
        actions={
          <>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => window.location.reload()}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              icon={MapPin}
              className="hidden sm:inline-flex"
              onClick={handleViewPlan}
            >
              Voir plan
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingRoom(null)
                setShowModal(true)
              }}
            >
              Ajouter salle
            </Button>
          </>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border-2 transition-all ${filter === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`p-4 rounded-lg border-2 transition-all ${filter === 'available'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-sm text-gray-600">Disponibles</p>
            </div>
          </button>
          <button
            onClick={() => setFilter('unavailable')}
            className={`p-4 rounded-lg border-2 transition-all ${filter === 'unavailable'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
              <p className="text-sm text-gray-600">Occupées</p>
            </div>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une salle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option>Tous les types</option>
            <option>Amphi</option>
            <option>Salle TP</option>
            <option>Salle TD</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-xl transition-all duration-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <MapPin className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{room.nom}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(room.type)}`}>
                        {room.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Users size={20} className="text-gray-600" />
                      <span className="text-3xl font-bold text-gray-900">{room.capacite}</span>
                    </div>
                    <p className="text-sm text-gray-600">Places</p>
                  </div>
                </div>

                {/* Equipements */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Équipements:</p>
                  <div className="flex flex-wrap gap-2">
                    {room.equipements.map((equip, idx) => (
                      <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        <Monitor size={12} />
                        {equip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${room.disponible
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                  }`}>
                  {room.disponible ? (
                    <>
                      <CheckCircle size={18} />
                      <span className="font-medium text-sm">Disponible</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      <span className="font-medium text-sm">Occupée</span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MapPin size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune salle trouvée</h3>
            <p className="text-gray-500 mb-6">Essayez de modifier vos filtres</p>
          </div>
        )}
      </main>

      {/* Modal */}
      <RoomModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingRoom(null)
        }}
        onSave={handleSaveRoom}
        room={editingRoom}
      />
    </div>
  )
}

export default RoomsScreen
