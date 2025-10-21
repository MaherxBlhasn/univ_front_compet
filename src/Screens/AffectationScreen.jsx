import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { checkSessionData, runOptimization } from '../services/api';
import { showNotification } from '../utils/exports';
import { useNavigate } from 'react-router-dom';
import Header from '@components/Layout/Header';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const AffectationScreen = () => {
  const { currentSession } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkData, setCheckData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  useEffect(() => {
    if (currentSession) {
      loadCheckData();
    }
  }, [currentSession]);

  const loadCheckData = async () => {
    if (!currentSession?.id_session) return;

    try {
      setLoading(true);
      const data = await checkSessionData(currentSession.id_session);
      setCheckData(data);
      console.log('📊 Données de vérification:', data);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentSession?.id_session) return;

    try {
      setGenerating(true);
      setOptimizationResult(null);

      const result = await runOptimization(currentSession.id_session, {
        save: true,
        clear: true,
        generate_files: true,
        generate_stats: true
      });
      console.log('📊 Résultat de l\'optimisation:', result);

      setOptimizationResult(result);

      if (result.success && result.status === 'OPTIMAL') {
        showNotification(
          'success',
          `Affectations générées avec succès ! ${result.affectations} affectations créées en ${result.solve_time.toFixed(2)}s`
        );
      } else if (result.success === false || result.infeasibility_diagnostic) {
        showNotification(
          'error',
          'Impossible de générer les affectations. Le problème est infaisable.'
        );
      }

    } catch (error) {
      console.error('Erreur génération:', error);
      showNotification('error', 'Erreur lors de la génération: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Aucune session sélectionnée</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez sélectionner une session pour générer les affectations</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const canGenerate = checkData?.status === 'yes';

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <Header
        title="Affectation des Surveillances"
        subtitle={`Session: ${currentSession.libelle_session}`}
        actions={
          <>
            <Button
              onClick={loadCheckData}
              variant="outline"
              disabled={loading || generating}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualiser</span>
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              variant={canGenerate ? "primary" : "secondary"}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {generating ? (
                  <LoadingSpinner size="small" text={null} />
                ) : canGenerate ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </span>
              <span>{generating ? 'Génération...' : canGenerate ? 'Générer' : 'Incomplet'}</span>
            </Button>
          </>
        }
      />

      {/* Info note below header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="px-3 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-md shadow-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>La génération peut durer jusqu'à 10 minutes. Plus la génération dure, meilleur est le résultat.</span>
        </div>
      </div>

      {/* Status Cards */}
      {checkData && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Vœux Card */}
            <div className={`p-4 rounded-lg ${checkData.has_voeux ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${checkData.has_voeux ? 'text-blue-600' : 'text-red-600'}`}>
                Total Vœux
              </p>
              <p className={`text-2xl font-bold ${checkData.has_voeux ? 'text-blue-900' : 'text-red-900'}`}>
                {checkData.details.voeux_count}
              </p>
            </div>

            {/* Enseignants Card */}
            <div className={`p-4 rounded-lg ${checkData.has_enseignants ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${checkData.has_enseignants ? 'text-green-600' : 'text-red-600'}`}>
                Enseignants
              </p>
              <p className={`text-2xl font-bold ${checkData.has_enseignants ? 'text-green-900' : 'text-red-900'}`}>
                {checkData.details.enseignants_count}
              </p>
            </div>

            {/* Créneaux Card */}
            <div className={`p-4 rounded-lg ${checkData.has_creneaux ? 'bg-purple-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${checkData.has_creneaux ? 'text-purple-600' : 'text-red-600'}`}>
                Créneaux
              </p>
              <p className={`text-2xl font-bold ${checkData.has_creneaux ? 'text-purple-900' : 'text-red-900'}`}>
                {checkData.details.creneaux_count}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {checkData && (
          <div className="space-y-6">
            {/* Status Alert */}
            {canGenerate ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-green-900">Toutes les données sont présentes !</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Vous pouvez maintenant générer les affectations de surveillance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-900">Données incomplètes</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Veuillez compléter les données manquantes avant de générer :
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                      {!checkData.has_enseignants && (
                        <li>Ajoutez des enseignants participant à la surveillance</li>
                      )}
                      {!checkData.has_voeux && (
                        <li>Importez ou ajoutez des vœux de non-surveillance</li>
                      )}
                      {!checkData.has_creneaux && (
                        <li>Créez des créneaux d'examen</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Affectations Results */}
            {optimizationResult ? (
              <div className="space-y-6">
                {optimizationResult.status === 'OPTIMAL' ? (
                  <>
                    {/* Success Summary Card */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-green-900 text-lg">Optimisation réussie !</h3>
                          <p className="text-sm text-green-700 mt-1">Statut: <span className="font-semibold">{optimizationResult.status}</span></p>
                          <div className="grid grid-cols-3 gap-6 mt-4">
                            <div>
                              <p className="text-sm text-green-700 font-medium">Affectations générées</p>
                              <p className="text-3xl font-bold text-green-900 mt-1">{optimizationResult.affectations}</p>
                            </div>
                            <div>
                              <p className="text-sm text-green-700 font-medium">Temps de résolution</p>
                              <p className="text-3xl font-bold text-green-900 mt-1">{optimizationResult.solve_time.toFixed(2)}s</p>
                            </div>
                            <div>
                              <p className="text-sm text-green-700 font-medium">Enregistrées en BD</p>
                              <p className="text-3xl font-bold text-green-900 mt-1">{optimizationResult.saved_to_db}</p>
                            </div>
                          </div>

                          {/* Beautiful CTA Button */}
                          <div className="mt-6 pt-6 border-t border-green-200">
                            <button
                              onClick={() => navigate('/affectations')}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 group"
                            >
                              <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span className="text-lg">Voir les affectations générées</span>
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    {optimizationResult.statistics && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Vœux */}
                        {optimizationResult.statistics.voeux && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">❤️</span>
                              Respect des Vœux
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total vœux</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.voeux.total}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Respectés</span>
                                <span className="font-bold text-green-600">{optimizationResult.statistics.voeux.respectes}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Violés</span>
                                <span className="font-bold text-red-600">{optimizationResult.statistics.voeux.violes}</span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Taux de respect</span>
                                  <span className="text-2xl font-bold text-green-600">{optimizationResult.statistics.voeux.taux_respect}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Équité */}
                        {optimizationResult.statistics.equite && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">⚖️</span>
                              Équité entre Grades
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total grades</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.equite.total_grades}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Équitables</span>
                                <span className="font-bold text-green-600">{optimizationResult.statistics.equite.grades_equitables}</span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Taux d'équité</span>
                                  <span className="text-2xl font-bold text-blue-600">{optimizationResult.statistics.equite.taux_equite}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Couverture */}
                        {optimizationResult.statistics.couverture && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">📊</span>
                              Couverture des Créneaux
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total créneaux</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.couverture.total}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Couverts</span>
                                <span className="font-bold text-green-600">{optimizationResult.statistics.couverture.couverts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Déficitaires</span>
                                <span className="font-bold text-orange-600">{optimizationResult.statistics.couverture.deficitaires}</span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Taux de couverture</span>
                                  <span className="text-2xl font-bold text-purple-600">{optimizationResult.statistics.couverture.taux_couverture.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Responsables */}
                        {optimizationResult.statistics.responsables && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">👤</span>
                              Responsables de Salle (Surveillants)
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total responsables (Surveillants)</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.responsables.total}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Présents</span>
                                <span className="font-bold text-green-600">{optimizationResult.statistics.responsables.presents}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Absents</span>
                                <span className="font-bold text-gray-500">{optimizationResult.statistics.responsables.absents}</span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Taux de présence</span>
                                  <span className="text-2xl font-bold text-indigo-600">{optimizationResult.statistics.responsables.taux_presence.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dispersion */}
                        {optimizationResult.statistics.dispersion && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">📅</span>
                              Dispersion des Affectations
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Affectations multiples</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.dispersion.total_multi}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Consécutives</span>
                                <span className="font-bold text-green-600">{optimizationResult.statistics.dispersion.consecutives}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Espacées</span>
                                <span className="font-bold text-blue-600">{optimizationResult.statistics.dispersion.espacees}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Charges */}
                        {optimizationResult.statistics.charges && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <span className="text-lg">👥</span>
                              Charge des Enseignants
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total enseignants</span>
                                <span className="font-bold text-gray-900">{optimizationResult.statistics.charges.total_enseignants}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Sans affectation</span>
                                <span className="font-bold text-orange-600">{optimizationResult.statistics.charges.sans_affectation}</span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">Taux d'utilisation</span>
                                  <span className="text-2xl font-bold text-teal-600">
                                    {((optimizationResult.statistics.charges.total_enseignants - optimizationResult.statistics.charges.sans_affectation) / optimizationResult.statistics.charges.total_enseignants * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}


                  </>
                ) : (
                  /* Infeasibility Diagnostic */
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 text-lg mb-2">Problème infaisable</h3>
                        <p className="text-sm text-red-700 mb-4">
                          Statut: <span className="font-semibold">{optimizationResult.status}</span>
                          {optimizationResult.solve_time && ` | Temps: ${optimizationResult.solve_time.toFixed(2)}s`}
                        </p>

                        {optimizationResult.infeasibility_diagnostic && (
                          <div className="space-y-4">
                            {/* Feasibility Status */}
                            <div className="bg-white rounded-lg border border-red-200 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-red-900">Analyse de faisabilité</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${optimizationResult.infeasibility_diagnostic.is_feasible
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {optimizationResult.infeasibility_diagnostic.is_feasible ? 'Faisable' : 'Infaisable'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Total requis</p>
                                  <p className="text-xl font-bold text-gray-900">{optimizationResult.infeasibility_diagnostic.total_required}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Capacité totale</p>
                                  <p className="text-xl font-bold text-gray-900">{optimizationResult.infeasibility_diagnostic.total_capacity}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Déficit</p>
                                  <p className={`text-xl font-bold ${optimizationResult.infeasibility_diagnostic.deficit > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                    {optimizationResult.infeasibility_diagnostic.deficit}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Reasons */}
                            {optimizationResult.infeasibility_diagnostic.reasons &&
                              optimizationResult.infeasibility_diagnostic.reasons.length > 0 && (
                                <div className="bg-white rounded-lg border border-red-200 p-4">
                                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Raisons de l'infaisabilité
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                    {optimizationResult.infeasibility_diagnostic.reasons.map((reason, idx) => (
                                      <li key={idx}>
                                        {typeof reason === 'string'
                                          ? reason
                                          : reason.message || reason.description || JSON.stringify(reason)
                                        }
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* Grades Analysis */}
                            {optimizationResult.infeasibility_diagnostic.grades_analysis &&
                              optimizationResult.infeasibility_diagnostic.grades_analysis.length > 0 && (
                                <div className="bg-white rounded-lg border border-orange-200 p-4">
                                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Analyse par grade
                                  </h4>
                                  <div className="space-y-2 max-h-64 overflow-auto">
                                    {optimizationResult.infeasibility_diagnostic.grades_analysis.map((grade, idx) => (
                                      <div key={idx} className="text-sm bg-orange-50 rounded p-3 border border-orange-100">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-medium text-orange-900">{grade.grade || grade.name}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded ${grade.deficit > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {grade.deficit > 0 ? `Déficit: ${grade.deficit}` : 'OK'}
                                          </span>
                                        </div>
                                        <div className="flex gap-4 text-xs text-orange-700">
                                          <span>Requis: {grade.required || grade.total_required || 0}</span>
                                          <span>Disponible: {grade.available || grade.total_capacity || 0}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Suggestions */}
                            {optimizationResult.infeasibility_diagnostic.suggestions &&
                              optimizationResult.infeasibility_diagnostic.suggestions.length > 0 && (
                                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <span className="text-lg">💡</span>
                                    Suggestions
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                                    {optimizationResult.infeasibility_diagnostic.suggestions.map((suggestion, idx) => (
                                      <li key={idx}>
                                        {typeof suggestion === 'string'
                                          ? suggestion
                                          : suggestion.description || suggestion.message || JSON.stringify(suggestion)
                                        }
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Placeholder when no results */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center text-gray-400">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xl font-semibold text-gray-600">Résultats de l'optimisation</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {canGenerate
                      ? "Cliquez sur 'Générer' pour créer les affectations automatiquement"
                      : "Complétez les données requises pour activer la génération"}
                  </p>

                  {/* Blue info card in placeholder */}
                  <div className="mt-4 max-w-3xl mx-auto">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-lg px-6 py-5 shadow-sm">
                      <strong className="block font-semibold text-base mb-3">Information sur la génération</strong>
                      <p className="mb-3">La génération peut durer jusqu'à <strong>10 minutes</strong>. Plus la génération dure, meilleur est le résultat.</p>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="font-semibold mb-2">Les résultats respectent les contraintes suivantes :</p>
                        <ol className="space-y-2 text-xs leading-relaxed">
                          <li>
                            <strong>1. ÉQUITÉ ABSOLUE PAR GRADE :</strong> Tous les enseignants d'un même grade ont EXACTEMENT le même nombre de surveillances (différence = 0).
                          </li>
                          <li>
                            <strong>2. PARTICIPATION UNIVERSELLE :</strong> Tous les enseignants avec participe_surveillance=1 ont AU MOINS 1 affectation (aucun enseignant à 0).
                          </li>
                          <li>
                            <strong>3. RESPECT DES QUOTAS :</strong> Les quotas optimaux calculés sont ≤ quotas de grade, garantissant qu'aucun enseignant ne dépasse sa limite.
                          </li>
                          <li>
                            <strong>4. ÉQUILIBRAGE INTER-GRADES :</strong> Distribution équilibrée entre grades (ex: MA à 6/7, VA à 3/4) pour éviter qu'un grade soit à 100% tandis que d'autres sont à 0%.
                          </li>
                          <li>
                            <strong>5. OPTIMISATION DOUCE :</strong> Respect maximum des vœux de non-surveillance, concentration sur minimum de jours, et présence préférentielle des responsables dans leurs salles.
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}




      </div>
    </div>
  );
};

export default AffectationScreen;
