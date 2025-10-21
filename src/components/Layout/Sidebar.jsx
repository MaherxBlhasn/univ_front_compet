import { BarChart3, Calendar, Users, Clock, Heart, Settings, LogOut, UserCheck, HardDrive, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { checkSessionData } from '../../services/api';

const Sidebar = () => {
  const { currentSession, sessions, clearSession } = useSession();
  const navigate = useNavigate();
  const [affectationStatus, setAffectationStatus] = useState(null);

  // Vérifier si on a des sessions
  const hasNoSessions = sessions.length === 0;

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3, path: '/dashboard' },
    { id: 'sessions', label: 'Sessions d\'examens', icon: Calendar, path: '/sessions' },
    {
      id: 'teachers',
      label: 'Enseignants',
      icon: Users,
      path: '/teachers',
      subItems: [
        { id: 'teachers-list', label: 'Liste des enseignants', path: '/teachers' },
        { id: 'quota-dispersion', label: 'Dispersion des quotas', path: '/quota-dispersion' },
        { id: 'absence-responsables', label: 'Absence des Responsables', path: '/absence-responsables', requiresAffectation: true }
      ]
    },
    { id: 'planning', label: 'Plannings', icon: Clock, path: '/planning' },
    { id: 'voeux', label: 'Vœux', icon: Heart, path: '/voeux' },
    {
      id: 'optimization',
      label: 'Optimisation',
      icon: UserCheck,
      path: '/affectation',
      subItems: [
        { id: 'affectation-generation', label: "Lancer l'optimisation", path: '/affectation' },
        { id: 'affectations-list', label: 'Affectations', path: '/affectations' },
        { id: 'telechargement', label: 'Téléchargement', path: '/telechargement' }
      ]
    },
    { id: 'storage', label: 'Consommation mémoire', icon: HardDrive, path: '/storage' },
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' }
  ]

  // Fonction pour charger le statut d'affectation
  const loadAffectationStatus = async () => {
    if (!currentSession?.id_session) {
      setAffectationStatus(null);
      return;
    }

    try {
      const data = await checkSessionData(currentSession.id_session);
      console.log('🔄 Statut affectation mis à jour:', data);
      setAffectationStatus(data);
    } catch (error) {
      console.error('Erreur chargement statut affectation:', error);
      setAffectationStatus(null);
    }
  };

  // Charger le statut initial et quand la session change
  useEffect(() => {
    loadAffectationStatus();
  }, [currentSession]);

  // Écouter les événements de changement de données (import/delete all)
  useEffect(() => {
    const handleDataChanged = () => {
      if (currentSession?.id_session) {
        console.log('📊 Données modifiées - rechargement du statut');
        loadAffectationStatus();
      }
    };

    window.addEventListener('dataDeleted', handleDataChanged);

    return () => {
      window.removeEventListener('dataDeleted', handleDataChanged);
    };
  }, [currentSession]);

  // Fonction appelée quand on clique sur un élément du menu
  const handleMenuClick = () => {
    loadAffectationStatus();
  };

  // Fonction pour déconnecter (retour au sélecteur de session)
  const handleLogout = () => {
    clearSession(); // Efface la session du contexte et localStorage
    navigate('/sessions'); // Redirige vers le sélecteur de session
  };

  // Fonction pour fermer l'application
  const handleCloseApp = () => {
    if (window.api && window.api.closeApp) {
      window.api.closeApp();
    } else {
      window.close();
    }
  };

  return (
    <div className="w-64 lg:w-72 xl:w-80 bg-white border-r border-gray-200 flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl lg:text-2xl">ISI</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base lg:text-lg">DIGITAL ISI</h1>
            <p className="text-xs text-gray-500">Gestion Surveillance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {menuItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <NavItem
              icon={item.icon}
              label={item.label}
              path={item.path}
              isAffectation={item.id === 'optimization'}
              affectationStatus={affectationStatus}
              onMenuClick={handleMenuClick}
            />
            {item.subItems && (
              <div className="ml-3 pl-3 border-l-2 border-gray-200 space-y-0.5">
                {item.subItems.map((subItem) => {
                  const isDisabled = (subItem.requiresAffectation || subItem.id === 'affectations-list' || subItem.id === 'quota-dispersion' || subItem.id === 'telechargement') && affectationStatus?.status !== 'yes';

                  if (isDisabled) {
                    return (
                      <div
                        key={subItem.id}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed opacity-60"
                        title="Données manquantes - Générer les affectations d'abord"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{subItem.label}</span>
                        </div>
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={subItem.id}
                      to={subItem.path}
                      onClick={handleMenuClick}
                    >
                      {({ isActive }) => (
                        <div className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                          ${isActive
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm border border-blue-200'
                            : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                          }
                        `}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{subItem.label}</span>
                          {/* Badge pour Téléchargement */}
                          {subItem.id === 'telechargement' && (
                            <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold rounded-full shadow-md animate-pulse border border-orange-400">
                              📧 Email
                            </span>
                          )}
                          {isActive && subItem.id !== 'telechargement' && (
                            <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 lg:w-11 lg:h-11 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-sm lg:text-base">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Administrateur</p>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
          <button
            onClick={handleCloseApp}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Fermer l'application</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const NavItem = ({ icon: Icon, label, path, isAffectation, affectationStatus, onMenuClick }) => {
  // Générer le badge pour l'affectation
  const getBadgeContent = () => {
    if (!isAffectation || !affectationStatus) {
      // Afficher "Chargement..." pendant le chargement
      if (isAffectation) {
        return {
          text: '...',
          fullText: 'Vérification en cours',
          bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
          textColor: 'text-white',
          borderColor: 'border-gray-300',
          glowColor: '',
          icon: '⏳',
          pulse: false
        };
      }
      return null;
    }

    if (affectationStatus.status === 'yes') {
      return {
        text: 'PRÊT',
        fullText: null,
        details: null,
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        textColor: 'text-white',
        borderColor: 'border-green-400',
        glowColor: 'shadow-lg shadow-green-500/50',
        icon: '✓',
        pulse: true
      };
    }

    const missingCount = [
      !affectationStatus.has_enseignants,
      !affectationStatus.has_voeux,
      !affectationStatus.has_creneaux
    ].filter(Boolean).length;

    const missingItems = [];
    if (!affectationStatus.has_enseignants) missingItems.push('Enseignants');
    if (!affectationStatus.has_voeux) missingItems.push('Vœux');
    if (!affectationStatus.has_creneaux) missingItems.push('Créneaux');

    return {
      text: 'Manquant',
      fullText: null,
      details: null,
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
      textColor: 'text-white',
      borderColor: 'border-red-400',
      glowColor: 'shadow-lg shadow-red-500/50',
      icon: '✕',
      pulse: true
    };
  };

  const badge = getBadgeContent();

  // Déterminer le style de l'item selon le statut
  const getItemStyle = (isActive) => {
    if (!isAffectation) {
      return `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`;
    }

    // Style spécial pour Affectation selon le statut
    if (affectationStatus?.status === 'yes') {
      return `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive
        ? 'bg-green-100 text-green-800 font-bold shadow-md'
        : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold hover:from-green-100 hover:to-emerald-100 border-2 border-green-200'
        }`;
    } else if (affectationStatus) {
      return `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive
        ? 'bg-red-100 text-red-800 font-bold shadow-md'
        : 'bg-gradient-to-r from-red-50 to-red-50 text-red-700 font-semibold hover:from-red-100 hover:to-red-100 border-2 border-red-200'
        }`;
    }

    // Chargement
    return `w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`;
  };

  return (
    <div className="relative group">
      <NavLink
        to={path}
        onClick={onMenuClick}
        className={({ isActive }) => getItemStyle(isActive)}
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="flex-shrink-0" />
          <span className="text-sm lg:text-base">{label}</span>
        </div>

        {/* Badge impressionnant pour l'affectation */}
        {badge && (
          <span className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
            ${badge.bgColor} ${badge.textColor} border-2 ${badge.borderColor}
            ${badge.glowColor} transition-all duration-300
            ${badge.pulse ? 'animate-pulse' : ''}
          `}>
            <span className="text-sm">{badge.icon}</span>
            <span className="hidden lg:inline font-extrabold">{badge.text}</span>
          </span>
        )}
      </NavLink>
    </div>
  );
};


export default Sidebar