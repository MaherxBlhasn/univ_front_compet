import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, AlertCircle, RefreshCw, Search, ChevronDown, FileText, Download, CheckSquare, Square, ChevronUp } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import Header from '@components/Layout/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Button from '../components/Common/Button';
import { getInitials } from '../utils/formatters';

const AbsenceResponsablesScreen = () => {
    const { currentSession } = useSession();
    const [responsables, setResponsables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [surveillanceFilter, setSurveillanceFilter] = useState('all');
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [showSurveillanceDropdown, setShowSurveillanceDropdown] = useState(false);

    // États pour les PDFs
    const [pdfFiles, setPdfFiles] = useState([]);
    const [selectedPdfs, setSelectedPdfs] = useState([]);
    const [showPdfSection, setShowPdfSection] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState(null);

    // Debug: Log l'état des PDFs
    useEffect(() => {
        console.log('PDF State updated:', {
            pdfFilesCount: pdfFiles.length,
            showPdfSection,
            pdfFiles
        });
    }, [pdfFiles, showPdfSection]);

    const loadResponsables = async () => {
        if (!currentSession?.id_session) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`http://127.0.0.1:5000/api/presence?session_id=${currentSession.id_session}`);
            const data = await response.json();
            setResponsables(data.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des responsables:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResponsables();
        loadPdfFiles();
    }, [currentSession]);

    // Charger la liste des PDFs disponibles
    const loadPdfFiles = async () => {
        if (!currentSession?.id_session) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/affectations/presences_responsables/list/${currentSession.id_session}`);
            const data = await response.json();

            if (data.success) {
                setPdfFiles(data.files || []);
            } else {
                setPdfFiles([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des PDFs:', error);
            setPdfFiles([]);
        }
    };

    // Générer les PDFs
    const handleGeneratePdfs = async () => {
        if (!currentSession?.id_session) return;

        setGenerating(true);
        setMessage(null);

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/affectations/generate_presences_responsables/${currentSession.id_session}`);
            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: `✓ ${data.nombre_responsables} PDF(s) générés avec succès !`
                });
                await loadPdfFiles();
                setShowPdfSection(true);
            } else {
                setMessage({
                    type: 'error',
                    text: `Erreur : ${data.message || 'Erreur lors de la génération'}`
                });
            }
        } catch (error) {
            console.error('Erreur:', error);
            setMessage({
                type: 'error',
                text: 'Erreur de connexion au serveur'
            });
        } finally {
            setGenerating(false);
        }
    };

    // Télécharger la sélection
    const handleDownloadSelected = async () => {
        if (selectedPdfs.length === 0) {
            setMessage({
                type: 'error',
                text: 'Aucun fichier sélectionné'
            });
            return;
        }

        setDownloading(true);
        setMessage(null);

        try {
            const response = await fetch(
                `http://127.0.0.1:5000/api/affectations/presences_responsables/download-multiple/${currentSession.id_session}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filenames: selectedPdfs,
                        download_all: false
                    })
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `presences_responsables_session_${currentSession.id_session}.zip`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                setMessage({
                    type: 'success',
                    text: `✓ ${selectedPdfs.length} fichier(s) téléchargé(s) avec succès !`
                });
                setSelectedPdfs([]);
            } else {
                const error = await response.json();
                setMessage({
                    type: 'error',
                    text: `Erreur : ${error.error || 'Erreur lors du téléchargement'}`
                });
            }
        } catch (error) {
            console.error('Erreur:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors du téléchargement'
            });
        } finally {
            setDownloading(false);
        }
    };

    // Télécharger tous les PDFs
    const handleDownloadAll = async () => {
        if (pdfFiles.length === 0) {
            setMessage({
                type: 'error',
                text: 'Aucun fichier disponible'
            });
            return;
        }

        setDownloading(true);
        setMessage(null);

        try {
            const response = await fetch(
                `http://127.0.0.1:5000/api/affectations/presences_responsables/download-multiple/${currentSession.id_session}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        download_all: true
                    })
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `presences_responsables_session_${currentSession.id_session}.zip`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                setMessage({
                    type: 'success',
                    text: `✓ Tous les fichiers téléchargés avec succès !`
                });
            } else {
                const error = await response.json();
                setMessage({
                    type: 'error',
                    text: `Erreur : ${error.error || 'Erreur lors du téléchargement'}`
                });
            }
        } catch (error) {
            console.error('Erreur:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors du téléchargement'
            });
        } finally {
            setDownloading(false);
        }
    };

    // Toggle sélection d'un PDF
    const togglePdfSelection = (filename) => {
        setSelectedPdfs(prev =>
            prev.includes(filename)
                ? prev.filter(f => f !== filename)
                : [...prev, filename]
        );
    };

    // Tout sélectionner / Tout désélectionner
    const toggleSelectAll = () => {
        if (selectedPdfs.length === pdfFiles.length) {
            setSelectedPdfs([]);
        } else {
            setSelectedPdfs(pdfFiles.map(f => f.filename));
        }
    };

    // Fermer les dropdowns quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showGradeDropdown && !event.target.closest('.grade-dropdown-container')) {
                setShowGradeDropdown(false);
            }
            if (showSurveillanceDropdown && !event.target.closest('.surveillance-dropdown-container')) {
                setShowSurveillanceDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showGradeDropdown, showSurveillanceDropdown]);

    // Obtenir la liste des grades uniques
    const uniqueGrades = [...new Set(responsables.map(r => r.grade_code).filter(Boolean))].sort();

    const filteredResponsables = responsables
        .filter(resp => {
            const matchSearch = resp.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resp.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resp.code_smartex_ens?.toString().includes(searchTerm);

            const matchGrade = gradeFilter === 'all' || resp.grade_code === gradeFilter;

            const matchSurveillance = surveillanceFilter === 'all' ||
                (surveillanceFilter === 'surveillant' && resp.participe_surveillance) ||
                (surveillanceFilter === 'non_surveillant' && !resp.participe_surveillance);

            return matchSearch && matchGrade && matchSurveillance;
        })
        .sort((a, b) => {
            // Trier d'abord par participe_surveillance (true en premier = vert d'abord)
            if (a.participe_surveillance !== b.participe_surveillance) {
                return b.participe_surveillance - a.participe_surveillance; // true (1) avant false (0)
            }
            // Ensuite trier par nom alphabétique
            return a.nom?.localeCompare(b.nom) || 0;
        });

    // Statistiques
    const stats = {
        total: filteredResponsables.length,
        surveillants: filteredResponsables.filter(r => r.participe_surveillance).length,
        nonSurveillants: filteredResponsables.filter(r => !r.participe_surveillance).length,
        totalJoursAbsents: filteredResponsables.reduce((acc, r) => acc + (r.nbre_jours_absents || 0), 0)
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <LoadingSpinner message="Chargement des responsables..." />
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Users className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune session sélectionnée</h3>
                    <p className="text-gray-600">Veuillez sélectionner une session pour voir les responsables</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            <Header
                title="Absence des Responsables"
                subtitle={`${filteredResponsables.length} responsable(s) affiché(s)`}
                actions={
                    <>
                        <Button variant="outline" icon={RefreshCw} onClick={loadResponsables}>
                            Actualiser
                        </Button>
                        <Button
                            variant="primary"
                            icon={FileText}
                            onClick={handleGeneratePdfs}
                            disabled={generating}
                        >
                            {generating ? 'Génération...' : 'Générer les PDFs'}
                        </Button>
                        {pdfFiles.length > 0 && (
                            <Button
                                variant="secondary"
                                icon={showPdfSection ? ChevronUp : Download}
                                onClick={() => {
                                    console.log('Toggle PDF section, current state:', showPdfSection);
                                    setShowPdfSection(!showPdfSection);
                                }}
                            >
                                {showPdfSection ? 'Masquer' : 'Afficher'} PDFs ({pdfFiles.length})
                            </Button>
                        )}
                    </>
                }
            />

            {/* Main scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Description */}
                <div className="bg-blue-50 border-b border-blue-200 px-4 md:px-6 lg:px-8 py-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                        <p className="text-sm text-blue-800">
                            Cette page affiche les responsables qui s'absentent le jour de leurs examens.
                        </p>
                    </div>
                </div>

                {/* Message de statut */}
                {message && (
                    <div className={`px-4 md:px-6 lg:px-8 py-3 border-b ${message.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Section de téléchargement des PDFs */}
                {showPdfSection && pdfFiles.length > 0 && (
                    <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600" />
                                    PDFs de Convocation ({pdfFiles.length})
                                </h3>
                                <button
                                    onClick={() => {
                                        console.log('Closing PDF section');
                                        setShowPdfSection(false);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                                    title="Masquer la section"
                                >
                                    <ChevronUp size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleSelectAll}
                                    icon={selectedPdfs.length === pdfFiles.length ? CheckSquare : Square}
                                >
                                    {selectedPdfs.length === pdfFiles.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleDownloadSelected}
                                    disabled={selectedPdfs.length === 0 || downloading}
                                    icon={Download}
                                >
                                    Télécharger sélection ({selectedPdfs.length})
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleDownloadAll}
                                    disabled={downloading}
                                    icon={Download}
                                >
                                    Télécharger tout
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pdfFiles.map((file) => (
                                <div
                                    key={file.filename}
                                    onClick={() => togglePdfSelection(file.filename)}
                                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedPdfs.includes(file.filename)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {selectedPdfs.includes(file.filename) ? (
                                                <CheckSquare className="text-blue-600" size={20} />
                                            ) : (
                                                <Square className="text-gray-400" size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.filename.replace('presence_responsable_', '').replace('.pdf', '')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {file.size_mb.toFixed(2)} MB • {file.created}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom ou code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Grade Filter Dropdown */}
                        <div className="relative grade-dropdown-container">
                            <button
                                onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 transition-colors whitespace-nowrap"
                            >
                                <span>{gradeFilter === 'all' ? 'Tous les grades' : gradeFilter}</span>
                                <ChevronDown size={16} className={`transition-transform ${showGradeDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showGradeDropdown && (
                                <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 py-2 min-w-[200px]">
                                    <button
                                        onClick={() => {
                                            setGradeFilter('all');
                                            setShowGradeDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${gradeFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        Tous les grades
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    {uniqueGrades.map(grade => (
                                        <button
                                            key={grade}
                                            onClick={() => {
                                                setGradeFilter(grade);
                                                setShowGradeDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 ${gradeFilter === grade ? 'bg-blue-50' : ''}`}
                                        >
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                {grade}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Surveillance Filter Dropdown */}
                        <div className="relative surveillance-dropdown-container">
                            <button
                                onClick={() => setShowSurveillanceDropdown(!showSurveillanceDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 transition-colors whitespace-nowrap"
                            >
                                <span>
                                    {surveillanceFilter === 'all' ? 'Tous' : surveillanceFilter === 'surveillant' ? 'Surveillants' : 'Non Surveillants'}
                                </span>
                                <ChevronDown size={16} className={`transition-transform ${showSurveillanceDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showSurveillanceDropdown && (
                                <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 py-2 min-w-[200px]">
                                    <button
                                        onClick={() => {
                                            setSurveillanceFilter('all');
                                            setShowSurveillanceDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${surveillanceFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        Tous
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setSurveillanceFilter('surveillant');
                                            setShowSurveillanceDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${surveillanceFilter === 'surveillant' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        Surveillants
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSurveillanceFilter('non_surveillant');
                                            setShowSurveillanceDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${surveillanceFilter === 'non_surveillant' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                    >
                                        Non Surveillants
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Responsables</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Responsables Surveillants</p>
                            <p className="text-2xl font-bold text-green-900">{stats.surveillants}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Responsables Non Surveillants</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.nonSurveillants}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Total Jours Absents</p>
                            <p className="text-2xl font-bold text-red-900">{stats.totalJoursAbsents}</p>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="p-6 bg-gray-50">
                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Enseignant
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Grade
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Surveillance
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Créneaux Absents
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Jours Absents
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Taux Présence (Créneaux)
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Taux Présence (Jours)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredResponsables.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                <AlertCircle className="mx-auto mb-2 text-gray-400" size={48} />
                                                <p className="text-lg font-medium">Aucun responsable trouvé</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResponsables.map((resp) => (
                                            <tr
                                                key={resp.id}
                                                className={`transition-colors ${resp.participe_surveillance
                                                    ? 'bg-green-50 hover:bg-green-100'
                                                    : 'bg-red-50 hover:bg-red-100'
                                                    }`}
                                            >
                                                {/* Code */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{resp.code_smartex_ens}</span>
                                                </td>
                                                {/* Enseignant */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${resp.participe_surveillance
                                                            ? 'bg-green-100'
                                                            : 'bg-red-100'
                                                            }`}>
                                                            <span className={`font-semibold text-sm ${resp.participe_surveillance
                                                                ? 'text-green-700'
                                                                : 'text-red-700'
                                                                }`}>
                                                                {getInitials(resp.nom, resp.prenom)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {resp.prenom} {resp.nom}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Grade */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {resp.grade_code || 'N/A'}
                                                    </span>
                                                </td>
                                                {/* Surveillance */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {resp.participe_surveillance ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <UserCheck className="mr-1" size={14} />
                                                            Oui
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <UserX className="mr-1" size={14} />
                                                            Non
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Créneaux Absents */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {resp.nbre_creneaux_absents}/{resp.nbre_total_creneaux_responsable}
                                                    </span>
                                                </td>
                                                {/* Jours Absents */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {resp.nbre_jours_absents}/{resp.nbre_total_jours_responsable}
                                                    </span>
                                                </td>
                                                {/* Taux Présence Créneaux */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                            <div
                                                                className={`h-2 rounded-full ${resp.taux_presence_creneaux >= 75 ? 'bg-green-500' :
                                                                    resp.taux_presence_creneaux >= 50 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${resp.taux_presence_creneaux}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {resp.taux_presence_creneaux}%
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* Taux Présence Jours */}
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                            <div
                                                                className={`h-2 rounded-full ${resp.taux_presence_jours >= 75 ? 'bg-green-500' :
                                                                    resp.taux_presence_jours >= 50 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${resp.taux_presence_jours}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {resp.taux_presence_jours}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AbsenceResponsablesScreen;
