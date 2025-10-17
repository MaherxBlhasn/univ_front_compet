
const SwapConfirmationModal = ({ isOpen, onClose, onConfirm, sourceAffectation, targetAffectation, getTeacherName, loading }) => {
  if (!isOpen || !sourceAffectation || !targetAffectation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h2 className="text-2xl font-bold text-white">Confirmer la permutation</h2>
            </div>
            {!loading && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Vous êtes sur le point d'échanger les affectations entre deux enseignants. Veuillez vérifier les détails ci-dessous :
          </p>

          <div className="space-y-6">
            {/* Source Affectation */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {sourceAffectation.code_smartex_ens.toString().slice(-2)}
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-semibold">ENSEIGNANT 1</p>
                  <p className="text-lg font-bold text-gray-900">{getTeacherName(sourceAffectation.code_smartex_ens)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Date</p>
                  <p className="text-gray-900 font-semibold">{sourceAffectation.date_examen}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Horaire</p>
                  <p className="text-gray-900 font-semibold">{sourceAffectation.h_debut} - {sourceAffectation.h_fin}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Séance</p>
                  <p className="text-gray-900 font-semibold">{sourceAffectation.seance}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Salle</p>
                  <p className="text-gray-900 font-semibold">{sourceAffectation.cod_salle || 'Non assignée'}</p>
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            {/* Target Affectation */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                  {targetAffectation.code_smartex_ens.toString().slice(-2)}
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-semibold">ENSEIGNANT 2</p>
                  <p className="text-lg font-bold text-gray-900">{getTeacherName(targetAffectation.code_smartex_ens)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Date</p>
                  <p className="text-gray-900 font-semibold">{targetAffectation.date_examen}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Horaire</p>
                  <p className="text-gray-900 font-semibold">{targetAffectation.h_debut} - {targetAffectation.h_fin}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Séance</p>
                  <p className="text-gray-900 font-semibold">{targetAffectation.seance}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Salle</p>
                  <p className="text-gray-900 font-semibold">{targetAffectation.cod_salle || 'Non assignée'}</p>
                </div>
              </div>
            </div>

            {/* Result Preview */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 mb-2">Après la permutation :</p>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>
                      <strong>{getTeacherName(sourceAffectation.code_smartex_ens)}</strong> sera affecté(e) au créneau du{' '}
                      <strong>{targetAffectation.date_examen}</strong> de <strong>{targetAffectation.h_debut} - {targetAffectation.h_fin}</strong>
                    </li>
                    <li>
                      <strong>{getTeacherName(targetAffectation.code_smartex_ens)}</strong> sera affecté(e) au créneau du{' '}
                      <strong>{sourceAffectation.date_examen}</strong> de <strong>{sourceAffectation.h_debut} - {sourceAffectation.h_fin}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Permutation en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmer la permutation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapConfirmationModal;
