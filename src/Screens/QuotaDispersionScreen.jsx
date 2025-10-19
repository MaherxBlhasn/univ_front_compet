import { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, RefreshCw, Trash2, RotateCcw, Search, ChevronDown } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import Header from '@components/Layout/Header';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Button from '../components/Common/Button';
import { fetchGrades } from '../services/api';
import { getInitials } from '../utils/formatters';

const QuotaDispersionScreen = () => {
    const { currentSession } = useSession();
    const [quotas, setQuotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [sessionFilter, setSessionFilter] = useState('all');
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [showSessionDropdown, setShowSessionDropdown] = useState(false);
    const [gradesArray, setGradesArray] = useState([]);
    const [sessionsArray, setSessionsArray] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadQuotas = async () => {
        try {
            setLoading(true);
            // Charger les quotas de toutes les sessions
            const response = await fetch(`http://127.0.0.1:5000/api/quota-enseignants`);
            const data = await response.json();
            setQuotas(data);

            // Extraire les sessions uniques des quotas
            const uniqueSessions = [...new Set(data.map(q => q.id_session))].filter(Boolean);
            const sessionsData = uniqueSessions.map(id => ({
                id_session: id,
                // Trouver le libellé de la session depuis les données
                libelle: data.find(q => q.id_session === id)?.libelle_session || `Session ${id}`
            }));
            setSessionsArray(sessionsData);
        } catch (error) {
            console.error('Erreur lors du chargement des quotas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotas();
        loadGrades();
    }, [currentSession]);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showGradeDropdown && !event.target.closest('.grade-dropdown-container')) {
                setShowGradeDropdown(false);
            }
            if (showSessionDropdown && !event.target.closest('.session-dropdown-container')) {
                setShowSessionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showGradeDropdown, showSessionDropdown]);

    const loadGrades = async () => {
        try {
            const gradesData = await fetchGrades();
            setGradesArray(gradesData);
        } catch (error) {
            console.error('Erreur lors du chargement des grades:', error);
        }
    };

    const handleResetAll = () => {
        setDeleteConfirm({ action: 'resetAll' });
    };

    const handleDeleteAll = () => {
        setDeleteConfirm({ action: 'deleteAll' });
    };

    const confirmAction = async () => {
        try {
            const targetSession = sessionFilter === 'all' ? null : sessionFilter;

            if (deleteConfirm.action === 'resetAll') {
                if (targetSession) {
                    await fetch(`http://127.0.0.1:5000/api/quota-enseignants/reset/session/${targetSession}`, {
                        method: 'PUT'
                    });
                } else {
                    // Réinitialiser toutes les sessions
                    await fetch(`http://127.0.0.1:5000/api/quota-enseignants/reset`, {
                        method: 'PUT'
                    });
                }
            } else if (deleteConfirm.action === 'deleteAll') {
                if (targetSession) {
                    await fetch(`http://127.0.0.1:5000/api/quota-enseignants/session/${targetSession}`, {
                        method: 'DELETE'
                    });
                } else {
                    // Supprimer toutes les sessions
                    await fetch(`http://127.0.0.1:5000/api/quota-enseignants`, {
                        method: 'DELETE'
                    });
                }
            }
            await loadQuotas();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'opération');
        }
    };

    const filteredQuotas = quotas.filter(quota => {
        const matchSearch = quota.nom_ens?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quota.prenom_ens?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quota.code_smartex_ens?.toString().includes(searchTerm);

        const matchGrade = gradeFilter === 'all' || quota.grade_code_ens === gradeFilter;

        const matchSession = sessionFilter === 'all' || quota.id_session === sessionFilter;

        return matchSearch && matchGrade && matchSession;
    });

    // Statistiques
    const stats = {
        total: filteredQuotas.length,
        positif: filteredQuotas.filter(q => q.diff_quota_grade > 0).length,
        negatif: filteredQuotas.filter(q => q.diff_quota_grade < 0).length,
        equilibre: filteredQuotas.filter(q => q.diff_quota_grade === 0).length,
        avgDiff: filteredQuotas.reduce((acc, q) => acc + (q.diff_quota_grade || 0), 0) / (filteredQuotas.length || 1)
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <LoadingSpinner message="Chargement des quotas..." />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            <Header
                title="Dispersion des quotas"
                subtitle={`${filteredQuotas.length} enseignant(s) affiché(s)`}
                actions={
                    <>
                        <Button variant="outline" icon={RefreshCw} onClick={loadQuotas}>
                            Actualiser
                        </Button>
                        <Button variant="secondary" icon={RotateCcw} onClick={handleResetAll}>
                            Réinitialiser
                        </Button>
                        <Button variant="danger" icon={Trash2} onClick={handleDeleteAll}>
                            Supprimer tout
                        </Button>
                    </>
                }
            />

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

                    {/* Session Filter Dropdown */}
                    <div className="relative session-dropdown-container">
                        <button
                            onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:border-gray-500 transition-colors whitespace-nowrap"
                        >
                            <span>{sessionFilter === 'all' ? 'Toutes les sessions' : `Session ${sessionFilter}`}</span>
                            <ChevronDown size={16} className={`transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSessionDropdown && (
                            <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 py-2 min-w-[200px]">
                                <button
                                    onClick={() => {
                                        setSessionFilter('all');
                                        setShowSessionDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${sessionFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                >
                                    Toutes les sessions
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                {sessionsArray.map(session => (
                                    <button
                                        key={session.id_session}
                                        onClick={() => {
                                            setSessionFilter(session.id_session);
                                            setShowSessionDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm ${sessionFilter === session.id_session ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                    >
                                        {session.libelle}
                                    </button>
                                ))}
                            </div>
                        )}
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
                                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium ${gradeFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                >
                                    Tous les grades
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                {gradesArray.map(grade => {
                                    const colorClass = getGradeColorFull(grade.code_grade);
                                    return (
                                        <button
                                            key={grade.code_grade}
                                            onClick={() => {
                                                setGradeFilter(grade.code_grade);
                                                setShowGradeDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2 ${gradeFilter === grade.code_grade ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass.bg} ${colorClass.text} ${colorClass.border} border`}>
                                                {grade.code_grade}
                                            </span>
                                            <span className="text-sm text-gray-700">{grade.grade}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Enseignants</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Déficit (-)</p>
                        <p className="text-2xl font-bold text-green-900">{stats.negatif}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Surplus (+)</p>
                        <p className="text-2xl font-bold text-red-900">{stats.positif}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium">Équilibrés</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.equilibre}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">

                {/* Quotas Table */}
                {filteredQuotas.length > 0 ? (
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
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Session
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Grade
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Quota Grade
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Quota Réalisé
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Différence
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Quota Ajusté
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredQuotas.map((quota) => (
                                        <tr key={`${quota.code_smartex_ens}-${quota.id_session}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">{quota.code_smartex_ens}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-blue-700 font-semibold text-sm">
                                                            {getInitials(quota.prenom_ens, quota.nom_ens)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {quota.prenom_ens} {quota.nom_ens}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{quota.email_ens}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-700">
                                                    {quota.libelle_session || `Session ${quota.id_session}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(quota.grade_code_ens)
                                                    }`}>
                                                    {quota.grade_code_ens || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{quota.quota_grade || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">{quota.quota_realise || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${quota.diff_quota_grade > 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : quota.diff_quota_grade < 0
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {quota.diff_quota_grade > 0 && <TrendingUp size={14} />}
                                                    {quota.diff_quota_grade < 0 && <TrendingDown size={14} />}
                                                    {quota.diff_quota_grade === 0 && <Minus size={14} />}
                                                    {quota.diff_quota_grade > 0 ? '+' : ''}{quota.diff_quota_grade || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="text-sm text-blue-600 font-medium">{quota.quota_ajuste || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {quota.diff_quota_grade === 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                        ✓ Équilibré
                                                    </span>
                                                ) : quota.diff_quota_grade > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        ⚠ Surplus
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        ✓ Sous quota
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
                        <Users className="mx-auto mb-4 text-gray-400" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun quota trouvé</h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? "Aucun résultat pour votre recherche"
                                : "Les quotas apparaîtront après la génération des affectations"}
                        </p>
                    </div>
                )}
            </main>

            {/* Modal de confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deleteConfirm.action === 'resetAll' ? 'bg-orange-100' : 'bg-red-100'
                                }`}>
                                {deleteConfirm.action === 'resetAll' ? (
                                    <RotateCcw size={20} className="text-orange-600" />
                                ) : (
                                    <Trash2 size={20} className="text-red-600" />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {deleteConfirm.action === 'resetAll' ? 'Réinitialiser les quotas' : 'Supprimer les quotas'}
                            </h3>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            {deleteConfirm.action === 'resetAll' ? (
                                <p className="text-gray-700">
                                    Voulez-vous vraiment réinitialiser tous les quotas de cette session ?
                                    Les différences seront remises à zéro.
                                </p>
                            ) : (
                                <>
                                    <p className="text-gray-700 mb-2">
                                        Voulez-vous vraiment supprimer tous les quotas de cette session ?
                                    </p>
                                    <p className="text-sm text-red-600 font-medium mt-2">
                                        ⚠️ Cette action est irréversible
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                                Annuler
                            </Button>
                            <Button
                                variant={deleteConfirm.action === 'resetAll' ? 'primary' : 'danger'}
                                icon={deleteConfirm.action === 'resetAll' ? RotateCcw : Trash2}
                                onClick={confirmAction}
                            >
                                {deleteConfirm.action === 'resetAll' ? 'Réinitialiser' : 'Supprimer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getGradeColor = (grade) => {
    const colors = {
        'PR': 'bg-purple-100 text-purple-700',
        'MC': 'bg-blue-100 text-blue-700',
        'MA': 'bg-cyan-100 text-cyan-700',
        'AS': 'bg-green-100 text-green-700',
        'AC': 'bg-yellow-100 text-yellow-700',
        'PTC': 'bg-teal-100 text-teal-700',
        'PES': 'bg-indigo-100 text-indigo-700',
        'EX': 'bg-red-100 text-red-700',
        'V': 'bg-gray-100 text-gray-700'
    };
    return colors[grade] || 'bg-gray-100 text-gray-700';
};

const getGradeColorFull = (gradeCode) => {
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
    };
    return gradeColors[gradeCode] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
};

export default QuotaDispersionScreen;
