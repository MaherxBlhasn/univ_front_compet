import { useState, useEffect } from 'react';
import { HardDrive, Trash2, FolderOpen, FileText, FileSpreadsheet, AlertTriangle, RefreshCw, Database, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Button from '../components/Common/Button';
import { getStorageInfo, deleteAllFiles, deleteSessionFiles, cleanupEmptyFolders } from '../services/api';

const StorageScreen = () => {
    const [storageData, setStorageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadStorageData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getStorageInfo();
            console.log('📊 Storage data:', data);
            setStorageData(data);
        } catch (err) {
            console.error('❌ Error loading storage:', err);
            setError('Erreur lors du chargement des données de stockage');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStorageData();
    }, []);

    const handleDeleteAll = (type = 'all') => {
        setDeleteConfirm({ type, action: 'deleteAll' });
    };

    const handleDeleteSession = (sessionId, type = 'all') => {
        setDeleteConfirm({ type, sessionId, action: 'deleteSession' });
    };

    const handleCleanup = () => {
        setDeleteConfirm({ action: 'cleanup' });
    };

    const confirmDelete = async () => {
        try {
            setDeleting(true);

            if (deleteConfirm.action === 'deleteAll') {
                await deleteAllFiles(deleteConfirm.type);
            } else if (deleteConfirm.action === 'deleteSession') {
                await deleteSessionFiles(deleteConfirm.sessionId, deleteConfirm.type);
            } else if (deleteConfirm.action === 'cleanup') {
                await cleanupEmptyFolders();
            }

            await loadStorageData();
            setDeleteConfirm(null);
        } catch (err) {
            console.error('❌ Error:', err);
            alert('❌ Erreur lors de la suppression');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <LoadingSpinner message="Chargement des données de stockage..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={loadStorageData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const { totals, file_counts, total_files, sessions, total_sessions } = storageData;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Consommation Mémoire</h1>
                        <p className="text-gray-600 mt-1">Gestion et monitoring du stockage des fichiers générés</p>
                    </div>
                    <button
                        onClick={loadStorageData}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw size={18} className={deleting ? 'animate-spin' : ''} />
                        <span>Actualiser</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                {/* Main Layout: Total Général (left) and Breakdown (right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Left: Total Général Card with Actions - Plus compact */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Mémoire totale consommée</h3>
                        <div className="relative w-48 h-48 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="85"
                                    stroke="#E5E7EB"
                                    strokeWidth="12"
                                    fill="none"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="85"
                                    stroke="url(#totalGradient)"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray="534"
                                    strokeDashoffset="0"
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="totalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#1D4ED8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <HardDrive className="text-blue-500 mb-2" size={32} />
                                <span className="text-3xl font-bold text-gray-900">{totals.total_all.formatted}</span>
                                <span className="text-xs text-gray-500 mt-1">Stockage total</span>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                            <div className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xl font-bold text-blue-600">{total_files}</p>
                                <p className="text-xs text-gray-600 mt-0.5">Fichiers</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xl font-bold text-blue-600">{total_sessions}</p>
                                <p className="text-xs text-gray-600 mt-0.5">Sessions</p>
                            </div>
                        </div>

                        {/* Action Buttons - Plus grands */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleDeleteAll('all')}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    Tout supprimer
                                </button>
                                <button
                                    onClick={() => handleDeleteAll('pdf')}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                                >
                                    <FileText size={16} />
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDeleteAll('csv')}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                                >
                                    <FileSpreadsheet size={16} />
                                    CSV
                                </button>
                                <button
                                    onClick={handleCleanup}
                                    disabled={deleting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
                                >
                                    <RefreshCw size={16} />
                                    Nettoyer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Affectations, Convocations et Présences en colonne (3 rows) */}
                    <div className="flex flex-col gap-4">
                        {/* Affectations */}
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <FileText className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Affectations</h3>
                                    <p className="text-xs text-gray-500">{file_counts.affectations_pdf + file_counts.affectations_csv} fichiers</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-red-100 hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-red-600" size={16} />
                                        <span className="text-sm font-medium text-gray-700">PDF</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-600">{totals.affectations_pdf.formatted}</p>
                                        <p className="text-xs text-gray-500">{file_counts.affectations_pdf} fichiers</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="text-green-600" size={16} />
                                        <span className="text-sm font-medium text-gray-700">CSV</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">{totals.affectations_csv.formatted}</p>
                                        <p className="text-xs text-gray-500">{file_counts.affectations_csv} fichiers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Convocations */}
                        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <FileText className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Convocations</h3>
                                    <p className="text-xs text-gray-500">{file_counts.convocations_pdf + file_counts.convocations_csv} fichiers</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-red-100 hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-red-600" size={16} />
                                        <span className="text-sm font-medium text-gray-700">PDF</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-600">{totals.convocations_pdf.formatted}</p>
                                        <p className="text-xs text-gray-500">{file_counts.convocations_pdf} fichiers</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="text-green-600" size={16} />
                                        <span className="text-sm font-medium text-gray-700">CSV</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">{totals.convocations_csv.formatted}</p>
                                        <p className="text-xs text-gray-500">{file_counts.convocations_csv} fichiers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Convocations des Responsables */}
                        <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 border border-amber-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <FileText className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Présences Responsables</h3>
                                    <p className="text-xs text-gray-500">{file_counts.presences_responsables_pdf} fichiers</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-red-100 hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-red-600" size={16} />
                                        <span className="text-sm font-medium text-gray-700">PDF</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-600">{totals.presences_responsables_pdf.formatted}</p>
                                        <p className="text-xs text-gray-500">{file_counts.presences_responsables_pdf} fichiers</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sessions Details */}
                {sessions && sessions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-blue-500 px-6 py-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database size={24} />
                                Détail par Session
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Session
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Affectations PDF
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Affectations CSV
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Convocations PDF
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Convocations CSV
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Présences Resp. PDF
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sessions.map((session) => (
                                        <tr key={session.session_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">{session.session_id}</span>
                                                    </div>
                                                    <span className="font-medium text-gray-900">Session {session.session_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.affectations_pdf?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.affectations_csv?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.convocations_pdf?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.convocations_csv?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {session.presences_responsables_pdf?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-blue-600">
                                                    {session.total?.formatted || '0 B'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteSession(session.session_id)}
                                                    disabled={deleting}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {sessions && sessions.length === 0 && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
                        <Database className="mx-auto mb-4 text-gray-400" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune donnée de stockage</h3>
                        <p className="text-gray-600">
                            Aucun fichier généré pour le moment. Les données apparaîtront ici une fois que vous aurez généré des affectations ou convocations.
                        </p>
                    </div>
                )}
            </main>

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
                            {deleteConfirm.action === 'deleteAll' && (
                                <>
                                    <p className="text-gray-700 mb-2">
                                        Voulez-vous vraiment supprimer tous les fichiers {
                                            deleteConfirm.type === 'pdf' ? 'PDF' :
                                                deleteConfirm.type === 'csv' ? 'CSV' :
                                                    'PDF et CSV'
                                        } ?
                                    </p>
                                    <p className="text-sm text-red-600 font-medium mt-2">
                                        ⚠️ Cette action est irréversible
                                    </p>
                                </>
                            )}

                            {deleteConfirm.action === 'deleteSession' && (
                                <>
                                    <p className="text-gray-700 mb-2">
                                        Voulez-vous vraiment supprimer les fichiers de la session ?
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Session {deleteConfirm.sessionId}
                                        </p>
                                    </div>
                                </>
                            )}

                            {deleteConfirm.action === 'cleanup' && (
                                <p className="text-gray-700">
                                    Voulez-vous vraiment nettoyer tous les dossiers vides ?
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                                Annuler
                            </Button>
                            <Button variant="danger" icon={Trash2} onClick={confirmDelete} disabled={deleting}>
                                Supprimer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageScreen;
