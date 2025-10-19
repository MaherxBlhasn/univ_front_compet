import { useState, useEffect, useRef } from 'react';
import { Trash, RefreshCw, Calendar } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { fetchAffectations, permuterAffectations, fetchEnseignants, deleteAllAffectations } from '../services/api';
import Header from '@components/Layout/Header';
import Button from '@components/Common/Button';
import SwapConfirmationModal from '../components/Common/SwapConfirmationModal';
import Modal from '../components/Common/Modal';
import Pagination from '@components/Common/Pagination';
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
  const [selectedForSwap, setSelectedForSwap] = useState(null); // For click-to-swap alternative
  const [modalSource, setModalSource] = useState(null); // Stable copy for modal
  const [modalTarget, setModalTarget] = useState(null); // Stable copy for modal
  const [groupPagination, setGroupPagination] = useState({}); // Pagination state for each group
  
  // Refs for date sections to enable scrolling
  const dateRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const dateScrollRef = useRef(null);
  const enseignantScrollRef = useRef(null);
  const salleScrollRef = useRef(null);
  const dragScrollInterval = useRef(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (currentSession?.id_session) {
      loadAffectations();
    }
  }, [currentSession]);

  // Reset quick access scroll position when groupBy changes
  useEffect(() => {
    // Scroll the main container to top
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    
    // Reset horizontal scroll for quick access sections
    setTimeout(() => {
      if (dateScrollRef.current) {
        dateScrollRef.current.scrollLeft = 0;
      }
      if (enseignantScrollRef.current) {
        enseignantScrollRef.current.scrollLeft = 0;
      }
      if (salleScrollRef.current) {
        salleScrollRef.current.scrollLeft = 0;
      }
    }, 100);
  }, [groupBy]);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, []);

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

  // Check if swap is allowed between two affectations and return reason if not
  const getSwapValidation = (aff1, aff2) => {
    if (!aff1 || !aff2) {
      return { valid: false, reason: 'Données manquantes' };
    }
    
    // Same affectation
    if (aff1.affectation_id === aff2.affectation_id) {
      return { valid: false, reason: 'Impossible d\'échanger une affectation avec elle-même' };
    }
    
    // Same teacher
    if (aff1.code_smartex_ens === aff2.code_smartex_ens) {
      return { 
        valid: false, 
        reason: `Impossible d'échanger : même enseignant (${getTeacherName(aff1.code_smartex_ens)})` 
      };
    }
    
    // Different sessions
    if (aff1.id_session !== aff2.id_session) {
      return { 
        valid: false, 
        reason: 'Impossible d\'échanger : les affectations ne sont pas dans la même session' 
      };
    }
    
    // Same room AND same time slot
    if (
      aff1.cod_salle === aff2.cod_salle &&
      aff1.date_examen === aff2.date_examen &&
      aff1.h_debut === aff2.h_debut &&
      aff1.h_fin === aff2.h_fin
    ) {
      return { 
        valid: false, 
        reason: `Impossible d'échanger : même salle (${aff1.cod_salle}) et même créneau (${aff1.date_examen} ${aff1.h_debut}-${aff1.h_fin})` 
      };
    }
    
    return { valid: true };
  };

  // Simple check for backwards compatibility
  const canSwap = (aff1, aff2) => {
    return getSwapValidation(aff1, aff2).valid;
  };

  // Handle drop - show confirmation modal
  const handleDrop = (targetAffectation) => {
    console.log('🎯 handleDrop called', { 
      draggedProf: draggedProf?.code_smartex_ens, 
      target: targetAffectation?.code_smartex_ens 
    });
    
    if (!draggedProf || !targetAffectation) {
      console.warn('⚠️ Invalid drop: missing draggedProf or targetAffectation');
      return;
    }
    
    if (draggedProf.affectation_id === targetAffectation.affectation_id) {
      console.warn('⚠️ Cannot swap with self');
      return;
    }

    // Validate swap with detailed reason
    const validation = getSwapValidation(draggedProf, targetAffectation);
    console.log('🔍 Validation result:', validation);
    
    if (!validation.valid) {
      console.warn('⚠️ Swap not allowed:', validation.reason);
      console.log('📢 Setting error message and showing toast');
      
      // Show detailed error message
      setErrorMessage(validation.reason);
      setShowError(true);
      
      console.log('✅ Error state set:', { 
        errorMessage: validation.reason, 
        showError: true 
      });
      
      setTimeout(() => {
        console.log('⏱️ Auto-hiding error toast');
        setShowError(false);
      }, 5000);
      
      // Clear drag state
      setDraggedProf(null);
      return;
    }

    console.log('✅ Opening swap modal', { 
      from: draggedProf.code_smartex_ens, 
      to: targetAffectation.code_smartex_ens 
    });

    // Store stable copies for modal to prevent glitching
    setModalSource(draggedProf);
    setModalTarget(targetAffectation);
    setSwapTarget(targetAffectation);
    
    // Show modal after ensuring state is set
    setTimeout(() => {
      setShowSwapModal(true);
    }, 50);
  };

  // Confirm swap and call API
  const confirmSwap = async () => {
    if (!modalSource || !modalTarget) {
      console.error('❌ Missing modal source or target');
      return;
    }

    try {
      setSwapping(true);

      // Call permuter API using stable copies
      const result = await permuterAffectations(
        modalSource.affectation_id,
        modalTarget.affectation_id
      );

      console.log('✅ Permutation réussie:', result);

      // Close modal and clear all states
      setShowSwapModal(false);
      setSwapTarget(null);
      setDraggedProf(null);
      setModalSource(null);
      setModalTarget(null);

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
    console.log('🚫 Swap cancelled');
    setShowSwapModal(false);
    setSwapTarget(null);
    setDraggedProf(null);
    setModalSource(null);
    setModalTarget(null);
  };

  // Auto-scroll during drag - improved version
  const handleDragMove = (e) => {
    if (!scrollContainerRef.current || !draggedProf) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZone = 80; // pixels from edge to trigger scroll
    const scrollSpeed = 3; // Reduced from 10 to 3 for slower, smoother scroll
    
    // Mouse position relative to viewport
    const mouseY = e.clientY;
    
    // Determine if we should scroll and in which direction
    let shouldScrollUp = mouseY < rect.top + scrollZone && container.scrollTop > 0;
    let shouldScrollDown = mouseY > rect.bottom - scrollZone && 
                           container.scrollTop < container.scrollHeight - container.clientHeight;
    
    // Stop scrolling if not in scroll zone
    if (!shouldScrollUp && !shouldScrollDown) {
      stopAutoScroll();
      return;
    }
    
    // Start scrolling only if not already scrolling
    if (!isScrolling.current) {
      isScrolling.current = true;
      
      const scroll = () => {
        if (!draggedProf || !scrollContainerRef.current) {
          stopAutoScroll();
          return;
        }
        
        const container = scrollContainerRef.current;
        
        if (shouldScrollUp && container.scrollTop > 0) {
          container.scrollTop -= scrollSpeed;
        } else if (shouldScrollDown && container.scrollTop < container.scrollHeight - container.clientHeight) {
          container.scrollTop += scrollSpeed;
        }
        
        // Continue scrolling
        dragScrollInterval.current = requestAnimationFrame(scroll);
      };
      
      scroll();
    }
  };

  // Stop auto-scroll
  const stopAutoScroll = () => {
    if (dragScrollInterval.current) {
      cancelAnimationFrame(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
    isScrolling.current = false;
  };

  // Click-to-swap alternative method
  const handleSelectForSwap = (affectation) => {
    if (!selectedForSwap) {
      // First selection
      setSelectedForSwap(affectation);
    } else if (selectedForSwap.affectation_id === affectation.affectation_id) {
      // Clicked same row - deselect
      setSelectedForSwap(null);
    } else {
      // Second selection - validate with detailed reason
      const validation = getSwapValidation(selectedForSwap, affectation);
      if (!validation.valid) {
        console.warn('⚠️ Click-to-swap not allowed:', validation.reason);
        setErrorMessage(validation.reason);
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        setSelectedForSwap(null);
        return;
      }
      
      // Initiate swap
      setModalSource(selectedForSwap);
      setModalTarget(affectation);
      setDraggedProf(selectedForSwap);
      setSwapTarget(affectation);
      setTimeout(() => {
        setShowSwapModal(true);
      }, 50);
      setSelectedForSwap(null);
    }
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

  // Initialize pagination for each group
  const initializeGroupPagination = (groupKeys) => {
    const newPagination = {};
    groupKeys.forEach(key => {
      if (!groupPagination[key]) {
        newPagination[key] = { currentPage: 1, itemsPerPage: 10 };
      } else {
        newPagination[key] = groupPagination[key];
      }
    });
    return newPagination;
  };

  // Get paginated data for a specific group
  const getPaginatedGroupData = (groupKey, groupData) => {
    const pagination = groupPagination[groupKey] || { currentPage: 1, itemsPerPage: 10 };
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return groupData.slice(startIndex, endIndex);
  };

  // Handle page change for a specific group
  const handleGroupPageChange = (groupKey, newPage) => {
    setGroupPagination(prev => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        currentPage: newPage
      }
    }));
  };

  // Handle items per page change for a specific group
  const handleGroupItemsPerPageChange = (groupKey, newItemsPerPage) => {
    setGroupPagination(prev => ({
      ...prev,
      [groupKey]: {
        currentPage: 1,
        itemsPerPage: newItemsPerPage
      }
    }));
  };

  // Reset group pagination when groupBy changes
  useEffect(() => {
    setGroupPagination({});
  }, [groupBy, searchQuery]);

  // Get all unique dates for quick access
  const getAllDates = () => {
    if (groupBy !== 'jour') return [];
    
    const dates = [...new Set(affectations.map(aff => aff.date_examen))].sort();
    return dates.map(date => {
      const jour = affectations.find(aff => aff.date_examen === date)?.jour;
      return {
        date,
        jour,
        key: `Jour ${jour} - ${date}`,
        count: affectations.filter(aff => aff.date_examen === date).length
      };
    });
  };

  // Get all unique enseignants for quick access
  const getAllEnseignants = () => {
    if (groupBy !== 'enseignant') return [];
    
    const enseignantCodes = [...new Set(affectations.map(aff => aff.code_smartex_ens))].sort();
    return enseignantCodes.map(code => {
      const name = getTeacherName(code);
      return {
        code,
        name,
        key: name,
        count: affectations.filter(aff => aff.code_smartex_ens === code).length
      };
    });
  };

  // Get all unique salles for quick access
  const getAllSalles = () => {
    if (groupBy !== 'salle') return [];
    
    const salles = [...new Set(affectations.map(aff => aff.cod_salle || 'Sans salle'))].sort();
    return salles.map(salle => {
      return {
        salle,
        key: salle || 'Sans salle',
        count: affectations.filter(aff => (aff.cod_salle || 'Sans salle') === salle).length
      };
    });
  };

  // Parse date from DD/MM/YYYY or YYYY-MM-DD format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Check if it's DD/MM/YYYY format
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(year, month - 1, day);
    }
    
    // Otherwise try YYYY-MM-DD format
    return new Date(dateString);
  };

  // Scroll to specific section with natural smooth scrolling
  const scrollToSection = (sectionKey) => {
    const element = dateRefs.current[sectionKey];
    const container = scrollContainerRef.current;
    
    if (element && container) {
      const elementTop = element.offsetTop;
      const containerTop = container.offsetTop;
      const targetScroll = elementTop - containerTop - 100; // 100px offset from top
      const startScroll = container.scrollTop;
      const distance = targetScroll - startScroll;
      
      // Custom slow scroll animation - 2 seconds duration
      const duration = 2000; // 2 seconds for very smooth, visible scroll
      const startTime = performance.now();
      
      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out function for natural feel
        const easeInOutCubic = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const currentScroll = startScroll + (distance * easeInOutCubic);
        container.scrollTop = currentScroll;
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
    }
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
  const groupKeys = Object.keys(grouped).sort();

  // Initialize pagination for all groups
  useEffect(() => {
    const initialized = initializeGroupPagination(groupKeys);
    setGroupPagination(initialized);
  }, [groupKeys.join(',')]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
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
            {/* Refresh Button */}
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={loadAffectations}
            >
              Actualiser
            </Button>
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

        {/* Quick Access - For Dates */}
        {groupBy === 'jour' && getAllDates().length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Accès rapide aux dates
                <span className="text-gray-500 font-normal">
                  ({getAllDates().length} date(s) disponible(s))
                </span>
              </label>
            </div>
            <div className="w-4/5 overflow-hidden">
              <div 
                ref={dateScrollRef}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {getAllDates().map((dateInfo) => {
                  const dateObj = parseDate(dateInfo.date);
                  const displayDate = dateObj && !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : dateInfo.date;

                  return (
                    <button
                      key={dateInfo.key}
                      onClick={() => scrollToSection(dateInfo.key)}
                      className="px-4 py-2 rounded-lg transition-all text-sm font-medium border-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md whitespace-nowrap flex-shrink-0"
                    >
                      {displayDate} <span className="font-bold">({dateInfo.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Access - For Enseignants */}
        {groupBy === 'enseignant' && getAllEnseignants().length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Accès rapide aux enseignants
                <span className="text-gray-500 font-normal">
                  ({getAllEnseignants().length} enseignant(s))
                </span>
              </label>
            </div>
            <div className="w-4/5 overflow-hidden">
              <div 
                ref={enseignantScrollRef}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {getAllEnseignants().map((ensInfo) => (
                  <button
                    key={ensInfo.key}
                    onClick={() => scrollToSection(ensInfo.key)}
                    className="px-4 py-2 rounded-lg transition-all text-sm font-medium border-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-md whitespace-nowrap flex-shrink-0"
                  >
                    {ensInfo.name} <span className="font-bold">({ensInfo.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Access - For Salles */}
        {groupBy === 'salle' && getAllSalles().length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Accès rapide aux salles
                <span className="text-gray-500 font-normal">
                  ({getAllSalles().length} salle(s))
                </span>
              </label>
            </div>
            <div className="w-4/5 overflow-hidden">
              <div 
                ref={salleScrollRef}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {getAllSalles().map((salleInfo) => (
                  <button
                    key={salleInfo.key}
                    onClick={() => scrollToSection(salleInfo.key)}
                    className="px-4 py-2 rounded-lg transition-all text-sm font-medium border-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-md whitespace-nowrap flex-shrink-0"
                  >
                    {salleInfo.salle} <span className="font-bold">({salleInfo.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-auto bg-gray-50 p-8 w-full"
      >
        {loading ? (
          /* Skeleton Loading State */
          <div className="space-y-6 max-w-full">
            {[1, 2].map((groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse w-full">
                {/* Group Header Skeleton */}
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-300 rounded w-48"></div>
                    <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
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
          <div className="space-y-6 max-w-full">
            {groupKeys.map(groupKey => (
              <div 
                key={groupKey} 
                ref={el => dateRefs.current[groupKey] = el}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full"
              >
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 mx-4 mt-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">💡 Deux méthodes pour échanger:</span>
                    </p>
                  </div>
                  <div className="ml-8 space-y-1">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">1. Glisser-déposer:</span> Faites glisser le nom d'un enseignant sur un autre (scroll automatique près des bords)
                    </p>
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">2. Clic:</span> Cliquez sur "↔️ Échanger" sur deux lignes successivement
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Les lignes en <span className="font-semibold">rouge</span> ne peuvent pas être permutées (même enseignant, même créneau, etc.)
                    </p>
                  </div>
                </div>

                {/* Pagination for this group */}
                {grouped[groupKey].length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Pagination
                      currentPage={groupPagination[groupKey]?.currentPage || 1}
                      totalPages={Math.ceil(grouped[groupKey].length / (groupPagination[groupKey]?.itemsPerPage || 10))}
                      totalItems={grouped[groupKey].length}
                      itemsPerPage={groupPagination[groupKey]?.itemsPerPage || 10}
                      onPageChange={(page) => handleGroupPageChange(groupKey, page)}
                      onItemsPerPageChange={(items) => handleGroupItemsPerPageChange(groupKey, items)}
                      showItemsPerPage={true}
                      itemsPerPageOptions={[5, 10, 25, 50]}
                    />
                  </div>
                )}

                {/* Affectations Table */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Enseignant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Date & Heure
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Séance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Salle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Session
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Enseignant Responsable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedGroupData(groupKey, grouped[groupKey]).map((affectation) => {
                        const isValidDropTarget = draggedProf && canSwap(draggedProf, affectation);
                        const isDragging = draggedProf?.affectation_id === affectation.affectation_id;
                        const isSelected = selectedForSwap?.affectation_id === affectation.affectation_id;
                        const isValidSwapWithSelected = selectedForSwap && canSwap(selectedForSwap, affectation);
                        
                        // Determine row style based on drag state
                        let rowClassName = 'transition-all ';
                        if (isDragging) {
                          rowClassName += 'opacity-50 '; // Currently being dragged
                        } else if (draggedProf && draggedProf.affectation_id !== affectation.affectation_id) {
                          // Show color indicator when something is being dragged
                          if (isValidDropTarget) {
                            rowClassName += 'bg-green-50 ring-1 ring-green-300 '; // Can swap
                          } else {
                            rowClassName += 'bg-red-50 ring-1 ring-red-300 '; // Cannot swap
                          }
                        } else if (selectedForSwap && selectedForSwap.affectation_id !== affectation.affectation_id) {
                          // Show color indicator when something is selected for click-to-swap
                          if (isValidSwapWithSelected) {
                            rowClassName += 'bg-green-50 ring-1 ring-green-300 '; // Can swap
                          } else {
                            rowClassName += 'bg-red-50 ring-1 ring-red-300 '; // Cannot swap
                          }
                        } else if (selectedAffectation?.affectation_id === affectation.affectation_id) {
                          rowClassName += 'bg-blue-50 ';
                        } else if (isSelected) {
                          rowClassName += 'bg-yellow-100 ring-2 ring-yellow-500 '; // Selected row more visible
                        } else {
                          rowClassName += 'hover:bg-gray-50 ';
                        }
                        
                        return (
                          <tr
                            key={affectation.affectation_id}
                            className={rowClassName}
                            onClick={() => setSelectedAffectation(affectation)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              handleDragMove(e);
                              // Enhance the hover effect
                              if (draggedProf && draggedProf.affectation_id !== affectation.affectation_id) {
                                if (isValidDropTarget) {
                                  e.currentTarget.classList.add('ring-2', 'ring-green-500', 'shadow-lg');
                                  e.currentTarget.classList.remove('ring-1', 'ring-green-300');
                                } else {
                                  e.currentTarget.classList.add('ring-2', 'ring-red-500', 'shadow-lg');
                                  e.currentTarget.classList.remove('ring-1', 'ring-red-300');
                                }
                              }
                            }}
                            onDragLeave={(e) => {
                              // Restore original ring style
                              if (isValidDropTarget) {
                                e.currentTarget.classList.remove('ring-2', 'ring-green-500', 'shadow-lg');
                                e.currentTarget.classList.add('ring-1', 'ring-green-300');
                              } else if (draggedProf && draggedProf.affectation_id !== affectation.affectation_id) {
                                e.currentTarget.classList.remove('ring-2', 'ring-red-500', 'shadow-lg');
                                e.currentTarget.classList.add('ring-1', 'ring-red-300');
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              stopAutoScroll();
                              // Restore original ring style
                              e.currentTarget.classList.remove('ring-2', 'ring-green-500', 'ring-red-500', 'shadow-lg');
                              
                              // Always call handleDrop - it will show error if invalid
                              handleDrop(affectation);
                              
                              // Restore the ring based on validity
                              if (isValidDropTarget) {
                                e.currentTarget.classList.add('ring-1', 'ring-green-300');
                              } else {
                                e.currentTarget.classList.add('ring-1', 'ring-red-300');
                              }
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
                                stopAutoScroll();
                                // Delay clearing draggedProf to prevent modal glitching
                                setTimeout(() => {
                                  // Only clear if modal isn't showing
                                  if (!showSwapModal) {
                                    setDraggedProf(null);
                                  }
                                }, 100);
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
                          {/* Click-to-Swap Button */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectForSwap(affectation);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {isSelected ? '✓ Sélectionné' : '↔️ Échanger'}
                            </button>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Confirmation Modal */}
      {showSwapModal && modalSource && modalTarget && (
        <SwapConfirmationModal
          isOpen={showSwapModal}
          onClose={cancelSwap}
          onConfirm={confirmSwap}
          sourceAffectation={modalSource}
          targetAffectation={modalTarget}
          getTeacherName={getTeacherName}
          loading={swapping}
        />
      )}

      {/* Error Toast Notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
          {console.log('🎨 Rendering error toast with message:', errorMessage)}
          <div className="bg-white rounded-lg shadow-2xl border-l-4 border-red-500 p-5 max-w-lg">
            <div className="flex items-start gap-3">
              {/* Error Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>

              {/* Error Content */}
              <div className="flex-1 pt-0.5">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  🚫 Permutation impossible
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {errorMessage}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Veuillez vérifier les conditions d'échange
                </div>
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

            {/* Progress bar for auto-dismiss */}
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
