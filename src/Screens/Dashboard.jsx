import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Clock, TrendingUp, Award,
  CheckCircle, AlertTriangle, Target, Activity
} from 'lucide-react';
import Header from '@components/Layout/Header';
import Card from '@components/Common/Card';
import Button from '@components/Common/Button';
import LoadingSpinner from '@components/Common/LoadingSpinner';
import { fetchSessionStatistics } from '../services/api';
import { useSession } from '../contexts/SessionContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentSession } = useSession();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentSession?.id_session) {
      loadStatistics();
    } else {
      setLoading(false);
    }
  }, [currentSession]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await fetchSessionStatistics(currentSession.id_session);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <Header
          title="Tableau de bord"
          subtitle="Sélectionnez une session pour voir les statistiques"
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md text-center">
            <div className="py-8">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune session sélectionnée</h3>
              <p className="text-sm text-gray-600">Veuillez sélectionner une session pour afficher les statistiques</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const hasAffectations = statistics?.has_affectations;
  const baseStats = statistics?.base_statistics;
  const optStats = statistics?.optimization_statistics;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        title="Tableau de bord"
        subtitle={`${currentSession.libelle_session} - ${currentSession.AU}`}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* Unified Session Info & Global Score Bar */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-2">{currentSession.libelle_session}</h2>
              <div className="flex items-center gap-4 text-blue-100 flex-wrap">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {currentSession.date_debut} → {currentSession.date_fin}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Semestre {currentSession.Semestre}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {currentSession.type_session}
                </span>
              </div>
            </div>
            {hasAffectations && optStats?.score_global && (
              <div className="flex items-center gap-6 bg-white/95 rounded-2xl px-6 py-5 shadow-lg border border-white/40 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                  <TrendingUp size={30} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold text-gray-800">
                      {optStats.score_global.score}
                    </span>
                    <span className="text-xl text-gray-400">/{optStats.score_global.max_score}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Score Global</div>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                    <span className="text-sm font-bold">{optStats.score_global.appreciation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Base Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Enseignants Surveillants"
            value={baseStats?.enseignants.surveillants || 0}
            subtitle={`sur ${baseStats?.enseignants.total || 0} total`}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="Créneaux"
            value={baseStats?.creneaux.total || 0}
            subtitle={`${baseStats?.creneaux.salles || 0} salles`}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Voeux"
            value={baseStats?.voeux.total || 0}
            subtitle={`Moy: ${baseStats?.voeux.moyenne_par_enseignant || 0} par ens.`}
            color="purple"
          />
          <StatCard
            icon={Activity}
            label="Affectations"
            value={optStats?.charge_enseignants.total_affectations || 0}
            subtitle={hasAffectations ? 'Générées' : 'Non générées'}
            color="orange"
          />
        </div>

        {hasAffectations && optStats ? (
          <>
            {/* Main Gauges - 4 Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <CircularGauge
                label="Respect des Voeux"
                value={optStats.voeux.taux_respect}
                max={100}
                color="blue"
                icon={CheckCircle}
                details={`${optStats.voeux.voeux_respectes}/${optStats.voeux.total_voeux} respectés`}
              />
              <CircularGauge
                label="Équité entre Grades"
                value={optStats.equite_grades.taux_equite}
                max={100}
                color="green"
                icon={Award}
                details={`${optStats.equite_grades.grades_equitables}/${optStats.equite_grades.total_grades} grades équitables`}
              />
              <CircularGauge
                label="Couverture Salles"
                value={optStats.couverture_creneaux.taux_couverture}
                max={100}
                color="purple"
                icon={Target}
                details={`${optStats.couverture_creneaux.salles_bien_couvertes}/${optStats.couverture_creneaux.total_salles} salles`}
              />
              <CircularGauge
                label="Présence Responsables"
                value={optStats.responsables_salles.taux_presence_jour}
                max={100}
                color="orange"
                icon={Users}
                details={`${optStats.responsables_salles.responsables_presents_jour}/${optStats.responsables_salles.total_responsabilites} présents`}
              />
            </div>

            {/* Detailed Statistics - 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
              {/* Charge Enseignants */}
              <Card title="📊 Charge des Enseignants" className="shadow-lg hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{optStats.charge_enseignants.charge_min}</div>
                      <div className="text-xs text-gray-600 mt-1">Min</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{optStats.charge_enseignants.charge_moyenne}</div>
                      <div className="text-xs text-gray-600 mt-1">Moyenne</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{optStats.charge_enseignants.charge_max}</div>
                      <div className="text-xs text-gray-600 mt-1">Max</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <LinearProgressBar
                      label="Enseignants affectés"
                      current={optStats.charge_enseignants.total_enseignants - optStats.charge_enseignants.enseignants_sans_affectation}
                      total={optStats.charge_enseignants.total_enseignants}
                      color="blue"
                    />
                  </div>
                </div>
              </Card>

              {/* Dispersion Data - NEW! */}
              <Card title="🔀 Dispersion des Surveillances" className="shadow-lg hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Plusieurs séances/jour</span>
                      <Activity size={20} className="text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {optStats.dispersion.enseignants_plusieurs_seances_par_jour}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">enseignants concernés</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {optStats.dispersion.seances_consecutives}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Consécutives</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {optStats.dispersion.seances_espacees}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Espacées</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quotas par Grade */}
              <Card title="📈 Analyse des Quotas" className="shadow-lg hover:shadow-xl transition-shadow">
                {optStats.quotas.quota_table_exists ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                        <div className="text-xl font-bold text-blue-600">{optStats.quotas.ecart_total_quota_grade}</div>
                        <div className="text-xs text-gray-600 mt-1">Écart Grade</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                        <div className="text-xl font-bold text-green-600">{optStats.quotas.ecart_total_quota_majoritaire}</div>
                        <div className="text-xs text-gray-600 mt-1">Écart Maj.</div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(optStats.quotas.stats_par_grade || {}).map(([grade, stats]) => (
                        <div key={grade} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-50 rounded">
                          <span className="font-semibold text-gray-700">{grade}</span>
                          <span className="text-gray-600">Moy: {stats.realise_moyen}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Table quota non remplie</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Grades Repartition */}
            <Card title="👥 Répartition par Grade" className="shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {Object.entries(baseStats?.enseignants.par_grade || {}).map(([code, gradeInfo]) => {
                  const optGrade = optStats.equite_grades.details_par_grade[code];
                  return (
                    <div key={code} className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {code}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                          optGrade?.equitable 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        }`}>
                          {optGrade?.equitable ? '✓ OK' : `⚠ ${optGrade?.ecart || 0}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-1" title={gradeInfo.grade}>
                        {gradeInfo.grade}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Quota</span>
                          <span className="font-bold text-purple-600">{gradeInfo.quota}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Enseignants</span>
                          <span className="font-bold text-blue-600">{gradeInfo.count}</span>
                        </div>
                        {optGrade && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Charge moy</span>
                              <span className="font-bold text-green-600">{optGrade.charge_moyenne}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Min: {optGrade.charge_min}</span>
                                <span>Max: {optGrade.charge_max}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        ) : (
          <Card className="text-center py-16 max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={48} className="text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune affectation générée</h3>
              <p className="text-gray-600 mb-6 text-lg">
                Vous devez générer les affectations pour voir les statistiques d'optimisation
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">📋 Étapes à suivre :</h4>
              <ol className="text-left text-gray-700 space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Assurez-vous que les créneaux sont configurés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Vérifiez que les enseignants ont saisi leurs voeux</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Cliquez sur le bouton ci-dessous pour générer</span>
                </li>
              </ol>
            </div>

            <Button 
              variant="primary" 
              size="lg"
              icon={Target}
              onClick={() => navigate('/affectation')}
              className="text-lg px-8 py-4"
            >
              Générer les Affectations
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

// Circular Gauge Component
const CircularGauge = ({ label, value, max, color, icon: Icon, details }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colorClasses = {
    blue: { 
      stroke: 'stroke-blue-500', 
      text: 'text-blue-600', 
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50'
    },
    green: { 
      stroke: 'stroke-green-500', 
      text: 'text-green-600', 
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      lightBg: 'bg-green-50'
    },
    purple: { 
      stroke: 'stroke-purple-500', 
      text: 'text-purple-600', 
      bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      lightBg: 'bg-purple-50'
    },
    orange: { 
      stroke: 'stroke-orange-500', 
      text: 'text-orange-600', 
      bg: 'bg-gradient-to-br from-orange-500 to-red-600',
      lightBg: 'bg-orange-50'
    },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col items-center justify-center p-5">
        <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
          <Icon size={28} className="text-white" />
        </div>
        
        <div className="relative w-44 h-44 mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="88"
              cy="88"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className={colors.stroke}
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 - ((percentage / 100) * 2 * Math.PI * 70)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-2">
              <div className={`text-3xl font-bold ${colors.text} leading-none`}>
                {value.toFixed(1)}
              </div>
              <div className={`text-xs font-semibold ${colors.text} opacity-70 mt-0.5`}>%</div>
            </div>
          </div>
        </div>
        
        <h3 className="text-sm font-bold text-gray-900 mb-2 px-3 w-full break-words">{label}</h3>
        <p className="text-xs text-gray-600 px-3 w-full break-words leading-relaxed">{details}</p>
      </div>
    </Card>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  
  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon size={32} className="opacity-80" />
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm opacity-90 font-medium">{label}</div>
        {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
      </div>
    </Card>
  );
};

// Linear Progress Bar Component
const LinearProgressBar = ({ label, current, total, color }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{current}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard