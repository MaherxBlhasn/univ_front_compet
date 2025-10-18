import { useState, useEffect } from 'react';
import { Trash } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { fetchAffectations, permuterAffectations, fetchEnseignants, deleteAllAffectations } from '../services/api';
import Header from '@components/Layout/Header';
import Button from '@components/Common/Button';
import SwapConfirmationModal from '../components/Common/SwapConfirmationModal';
import Modal from '../components/Common/Modal';
import { getInitials } from '../utils/formatters';

const AffectationsListScreen = () => {
  const { currentSession } = useSession();
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffectation, setSelectedAffectation] = useState(null);
  const [groupBy, setGroupBy] = useState('jour'); // 'jour', 'enseignant', 'salle'
  const [enseignants, setEnseignants] = useState([]);
  const [draggedProf, setDraggedProf] = useState(null); // Store dragged professor info
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentSession?.id_session) {
      loadAffectations();
    }
  }, [currentSession]);

  const loadAffectations = async () => {
    if (!currentSession?.id_session) return;

    try {
      setLoading(true);
      const [affectationsData, enseignantsData] = await Promise.all([
        fetchAffectations(currentSession.id_session),
        fetchEnseignants()
      ]);
      setAffectations(affectationsData);
      setEnseignants(enseignantsData || []);
      console.log('📋 Affectations chargées:', affectationsData);
      console.log('👥 Enseignants chargés:', enseignantsData);
      if (affectationsData && affectationsData.length > 0) {
        console.log('🔍 Structure première affectation:', affectationsData[0]);
        console.log('🔍 Champs enseignant:', {
          enseignant: affectationsData[0].enseignant,
          prenom_ens: affectationsData[0].prenom_ens,
          nom_ens: affectationsData[0].nom_ens,
          code_smartex_ens: affectationsData[0].code_smartex_ens
        });
      }
    } catch (error) {
      console.error('Erreur chargement affectations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get teacher name by code
  const getTeacherName = (code) => {
    const teacher = enseignants.find(e => e.code_smartex_ens === code);
    if (teacher) {
      return `${teacher.nom_ens || ''} ${teacher.prenom_ens || ''}`.trim() || `Prof ${code}`;
    }
    return `Prof ${code}`;
  };

  // Generate avatar color based on code
  const getAvatarColor = (code) => {
    const colors = [
      { bg: 'bg-blue-500', text: 'text-white' },
      { bg: 'bg-purple-500', text: 'text-white' },
      { bg: 'bg-pink-500', text: 'text-white' },
      { bg: 'bg-indigo-500', text: 'text-white' },
      { bg: 'bg-cyan-500', text: 'text-white' },
      { bg: 'bg-teal-500', text: 'text-white' },
      { bg: 'bg-green-500', text: 'text-white' },
      { bg: 'bg-yellow-500', text: 'text-white' },
      { bg: 'bg-orange-500', text: 'text-white' },
      { bg: 'bg-red-500', text: 'text-white' },
    ];
    return colors[code % colors.length];
  };

  // Handle drop - show confirmation modal
  const handleDrop = (targetAffectation) => {
    if (!draggedProf || draggedProf.affectation_id === targetAffectation.affectation_id) {
      return;
    }

    // Show confirmation modal
    setSwapTarget(targetAffectation);
    setShowSwapModal(true);
  };

  // Confirm swap and call API
  const confirmSwap = async () => {
    if (!draggedProf || !swapTarget) return;

    try {
      setSwapping(true);

      // Call permuter API
      const result = await permuterAffectations(
        draggedProf.affectation_id,
        swapTarget.affectation_id
      );

      console.log('✅ Permutation réussie:', result);

      // Close modal
      setShowSwapModal(false);
      setSwapTarget(null);
      setDraggedProf(null);

      // Reload affectations
      await loadAffectations();
    } catch (error) {
      console.error('❌ Error swapping professors:', error);

      // Close modal first
      setShowSwapModal(false);
      setSwapTarget(null);
      setDraggedProf(null);

      // Show beautiful error notification
      setErrorMessage(error.message || 'Erreur lors de la permutation');
      setShowError(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    } finally {
      setSwapping(false);
    }
  };

  // Cancel swap
  const cancelSwap = () => {
    setShowSwapModal(false);
    setSwapTarget(null);
    setDraggedProf(null);
  };

  // Delete all affectations
  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      await deleteAllAffectations();

      // Close modal
      setShowDeleteAllModal(false);

      // Reload affectations (will be empty)
      await loadAffectations();

      console.log('✅ Toutes les affectations ont été supprimées');
    } catch (error) {
      console.error('❌ Error deleting affectations:', error);

      // Close modal first
      setShowDeleteAllModal(false);

      // Show error notification
      setErrorMessage(error.message || 'Erreur lors de la suppression');
      setShowError(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    } finally {
      setDeleting(false);
    }
  };

  // Filter affectations by search query
  const filteredAffectations = () => {
    if (!searchQuery.trim()) return affectations;

    const query = searchQuery.toLowerCase();
    return affectations.filter(aff => {
      const teacherName = getTeacherName(aff.code_smartex_ens).toLowerCase();
      const teacherCode = aff.code_smartex_ens.toString();

      return teacherName.includes(query) || teacherCode.includes(query);
    });
  };

  // Group affectations by selected criteria
  const groupedAffectations = () => {
    const filtered = filteredAffectations();
    if (!filtered.length) return {};

    const grouped = {};
    filtered.forEach(aff => {
      let key;
      if (groupBy === 'jour') {
        key = `Jour ${aff.jour} - ${aff.date_examen}`;
      } else if (groupBy === 'enseignant') {
        key = getTeacherName(aff.code_smartex_ens);
      } else if (groupBy === 'salle') {
        key = aff.cod_salle || 'Sans salle';
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(aff);
    });

    return grouped;
  };

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Aucune session sélectionnée</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez sélectionner une session</p>
        </div>
      </div>
    );
  }

  const grouped = groupedAffectations();
  const groupKeys = Object.keys(grouped);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <Header
        title="Liste des Affectations"
        subtitle={
          <>
            {affectations.length > 0 && (
              <>
                <span className="ml-0 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  {affectations.length} total
                </span>
                {searchQuery && filteredAffectations().length !== affectations.length && (
                  <span className="ml-2 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                    {filteredAffectations().length} filtrées
                  </span>
                )}
              </>
            )}
          </>
        }
        actions={
          <>
            {/* Delete All Button */}
            {affectations.length > 0 && (
              <Button
                variant="danger"
                icon={Trash}
                onClick={() => setShowDeleteAllModal(true)}
              >
                Supprimer tout
              </Button>
            )}
          </>
        }
      />

      {/* Group By Selector and Search */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          {/* Group By Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Grouper par:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGroupBy('jour')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${groupBy === 'jour'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                📅 Jour
              </button>
              <button
                onClick={() => setGroupBy('enseignant')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${groupBy === 'enseignant'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                👤 Enseignant
              </button>
              <button
                onClick={() => setGroupBy('salle')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${groupBy === 'salle'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                🏫 Salle
              </button>
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div>
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou code enseignant..."
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {loading ? (
          /* Skeleton Loading State */
          <div className="space-y-6">
            {[1, 2].map((groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                {/* Group Header Skeleton */}
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-300 rounded w-48"></div>
                    <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[1, 2, 3, 4].map((rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <div className="h-5 bg-gray-200 rounded w-32"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-28"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-28"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : affectations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center text-gray-400">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-xl font-semibold text-gray-600">Aucune affectation</p>
              <p className="text-sm text-gray-400 mt-2">
                Générez des affectations depuis la page Optimisation
              </p>
            </div>
          </div>
        ) : filteredAffectations().length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center text-gray-400">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-xl font-semibold text-gray-600">Aucun résultat trouvé</p>
              <p className="text-sm text-gray-400 mt-2">
                Aucune affectation ne correspond à "<span className="font-semibold text-gray-500">{searchQuery}</span>"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Effacer la recherche
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map(groupKey => (
              <div key={groupKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">{groupKey}</h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {grouped[groupKey].length} affectations
                    </span>
                  </div>
                </div>

                {/* Drag & Drop Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">💡 Astuce:</span> Glissez-déposez le nom d'un enseignant sur un autre pour échanger leurs affectations
                  </p>
                </div>

                {/* Affectations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enseignant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Heure
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Séance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enseignant Responsable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grouped[groupKey].map((affectation) => (
                        <tr
                          key={affectation.affectation_id}
                          className={`hover:bg-gray-50 transition-colors ${selectedAffectation?.affectation_id === affectation.affectation_id
                            ? 'bg-blue-50'
                            : ''
                            }`}
                          onClick={() => setSelectedAffectation(affectation)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedProf && draggedProf.affectation_id !== affectation.affectation_id) {
                              e.currentTarget.classList.add('bg-green-50', 'ring-2', 'ring-green-400');
                            }
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-green-50', 'ring-2', 'ring-green-400');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-green-50', 'ring-2', 'ring-green-400');
                            handleDrop(affectation);
                          }}
                        >
                          {/* Code Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {affectation.code_smartex_ens}
                            </span>
                          </td>

                          {/* Draggable Professor Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="flex items-center cursor-grab active:cursor-grabbing hover:bg-blue-50 p-2 rounded-lg transition-all"
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedProf(affectation);
                                e.currentTarget.classList.add('opacity-50');
                              }}
                              onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-50');
                              }}
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mr-3 flex-shrink-0 bg-blue-100 text-blue-600">
                                {getInitials(affectation.prenom_ens, affectation.nom_ens)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getTeacherName(affectation.code_smartex_ens)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {affectation.email_ens || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{affectation.date_examen}</div>
                            <div className="text-xs text-gray-500">
                              {affectation.h_debut} - {affectation.h_fin}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {affectation.seance}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {affectation.cod_salle || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {currentSession?.libelle_session || 'Session'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="inline-block px-3 py-1 bg-red-50 rounded-lg">
                              <span className="text-sm font-medium text-red-600">
                                {affectation.enseignant ? getTeacherName(affectation.enseignant) : '-'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Confirmation Modal */}
      <SwapConfirmationModal
        isOpen={showSwapModal}
        onClose={cancelSwap}
        onConfirm={confirmSwap}
        sourceAffectation={draggedProf}
        targetAffectation={swapTarget}
        getTeacherName={getTeacherName}
        loading={swapping}
      />

      {/* Error Toast Notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-lg shadow-2xl border-l-4 border-red-500 p-4 max-w-md">
            <div className="flex items-start gap-3">
              {/* Error Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Error Content */}
              <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Erreur lors de la permutation
                </h3>
                <p className="text-sm text-gray-600">
                  {errorMessage}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowError(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-shrink-width"></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        title="⚠️ Supprimer toutes les affectations"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer <strong>toutes les affectations</strong> ?
            </p>
            <p className="text-sm text-red-600 mt-2 font-semibold">
              ⚠️ Cette action est irréversible !
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDeleteAllModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={deleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 rounded-lg font-medium transition-colors"
            >
              {deleting ? 'Suppression...' : 'Supprimer Tout'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AffectationsListScreen;
