import { useState, useEffect } from 'react';
import { Plus, Search, Download, Upload, Mail, CheckCircle, XCircle, RefreshCw, Edit2, Trash2, Info, Trash } from 'lucide-react';
import Header from '@components/Layout/Header';
import Button from '@components/Common/Button';
import TeacherModal from '@components/Common/TeacherModal';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import CSVImportModal from '@components/Common/CSVImportModal';
import { GRADE_LABELS } from '../data/mockData';
import { getInitials } from '../utils/formatters';
import { showNotification, exportToCSV } from '../utils/exports';
import { notifyDataDeleted } from '../utils/events';
import { fetchEnseignants, fetchGrades, createEnseignant, updateEnseignant, deleteEnseignant, deleteAllEnseignants, uploadAndImportFile } from '../services/api';

const TeachersScreen = () => {
    const [showModal, setShowModal] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState(null)
    const [teachers, setTeachers] = useState([])
    const [grades, setGrades] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [gradeFilter, setGradeFilter] = useState('all')
    const [surveillanceFilter, setSurveillanceFilter] = useState('all')
    const [showGradeDropdown, setShowGradeDropdown] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)

    // Couleurs pour chaque grade
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
        }
        return gradeColors[gradeCode] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
    }

    // Charger les données depuis l'API au montage du composant
    useEffect(() => {
        loadData()
    }, [])

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showGradeDropdown && !event.target.closest('.grade-dropdown-container')) {
                setShowGradeDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showGradeDropdown])

    const loadData = async () => {
        setLoading(true)
        try {
            // Charger les enseignants et grades en parallèle
            const [enseignantsData, gradesData] = await Promise.all([
                fetchEnseignants(),
                fetchGrades()
            ])
            
            console.log('📊 Données enseignants reçues:', enseignantsData)
            console.log('📊 Données grades reçues:', gradesData)
            
            setTeachers(enseignantsData)
            
            // Convertir le tableau de grades en objet pour un accès rapide
            const gradesMap = {}
            gradesData.forEach(grade => {
                gradesMap[grade.code_grade] = grade.libelle_grade
            })
            setGrades(gradesMap)
            
            console.log('✅ Enseignants chargés:', enseignantsData.length)
            console.log('✅ Grades chargés:', gradesMap)
            
            showNotification('Succès', `${enseignantsData.length} enseignants chargés`, 'success')
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error)
            showNotification('Erreur', 'Impossible de charger les enseignants', 'error')
            setTeachers([])
        } finally {
            setLoading(false)
        }
    }

    // Filtrer les enseignants
    const filteredTeachers = teachers.filter(teacher => {
        const matchSearch = searchTerm === '' || 
            teacher.nom_ens.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.prenom_ens.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.email_ens?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.code_smartex_ens.toString().includes(searchTerm)
        
        const matchGrade = gradeFilter === 'all' || teacher.grade_code_ens === gradeFilter
        
        const matchSurveillance = surveillanceFilter === 'all' || 
            (surveillanceFilter === 'oui' && teacher.participe_surveillance) ||
            (surveillanceFilter === 'non' && !teacher.participe_surveillance)
        
        return matchSearch && matchGrade && matchSurveillance
    })

    const handleToggleSurveillance = async (code_smartex_ens) => {
        const teacher = teachers.find(t => t.code_smartex_ens === code_smartex_ens)
        if (!teacher) return

        try {
            const updatedTeacher = {
                ...teacher,
                participe_surveillance: !teacher.participe_surveillance
            }
            
            await updateEnseignant(code_smartex_ens, updatedTeacher)
            
            setTeachers(teachers.map(t => 
                t.code_smartex_ens === code_smartex_ens ? updatedTeacher : t
            ))
            showNotification('Succès', 'Statut de surveillance mis à jour', 'success')
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error)
            showNotification('Erreur', 'Impossible de mettre à jour le statut', 'error')
        }
    }

    const handleSaveTeacher = async (teacherData) => {
        try {
            if (editingTeacher) {
                // Modification
                await updateEnseignant(teacherData.code_smartex_ens, teacherData)
                setTeachers(teachers.map(t => 
                    t.code_smartex_ens === teacherData.code_smartex_ens ? teacherData : t
                ))
                showNotification('Succès', 'Enseignant modifié avec succès', 'success')
            } else {
                // Ajout
                const newTeacher = await createEnseignant(teacherData)
                setTeachers([...teachers, newTeacher])
                showNotification('Succès', 'Enseignant ajouté avec succès', 'success')
            }
            setEditingTeacher(null)
            setShowModal(false)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
            showNotification('Erreur', 'Impossible de sauvegarder l\'enseignant', 'error')
        }
    }

    const handleDeleteTeacher = (code_smartex_ens) => {
        setDeleteConfirm(code_smartex_ens)
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return

        try {
            await deleteEnseignant(deleteConfirm)
            setTeachers(teachers.filter(t => t.code_smartex_ens !== deleteConfirm))
            showNotification('Succès', 'Enseignant supprimé', 'success')
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            showNotification('Erreur', 'Impossible de supprimer l\'enseignant', 'error')
        } finally {
            setDeleteConfirm(null)
        }
    }

    const cancelDelete = () => {
        setDeleteConfirm(null)
    }

    const handleDeleteAll = () => {
        setDeleteAllConfirm(true)
    }

    const confirmDeleteAll = async () => {
        try {
            await deleteAllEnseignants()
            setTeachers([])
            showNotification('Succès', 'Tous les enseignants ont été supprimés', 'success')
            // Notifier que les données ont été supprimées pour mettre à jour le statut d'affectation
            notifyDataDeleted()
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            showNotification('Erreur', 'Impossible de supprimer tous les enseignants', 'error')
        } finally {
            setDeleteAllConfirm(false)
        }
    }

    const cancelDeleteAll = () => {
        setDeleteAllConfirm(false)
    }

    const handleEditTeacher = (code_smartex_ens) => {
        const teacher = teachers.find(t => t.code_smartex_ens === code_smartex_ens)
        setEditingTeacher(teacher)
        setShowModal(true)
    }

    const handleExport = () => {
        exportToCSV(filteredTeachers, 'enseignants')
        showNotification('Succès', 'Export CSV réussi', 'success')
    }

    const handleImportCSV = async (file) => {
        try {
            setLoading(true)
            
            // Utiliser la nouvelle API unifiée qui supporte CSV et XLSX
            console.log('📤 Upload et import du fichier:', file.name)
            const result = await uploadAndImportFile(file, 'enseignants')
            console.log('✅ Upload et import terminés:', result)
            
            // Afficher le résultat
            if (result.success && result.import) {
                const importData = result.import
                showNotification(
                    'Succès', 
                    `${importData.inserted || 0} enseignants importés${importData.errors && importData.errors.length > 0 ? ` (${importData.errors.length} erreurs)` : ''}`, 
                    'success'
                )
                
                // Recharger les enseignants
                await loadData()
                
                // Notifier le changement pour mettre à jour le statut d'affectation
                notifyDataDeleted()
            } else {
                showNotification('Erreur', result.error || 'Erreur lors de l\'import', 'error')
            }
        } catch (error) {
            console.error('Erreur lors de l\'import:', error)
            showNotification('Erreur', `Impossible d'importer les enseignants: ${error.message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    // Si les données sont en cours de chargement
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
                title="Gestion des enseignants"
                subtitle={`${filteredTeachers.length} enseignant${filteredTeachers.length > 1 ? 's' : ''} ${searchTerm || gradeFilter !== 'all' || surveillanceFilter !== 'all' ? 'trouvé(s)' : 'enregistré(s)'}`}
                actions={
                    <>
                        <Button variant="outline" icon={RefreshCw} onClick={loadData}>
                            Actualiser
                        </Button>
                        {teachers.length > 0 && (
                            <Button variant="danger" icon={Trash} onClick={handleDeleteAll}>
                                Supprimer tout
                            </Button>
                        )}
                        <Button variant="outline" icon={Upload} onClick={() => setShowImportModal(true)}>
                            Importer
                        </Button>
                        <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
                            Ajouter enseignant
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
                            placeholder="Rechercher par nom, email, code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                    <div className="relative grade-dropdown-container">
                        <button
                            onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                            className="px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 cursor-pointer flex items-center gap-2 min-w-[280px] justify-between"
                        >
                            {gradeFilter === 'all' ? (
                                <span className="text-gray-700">Tous les grades</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        getGradeColor(gradeFilter).bg
                                    } ${
                                        getGradeColor(gradeFilter).text
                                    } ${
                                        getGradeColor(gradeFilter).border
                                    }`}>
                                        {gradeFilter}
                                    </span>
                                    <span className="text-sm text-gray-700">
                                        {GRADE_LABELS[gradeFilter]}
                                    </span>
                                </div>
                            )}
                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showGradeDropdown && (
                            <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setGradeFilter('all')
                                        setShowGradeDropdown(false)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Tous les grades
                                </button>
                                {Object.keys(grades).length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">Chargement...</div>
                                ) : (
                                    Object.keys(grades).sort().map((code) => (
                                        <button
                                            key={code}
                                            onClick={() => {
                                                setGradeFilter(code)
                                                setShowGradeDropdown(false)
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                getGradeColor(code).bg
                                            } ${
                                                getGradeColor(code).text
                                            } ${
                                                getGradeColor(code).border
                                            }`}>
                                                {code}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {GRADE_LABELS[code] || code}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <select 
                        value={surveillanceFilter}
                        onChange={(e) => setSurveillanceFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 cursor-pointer"
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    >
                        <option value="all" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Tous</option>
                        <option value="oui" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Participe surveillance</option>
                        <option value="non" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Ne participe pas</option>
                    </select>
                    <div className="flex gap-2">
                        <Button variant="outline" icon={Download} className="flex-1 md:flex-none" onClick={handleExport}>
                            <span className="hidden lg:inline">Exporter</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Summary Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 md:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-gray-700">
                                {filteredTeachers.length} résultat{filteredTeachers.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        {(searchTerm || gradeFilter !== 'all' || surveillanceFilter !== 'all') && (
                            <div className="text-sm text-gray-600">
                                sur {teachers.length} enseignant{teachers.length > 1 ? 's' : ''} au total
                            </div>
                        )}
                    </div>
                    {(searchTerm || gradeFilter !== 'all' || surveillanceFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setGradeFilter('all')
                                setSurveillanceFilter('all')
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                            Réinitialiser les filtres
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {/* Legend for Grade Colors - Compact Version with Names */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-2.5 mb-4 shadow-sm">
                    <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Info size={14} className="text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Légende:</span>
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-700 border-purple-300">PR</span>
                                <span className="text-xs text-gray-600">Professeur</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-100 text-indigo-700 border-indigo-300">PES</span>
                                <span className="text-xs text-gray-600">Prof. Ens. Sup.</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-300">MC</span>
                                <span className="text-xs text-gray-600">Maître Conf.</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-cyan-100 text-cyan-700 border-cyan-300">MA</span>
                                <span className="text-xs text-gray-600">Maître Asst.</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-teal-100 text-teal-700 border-teal-300">PTC</span>
                                <span className="text-xs text-gray-600">Prof. Techno.</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-300">AS</span>
                                <span className="text-xs text-gray-600">Assistant</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-300">AC</span>
                                <span className="text-xs text-gray-600">Asst. Contract.</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-300">VA</span>
                                <span className="text-xs text-gray-600">Vacataire</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">EX</span>
                                <span className="text-xs text-gray-600">Expert</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Enseignant</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Grade</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Surveillance</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTeachers.map((teacher, index) => (
                                    <tr key={teacher.code_smartex_ens} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {teacher.code_smartex_ens}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-700 font-semibold text-sm">
                                                        {getInitials(teacher.prenom_ens, teacher.nom_ens)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {teacher.prenom_ens} {teacher.nom_ens}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail size={16} className="text-gray-400" />
                                                <span>{teacher.email_ens || 'Non renseigné'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                getGradeColor(teacher.grade_code_ens).bg
                                            } ${
                                                getGradeColor(teacher.grade_code_ens).text
                                            } ${
                                                getGradeColor(teacher.grade_code_ens).border
                                            }`}>
                                                {teacher.grade_code_ens}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleToggleSurveillance(teacher.code_smartex_ens)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                                                        teacher.participe_surveillance
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                >
                                                    {teacher.participe_surveillance ? (
                                                        <>
                                                            <CheckCircle size={16} />
                                                            <span className="text-xs font-medium">Oui</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={16} />
                                                            <span className="text-xs font-medium">Non</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditTeacher(teacher.code_smartex_ens)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                                                    title="Modifier l'enseignant"
                                                >
                                                    <Edit2 size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher.code_smartex_ens)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="Supprimer l'enseignant"
                                                >
                                                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty state */}
                    {filteredTeachers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Aucun enseignant trouvé</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Teacher Modal */}
            <TeacherModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setEditingTeacher(null)
                }}
                onSave={handleSaveTeacher}
                teacher={editingTeacher}
            />

            {/* Modal de confirmation de suppression */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer cet enseignant ? Cette action est irréversible.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression de tous les enseignants */}
            {deleteAllConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Trash size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Supprimer tous les enseignants</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ⚠️ Êtes-vous absolument sûr de vouloir supprimer <strong>TOUS les enseignants</strong> ({teachers.length}) ? 
                            Cette action est <strong>irréversible</strong> et supprimera toutes les données associées.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDeleteAll}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDeleteAll}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Supprimer tout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            <CSVImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportCSV}
                title="Importer des enseignants"
                expectedFields={['code_smartex_ens', 'nom_ens', 'prenom_ens', 'email_ens', 'grade_code_ens', 'participe_surveillance']}
                templateExample="code_smartex_ens,nom_ens,prenom_ens,email_ens,grade_code_ens,participe_surveillance\n57,Karoui,Wafa,wafa.karoui@isi.utm.tn,PR,1"
            />
        </div>
    )
}

export default TeachersScreen




