import { useState } from 'react';
import { Calendar, Users, Clock, Download, Plus, Upload } from 'lucide-react';
import Header from '@components/Layout/Header';
import StatCard from '@components/Common/StatCard';
import Card from '@components/Common/Card';
import Button from '@components/Common/Button';
import SessionModal from '@components/Common/SessionModal';
import { MOCK_STATS, MOCK_RECENT_ACTIVITIES, MOCK_SESSIONS } from '../data/mockData';
import { importFromFile, showNotification } from '../utils/exports';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const stats = [
    { label: 'Enseignants', value: MOCK_STATS.totalEnseignants, icon: Users, color: 'blue' },
    { label: 'Examens planifiés', value: MOCK_STATS.examensPlannifies, icon: Calendar, color: 'green' },
    { label: 'Salles disponibles', value: MOCK_STATS.totalSalles, icon: Clock, color: 'purple' },
    { label: 'Surveillances', value: MOCK_STATS.totalSurveillances, icon: Clock, color: 'orange' }
  ]

  // Importer des données
  const handleImport = async () => {
    try {
      const result = await importFromFile('.csv,.json');
      showNotification('Succès', `Fichier "${result.filename}" importé avec succès`, 'success');
      console.log('Données importées:', result.data);
    } catch (error) {
      showNotification('Erreur', error, 'error');
    }
  };

  // Créer une nouvelle session
  const handleSaveSession = (sessionData) => {
    const newSession = { ...sessionData, id: sessions.length + 1, nbExamens: 0, nbSalles: 0 };
    setSessions([...sessions, newSession]);
    showNotification('Succès', 'Session créée avec succès', 'success');
    console.log('Nouvelle session:', newSession);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <Header
        title="Tableau de bord"
        subtitle={currentSession ? `Session: ${currentSession.libelle_session}` : "Bienvenue dans votre espace de gestion des surveillances"}
        actions={
          <>
            <Button 
              variant="secondary" 
              size="md" 
              icon={Upload}
              className="hidden sm:inline-flex"
              onClick={handleImport}
            >
              Importer
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              icon={Plus}
              onClick={() => setShowSessionModal(true)}
            >
              Nouvelle session
            </Button>
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Quick Actions */}
          <Card title="Actions rapides">
            <div className="space-y-3">
              <QuickAction
                title="Générer un planning"
                desc="Créer une nouvelle affectation"
                icon={Calendar}
                onClick={() => {
                  navigate('/planning');
                  showNotification('Info', 'Redirection vers Planning', 'info');
                }}
              />
              <QuickAction
                title="Gérer les voeux"
                desc="Consulter les indisponibilités"
                icon={Users}
                onClick={() => {
                  navigate('/teachers');
                  showNotification('Info', 'Redirection vers Enseignants', 'info');
                }}
              />
              <QuickAction
                title="Exporter les données"
                desc="PDF, Excel, CSV"
                icon={Download}
                onClick={handleImport}
              />
            </div>
          </Card>

          {/* Recent Activities */}
          <Card title="Activités récentes" className="col-span-2">
            <div className="space-y-4">
              {MOCK_RECENT_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Modal Session */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSave={handleSaveSession}
      />
    </div>
  )
}

const QuickAction = ({ title, desc, icon: Icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
  >
    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-blue-600" />
    </div>
    <div>
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  </button>
)

export default Dashboard