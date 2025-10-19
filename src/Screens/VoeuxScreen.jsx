import { useState, useEffect } from 'react';
import {
    Plus,
    Upload,
    Download,
    Heart,
    Search,
    Edit2,
    Trash2,
    Calendar, Trash,
    RefreshCw
} from 'lucide-react';
import Header from '@components/Layout/Header';
import Button from '@components/Common/Button';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import VoeuxModal from '@components/Common/VoeuxModal';
import CSVImportModal from '@components/Common/CSVImportModal';
import Pagination from '@components/Common/Pagination';
import { showNotification, exportToCSV } from '../utils/exports';
import { notifyDataDeleted } from '../utils/events';
import { fetchVoeux, createVoeu, updateVoeu, deleteVoeu, uploadAndImportFile, deleteAllVoeux } from '../services/api';
import { useSession } from '../contexts/SessionContext';

// Mapping pour les jours
const JOURS = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
}

// Mapping pour les séances
const SEANCES = {
    S1: { label: '08:30-10:00', },
    S2: { label: '10:30-12:00', },
    S3: { label: '12:30-14:00', },
    S4: { label: '14:30-16:00', }
}



const VoeuxScreen = () => {
    const { currentSession } = useSession() // Get current exam session from context
    const [voeux, setVoeux] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showVoeuModal, setShowVoeuModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [editingVoeu, setEditingVoeu] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

    // Charger les vœux depuis l'API when session changes
    useEffect(() => {
        if (currentSession) {
            loadVoeux()
        }
    }, [currentSession])

    const loadVoeux = async () => {
        setLoading(true)
        try {
            const data = await fetchVoeux()
            console.log('📊 Vœux reçus:', data)
            console.log('📊 Type de data:', typeof data, 'Is Array?', Array.isArray(data))
            console.log('📊 Longueur:', data?.length)
            setVoeux(data)
            showNotification('Succès', `${data.length} vœux chargés`, 'success')
        } catch (error) {
            console.error('Erreur lors du chargement des vœux:', error)
            showNotification('Erreur', 'Impossible de charger les vœux', 'error')
            setVoeux([]) // Mettre un tableau vide en cas d'erreur
        } finally {
            setLoading(false)
        }
    }

    const handleSaveVoeu = async (voeuData) => {
        try {
            // Préparer les données pour l'API (seulement les champs requis par le backend)
            const dataForAPI = {
                code_smartex_ens: parseInt(voeuData.code_smartex_ens),
                id_session: parseInt(voeuData.id_session),
                jour: parseInt(voeuData.jour),
                seance: voeuData.seance
            }

            if (editingVoeu && editingVoeu.voeu_id) {
                // Mettre à jour un vœu existant
                await updateVoeu(editingVoeu.voeu_id, dataForAPI)
                showNotification('Succès', 'Vœu mis à jour', 'success')
            } else {
                // Créer un nouveau vœu
                await createVoeu(dataForAPI)
                showNotification('Succès', 'Vœu ajouté', 'success')
            }
            // Recharger les vœux
            loadVoeux()
            setEditingVoeu(null)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
            // Afficher un message d'erreur plus détaillé si disponible
            const errorMessage = error.message || 'Impossible de sauvegarder le vœu'
            showNotification('Erreur', errorMessage, 'error')
        }
    }

    const handleDeleteVoeu = (voeu) => {
        setDeleteConfirm(voeu)
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return

        try {
            await deleteVoeu(deleteConfirm.voeu_id)
            showNotification('Succès', 'Vœu supprimé', 'success')
            // Recharger les vœux
            loadVoeux()
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            showNotification('Erreur', 'Impossible de supprimer le vœu', 'error')
        } finally {
            setDeleteConfirm(null)
        }
    }

    const handleDeleteAll = () => {
        setDeleteAllConfirm(true)
    }

    const confirmDeleteAll = async () => {
        try {
            await deleteAllVoeux()
            setVoeux([])
            showNotification('Succès', 'Tous les vœux ont été supprimés', 'success')
            // Notifier que les données ont été supprimées pour mettre à jour le statut d'affectation
            notifyDataDeleted()
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            showNotification('Erreur', 'Impossible de supprimer tous les vœux', 'error')
        } finally {
            setDeleteAllConfirm(false)
        }
    }

    const cancelDeleteAll = () => {
        setDeleteAllConfirm(false)
    }

    const handleEditVoeu = (voeu) => {
        setEditingVoeu(voeu)
        setShowVoeuModal(true)
    }

    const handleImportCSV = async (file) => {
        try {
            setLoading(true)

            // Utiliser la nouvelle API unifiée qui supporte CSV et XLSX
            console.log('📤 Upload et import du fichier:', file.name)
            const result = await uploadAndImportFile(file, 'voeux', currentSession?.id_session)
            console.log('✅ Upload et import terminés:', result)

            // Afficher le résultat
            if (result.success && result.import) {
                const importData = result.import
                showNotification(
                    'Succès',
                    `${importData.inserted || 0} vœux importés${importData.errors && importData.errors.length > 0 ? ` (${importData.errors.length} erreurs)` : ''}`,
                    'success'
                )

                // Recharger les vœux
                await loadVoeux()

                // Notifier le changement pour mettre à jour le statut d'affectation
                notifyDataDeleted()
            } else {
                showNotification('Erreur', result.error || 'Erreur lors de l\'import', 'error')
            }
        } catch (error) {
            console.error('Erreur lors de l\'import:', error)
            showNotification('Erreur', `Impossible d'importer les vœux: ${error.message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        exportToCSV(filteredVoeux, 'voeux')
        showNotification('Succès', 'Export CSV réussi', 'success')
    }



    // Filtrage - Filter by current exam session and search term
    const filteredVoeux = voeux.filter(voeu => {
        console.log("zzzz", voeu.nom_ens);

        const matchSearch = searchTerm === '' ||
            voeu.nom_ens.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voeu.prenom_ens.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voeu.code_smartex_ens.toString().includes(searchTerm)

        // Filter by current exam session
        const matchSession = !currentSession ||
            voeu.id_session === currentSession.id_session

        return matchSearch && matchSession
    })

    // Grouper par enseignant
    const groupedByTeacher = filteredVoeux.reduce((acc, voeu) => {
        const key = voeu.code_smartex_ens
        if (!acc[key]) {
            acc[key] = {
                code: voeu.code_smartex_ens,
                nom: voeu.nom_ens,
                prenom: voeu.prenom_ens,
                voeux: []
            }
        }
        acc[key].voeux.push({
            voeu_id: voeu.voeu_id,  // ← IMPORTANT: Include voeu_id for deletion
            jour: voeu.jour,
            seance: voeu.seance
        })
        return acc
    }, {})

    const teachersWithVoeux = Object.values(groupedByTeacher)

    // Pagination calculations
    const totalItems = teachersWithVoeux.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedTeachers = teachersWithVoeux.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <LoadingSpinner />
            </div>
        )
    }

    const csvTemplate = "code_smartex_ens,nom_ens,prenom_ens,jour,seance\n57,Karoui,Wafa,6,S3"

    // Calculer les statistiques
    const stats = {
        totalVoeux: filteredVoeux.length,
        totalEnseignants: teachersWithVoeux.length,
        voeuxParEnseignant: teachersWithVoeux.length > 0
            ? (filteredVoeux.length / teachersWithVoeux.length).toFixed(1)
            : 0,
        jourLePlusPopulaire: filteredVoeux.length > 0
            ? Object.entries(
                filteredVoeux.reduce((acc, v) => {
                    acc[v.jour] = (acc[v.jour] || 0) + 1
                    return acc
                }, {})
            ).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
            : '-'
    }

    // Show loading spinner while fetching data
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <LoadingSpinner />
            </div>
        )
    }

    console.log('🔍 DEBUG - voeux state:', voeux)
    console.log('🔍 DEBUG - filteredVoeux:', filteredVoeux)
    console.log('🔍 DEBUG - teachersWithVoeux:', teachersWithVoeux)

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <Header
                title="Gestion des Vœux de Non-Surveillance"
                subtitle={`${filteredVoeux.length} vœu${filteredVoeux.length > 1 ? 'x' : ''} de disponibilité enregistré${filteredVoeux.length > 1 ? 's' : ''}`}
                actions={
                    <>
                        <Button
                            variant="outline"
                            icon={RefreshCw}
                            onClick={loadVoeux}
                        >
                            Actualiser
                        </Button>
                        <Button
                            variant="secondary"
                            icon={Upload}
                            onClick={() => setShowImportModal(true)}
                        >
                            Importer CSV
                        </Button>
                        <Button
                            variant="secondary"
                            icon={Download}
                            onClick={handleExport}
                            disabled={voeux.length === 0}
                        >
                            Exporter
                        </Button>
                        {voeux.length > 0 && (
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
                                setEditingVoeu(null)
                                setShowVoeuModal(true)
                            }}
                        >
                            Ajouter un vœu
                        </Button>
                    </>
                }
            />

            {/* Search bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            {teachersWithVoeux.length > 0 && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Vœux</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.totalVoeux}</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Enseignants</p>
                            <p className="text-2xl font-bold text-green-900">{stats.totalEnseignants}</p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Moyenne/Enseignant</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.voeuxParEnseignant}</p>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Jour Populaire</p>
                            <p className="text-2xl font-bold text-orange-900">{JOURS[stats.jourLePlusPopulaire] || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {/* Pagination */}
                {teachersWithVoeux.length > 0 && (
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

                {teachersWithVoeux.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Heart size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-700 text-xl font-semibold mb-2">Aucun vœu enregistré</p>
                        <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
                            Les vœux de non-surveillance permettent aux enseignants d'indiquer leurs créneaux de disponibilité préférés
                        </p>
                        <div className="flex gap-3">
                            <Button variant="primary" icon={Plus} onClick={() => {
                                setEditingVoeu(null)
                                setShowVoeuModal(true)
                            }}>
                                Ajouter un vœu
                            </Button>
                            <Button variant="secondary" icon={Upload} onClick={() => setShowImportModal(true)}>
                                Importer CSV
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedTeachers.map(teacher => (
                            <div
                                key={teacher.code}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Header de la carte */}
                                <div className="bg-white border-b border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {teacher.prenom} {teacher.nom}
                                            </h3>
                                            <p className="text-sm text-gray-500">Code: {teacher.code}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                                            <Heart size={14} className="text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                {teacher.voeux.length} vœu{teacher.voeux.length > 1 ? 'x' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Session Details */}
                                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                                        <span className="font-medium">{currentSession?.libelle_session || 'Session'}</span>
                                        {currentSession?.Semestre && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                                                Semestre: {currentSession.Semestre}
                                            </span>
                                        )}
                                        {currentSession?.type_session && (
                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">
                                                {currentSession.type_session}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Liste des vœux */}
                                <div className="p-4 space-y-2">
                                    {teacher.voeux.map((v, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <span className="text-sm text-gray-700">
                                                {JOURS[v.jour]} - {v.seance}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditVoeu({
                                                        voeu_id: v.voeu_id,
                                                        code_smartex_ens: teacher.code,
                                                        nom_ens: teacher.nom,
                                                        prenom_ens: teacher.prenom,
                                                        jour: v.jour,
                                                        seance: v.seance
                                                    })}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVoeu({
                                                        voeu_id: v.voeu_id,  // ← Pass voeu_id for deletion
                                                        code_smartex_ens: teacher.code,
                                                        nom_ens: teacher.nom,
                                                        prenom_ens: teacher.prenom,
                                                        jour: v.jour,
                                                        seance: v.seance
                                                    })}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <VoeuxModal
                isOpen={showVoeuModal}
                onClose={() => {
                    setShowVoeuModal(false)
                    setEditingVoeu(null)
                }}
                onSave={handleSaveVoeu}
                voeu={editingVoeu}
            />

            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportCSV}
                title="Importer des vœux depuis CSV"
                expectedFields={['code_smartex_ens', 'nom_ens', 'prenom_ens', 'jour', 'seance']}
                templateExample={csvTemplate}
            />

            {/* Delete confirmation */}
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
                                Voulez-vous vraiment supprimer ce vœu ?
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-semibold text-gray-900">
                                    {deleteConfirm.prenom} {deleteConfirm.nom}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <Calendar size={14} />
                                    {JOURS[deleteConfirm.jour]} • {deleteConfirm.seance}
                                </p>
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

            {/* Modal de confirmation de suppression de tous les vœux */}
            {deleteAllConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash size={20} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Supprimer tous les vœux</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ⚠️ Êtes-vous absolument sûr de vouloir supprimer <strong>TOUS les vœux</strong> ({voeux.length}) ?
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
        </div>
    )
}

export default VoeuxScreen
