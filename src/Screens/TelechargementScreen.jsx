import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Header from '@components/Layout/Header';

const TelechargementScreen = () => {
  const { currentSession } = useSession();
  
  // États pour PDFs
  const [pdfConvocations, setPdfConvocations] = useState([]);
  const [pdfAffectations, setPdfAffectations] = useState([]);
  
  // États pour CSVs
  const [csvConvocations, setCsvConvocations] = useState([]);
  const [csvAffectations, setCsvAffectations] = useState([]);
  
  // Sélections
  const [selectedPdfConvocations, setSelectedPdfConvocations] = useState([]);
  const [selectedCsvConvocations, setSelectedCsvConvocations] = useState([]);
  const [selectedPdfAffectations, setSelectedPdfAffectations] = useState([]);
  const [selectedCsvAffectations, setSelectedCsvAffectations] = useState([]);
  
  // Format actif (pdf ou csv)
  const [activeFormat, setActiveFormat] = useState('pdf');
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState({ 
    pdfConvocations: false, 
    csvConvocations: false,
    pdfAffectation: false, 
    csvAffectation: false 
  });
  const [message, setMessage] = useState(null);

  // ========== ÉTAPE 1 : GÉNÉRATION ==========
  
  const handleGeneratePdfConvocations = async () => {
    if (!currentSession) return;
    
    setGenerating({ ...generating, pdfConvocations: true });
    setMessage(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/generate_convocations/${currentSession.id_session}`,
        { method: 'GET' }
      );
      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✓ ${data.nombre_enseignants} convocations PDF générées !`
        });
        await loadPdfConvocations();
      } else {
        setMessage({
          type: 'error',
          text: `Erreur : ${data.error}`
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur'
      });
    } finally {
      setGenerating({ ...generating, pdfConvocations: false });
    }
  };

  const handleGenerateCsvConvocations = async () => {
    if (!currentSession) return;
    
    setGenerating({ ...generating, csvConvocations: true });
    setMessage(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/csv/convocations/${currentSession.id_session}`,
        { method: 'GET' }
      );
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `✓ ${data.convocations_count} convocations CSV générées !`
        });
        await loadCsvConvocations();
      } else {
        setMessage({
          type: 'error',
          text: `Erreur : ${data.error}`
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur'
      });
    } finally {
      setGenerating({ ...generating, csvConvocations: false });
    }
  };

  const handleGeneratePdfAffectation = async () => {
    if (!currentSession) return;
    
    setGenerating({ ...generating, pdfAffectation: true });
    setMessage(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/pdf/${currentSession.id_session}`,
        { method: 'GET' }
      );
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `✓ PDF d'affectation créé : ${data.filename}`
        });
        await loadPdfAffectations();
      } else {
        setMessage({
          type: 'error',
          text: `Erreur : ${data.error}`
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur'
      });
    } finally {
      setGenerating({ ...generating, pdfAffectation: false });
    }
  };

  const handleGenerateCsvAffectations = async () => {
    if (!currentSession) return;
    
    setGenerating({ ...generating, csvAffectation: true });
    setMessage(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/csv/affectations/${currentSession.id_session}`,
        { method: 'GET' }
      );
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `✓ ${data.files_count} fichiers CSV générés (global + ${data.jours_count} jours) !`
        });
        await loadCsvAffectations();
      } else {
        setMessage({
          type: 'error',
          text: `Erreur : ${data.error}`
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion au serveur'
      });
    } finally {
      setGenerating({ ...generating, csvAffectation: false });
    }
  };

  const handleGenerateAll = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      await Promise.all([
        fetch(`http://localhost:5000/api/affectations/generate_convocations/${currentSession.id_session}`),
        fetch(`http://localhost:5000/api/affectations/csv/convocations/${currentSession.id_session}`),
        fetch(`http://localhost:5000/api/affectations/pdf/${currentSession.id_session}`),
        fetch(`http://localhost:5000/api/affectations/csv/affectations/${currentSession.id_session}`)
      ]);
      
      setMessage({
        type: 'success',
        text: '✓ Tous les fichiers (PDFs + CSVs) ont été générés !'
      });
      
      await loadAllFiles();
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de la génération'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== ÉTAPE 2 : LISTING ==========
  
  const loadPdfConvocations = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/convocations/list/${currentSession.id_session}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPdfConvocations(data.files || []);
      } else {
        setPdfConvocations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des convocations PDF:', error);
      setPdfConvocations([]);
    }
  };

  const loadCsvConvocations = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/csv/convocations/list/${currentSession.id_session}`
      );
      const data = await response.json();
      
      if (data.success) {
        setCsvConvocations(data.files || []);
      } else {
        setCsvConvocations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des convocations CSV:', error);
      setCsvConvocations([]);
    }
  };

  const loadPdfAffectations = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(
        'http://localhost:5000/api/affectations/list-pdfs'
      );
      const data = await response.json();
      
      if (data.success) {
        const filtered = (data.files || []).filter(f => 
          f.download_url && f.download_url.includes(`session_${currentSession.id_session}`)
        );
        setPdfAffectations(filtered);
      } else {
        setPdfAffectations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des affectations PDF:', error);
      setPdfAffectations([]);
    }
  };

  const loadCsvAffectations = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/affectations/csv/affectations/list/${currentSession.id_session}`
      );
      const data = await response.json();
      
      if (data.success) {
        setCsvAffectations(data.files || []);
      } else {
        setCsvAffectations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des affectations CSV:', error);
      setCsvAffectations([]);
    }
  };

  const loadAllFiles = async () => {
    if (!currentSession) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadPdfConvocations(),
        loadCsvConvocations(),
        loadPdfAffectations(),
        loadCsvAffectations()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et quand la session change
  useEffect(() => {
    if (currentSession) {
      loadAllFiles();
    }
  }, [currentSession]);

  // ========== ÉTAPE 3 : TÉLÉCHARGEMENT ==========
  // ========== ÉTAPE 3 : TÉLÉCHARGEMENT ==========
  
  const handleDownloadSelection = async () => {
    if (!currentSession) return;
    
    const files = [
      ...selectedPdfConvocations.map(filename => ({
        type: 'convocation',
        format: 'pdf',
        filename
      })),
      ...selectedCsvConvocations.map(filename => ({
        type: 'convocation',
        format: 'csv',
        filename
      })),
      ...selectedPdfAffectations.map(filename => ({
        type: 'affectation',
        format: 'pdf',
        filename
      })),
      ...selectedCsvAffectations.map(filename => ({
        type: 'affectation',
        format: 'csv',
        filename
      }))
    ];

    if (files.length === 0) {
      setMessage({
        type: 'error',
        text: 'Aucun fichier sélectionné'
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(
        'http://localhost:5000/api/affectations/download-multiple',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: currentSession.id_session, 
            files 
          })
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `selection_session_${currentSession.id_session}.zip`;
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
          text: `✓ ${files.length} fichier(s) téléchargé(s) avec succès !`
        });
        
        // Réinitialiser toutes les sélections
        setSelectedPdfConvocations([]);
        setSelectedCsvConvocations([]);
        setSelectedPdfAffectations([]);
        setSelectedCsvAffectations([]);
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
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!currentSession) return;
    
    const files = [
      ...pdfConvocations.map(f => ({ type: 'convocation', format: 'pdf', filename: f.filename })),
      ...csvConvocations.map(f => ({ type: 'convocation', format: 'csv', filename: f.filename })),
      ...pdfAffectations.map(f => ({ type: 'affectation', format: 'pdf', filename: f.filename })),
      ...csvAffectations.map(f => ({ type: 'affectation', format: 'csv', filename: f.filename }))
    ];

    if (files.length === 0) {
      setMessage({
        type: 'error',
        text: 'Aucun fichier disponible'
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(
        'http://localhost:5000/api/affectations/download-multiple',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: currentSession.id_session, 
            files 
          })
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `tous_fichiers_session_${currentSession.id_session}.zip`;
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
          text: `✓ ${files.length} fichier(s) téléchargé(s) avec succès !`
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
      setLoading(false);
    }
  };

  // ========== ÉTAPE 4 : GESTION DES SÉLECTIONS ==========
  
  // PDF Convocations
  const togglePdfConvocationSelection = (filename) => {
    setSelectedPdfConvocations(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const selectAllPdfConvocations = () => {
    setSelectedPdfConvocations(prev =>
      prev.length === pdfConvocations.length ? [] : pdfConvocations.map(f => f.filename)
    );
  };

  // CSV Convocations
  const toggleCsvConvocationSelection = (filename) => {
    setSelectedCsvConvocations(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const selectAllCsvConvocations = () => {
    setSelectedCsvConvocations(prev =>
      prev.length === csvConvocations.length ? [] : csvConvocations.map(f => f.filename)
    );
  };

  // PDF Affectations
  const togglePdfAffectationSelection = (filename) => {
    setSelectedPdfAffectations(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const selectAllPdfAffectations = () => {
    setSelectedPdfAffectations(prev =>
      prev.length === pdfAffectations.length ? [] : pdfAffectations.map(f => f.filename)
    );
  };

  // CSV Affectations
  const toggleCsvAffectationSelection = (filename) => {
    setSelectedCsvAffectations(prev =>
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const selectAllCsvAffectations = () => {
    setSelectedCsvAffectations(prev =>
      prev.length === csvAffectations.length ? [] : csvAffectations.map(f => f.filename)
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  // Compteurs totaux
  const totalSelected = 
    selectedPdfConvocations.length + 
    selectedCsvConvocations.length + 
    selectedPdfAffectations.length + 
    selectedCsvAffectations.length;
  
  const totalFiles = 
    pdfConvocations.length + 
    csvConvocations.length + 
    pdfAffectations.length + 
    csvAffectations.length;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header - même style que AffectationScreen */}
      <Header
        title="Téléchargement des Documents"
        subtitle={`Session: ${currentSession.libelle_session}`}
        actions={
          <>
            <button
              onClick={handleDownloadSelection}
              disabled={loading || totalSelected === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Sélection ({totalSelected})</span>
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={loading || totalFiles === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Tout ({totalFiles})</span>
            </button>
          </>
        }
      />

      {/* Message Notification */}
      {message && (
        <div className={`mx-8 mt-4 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="font-medium flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {loading && !generating.convocations && !generating.affectation ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section 1: Génération */}
            {/* ========== SECTION 1 : GÉNÉRATION DES DOCUMENTS ========== */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Génération des Documents
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Créez les PDFs et CSVs pour la session en cours
                    </p>
                  </div>
                </div>
                
                {/* Bouton Tout Générer */}
                <button
                  onClick={handleGenerateAll}
                  disabled={Object.values(generating).some(v => v)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-2.5 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tout Générer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PDF Convocations */}
                <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold shadow-md">
                      PDF
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Convocations PDF</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Un PDF personnalisé pour chaque enseignant
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePdfConvocations}
                    disabled={generating.pdfConvocations}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {generating.pdfConvocations ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Générer PDF</span>
                      </>
                    )}
                  </button>
                  
                  {pdfConvocations.length > 0 && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                      <p className="text-xs text-green-700 font-bold text-center flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {pdfConvocations.length} fichier(s) prêt(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* CSV Convocations */}
                <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 hover:border-green-400 hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
                      CSV
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Convocations CSV</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Un CSV personnalisé pour chaque enseignant
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateCsvConvocations}
                    disabled={generating.csvConvocations}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:from-green-300 disabled:to-emerald-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {generating.csvConvocations ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Génération...</span>
                      </>
                    ) : (
                      <span className="text-sm">Générer CSV</span>
                    )}
                  </button>
                  
                  {csvConvocations.length > 0 && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 font-semibold text-center">
                        ✓ {csvConvocations.length} fichier(s) prêt(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* PDF Affectations */}
                <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold shadow-md">
                      PDF
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Affectation PDF</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Document global de toutes les affectations
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePdfAffectation}
                    disabled={generating.pdfAffectation}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {generating.pdfAffectation ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Générer PDF</span>
                      </>
                    )}
                  </button>
                  
                  {pdfAffectations.length > 0 && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                      <p className="text-xs text-green-700 font-bold text-center flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {pdfAffectations.length} fichier(s) prêt(s)
                      </p>
                    </div>
                  )}
                </div>

                {/* CSV Affectations */}
                <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 hover:border-green-400 hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
                      CSV
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Affectation CSV</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      CSV global + fichiers par jour
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateCsvAffectations}
                    disabled={generating.csvAffectation}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:from-green-300 disabled:to-emerald-400 disabled:cursor-not-allowed rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {generating.csvAffectation ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Générer CSV</span>
                      </>
                    )}
                  </button>
                  
                  {csvAffectations.length > 0 && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                      <p className="text-xs text-green-700 font-bold text-center flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {csvAffectations.length} fichier(s) prêt(s)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========== SECTION 2 : FICHIERS DISPONIBLES (PDF/CSV) ========== */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              {/* Header avec Toggle Format */}
              <div className="bg-white border-b-2 border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Documents Disponibles
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Sélectionnez et téléchargez vos fichiers
                        <span className="font-bold text-green-700">({totalFiles} total)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle PDF/CSV avec meilleur style */}
                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-xl p-2 shadow-inner">
                  <button
                    onClick={() => setActiveFormat('pdf')}
                    className={`flex-1 px-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 ${
                      activeFormat === 'pdf'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-transparent text-gray-600 hover:bg-white/80 hover:text-blue-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Format PDF</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeFormat === 'pdf' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pdfConvocations.length + pdfAffectations.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveFormat('csv')}
                    className={`flex-1 px-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 ${
                      activeFormat === 'csv'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                        : 'bg-transparent text-gray-600 hover:bg-white/80 hover:text-green-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Format CSV</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeFormat === 'csv' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {csvConvocations.length + csvAffectations.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Content basé sur le format actif */}
              <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50/50 to-white">
                {activeFormat === 'pdf' ? (
                  <>
                    {/* PDF Convocations */}
                    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Convocations PDF
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                            {pdfConvocations.length}
                          </span>
                        </h3>
                        {pdfConvocations.length > 0 && (
                          <button
                            onClick={selectAllPdfConvocations}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            {selectedPdfConvocations.length === pdfConvocations.length ? '✕ Désélectionner' : '✓ Tout sélectionner'}
                          </button>
                        )}
                      </div>
                      {pdfConvocations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-semibold">Aucune convocation PDF générée</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pdfConvocations.map((file) => {
                            const isSelected = selectedPdfConvocations.includes(file.filename);
                            return (
                              <label key={file.filename} className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'}`}>
                                <input type="checkbox" checked={isSelected} onChange={() => togglePdfConvocationSelection(file.filename)} className="w-5 h-5 text-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 cursor-pointer"/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{file.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    <p className="text-xs text-gray-500 font-semibold">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>PDF</div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* PDF Affectations */}
                    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Affectations PDF
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                            {pdfAffectations.length}
                          </span>
                        </h3>
                        {pdfAffectations.length > 0 && (
                          <button
                            onClick={selectAllPdfAffectations}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            {selectedPdfAffectations.length === pdfAffectations.length ? '✕ Désélectionner' : '✓ Tout sélectionner'}
                          </button>
                        )}
                      </div>
                      {pdfAffectations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm font-semibold">Aucune affectation PDF générée</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {pdfAffectations.map((file) => {
                            const isSelected = selectedPdfAffectations.includes(file.filename);
                            return (
                              <label key={file.filename} className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'}`}>
                                <input type="checkbox" checked={isSelected} onChange={() => togglePdfAffectationSelection(file.filename)} className="w-5 h-5 text-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 cursor-pointer"/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{file.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    <p className="text-xs text-gray-500 font-semibold">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>PDF</div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* CSV Convocations */}
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Convocations CSV
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            {csvConvocations.length}
                          </span>
                        </h3>
                        {csvConvocations.length > 0 && (
                          <button
                            onClick={selectAllCsvConvocations}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            {selectedCsvConvocations.length === csvConvocations.length ? '✕ Désélectionner' : '✓ Tout sélectionner'}
                          </button>
                        )}
                      </div>
                      {csvConvocations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-semibold">Aucune convocation CSV générée</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {csvConvocations.map((file) => {
                            const isSelected = selectedCsvConvocations.includes(file.filename);
                            return (
                              <label key={file.filename} className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-102'}`}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleCsvConvocationSelection(file.filename)} className="w-5 h-5 text-green-600 rounded-md focus:ring-2 focus:ring-green-500 cursor-pointer"/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>{file.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    <p className="text-xs text-gray-500 font-semibold">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>CSV</div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CSV Affectations */}
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Affectations CSV
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            {csvAffectations.length}
                          </span>
                        </h3>
                        {csvAffectations.length > 0 && (
                          <button
                            onClick={selectAllCsvAffectations}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            {selectedCsvAffectations.length === csvAffectations.length ? '✕ Désélectionner' : '✓ Tout sélectionner'}
                          </button>
                        )}
                      </div>
                      {csvAffectations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-semibold">Aucune affectation CSV générée</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {csvAffectations.map((file) => {
                            const isSelected = selectedCsvAffectations.includes(file.filename);
                            return (
                              <label key={file.filename} className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-102'}`}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleCsvAffectationSelection(file.filename)} className="w-5 h-5 text-green-600 rounded-md focus:ring-2 focus:ring-green-500 cursor-pointer"/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>{file.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                    <p className="text-xs text-gray-500 font-semibold">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>CSV</div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelechargementScreen;
