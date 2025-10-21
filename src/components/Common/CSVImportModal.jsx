import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import Button from './Button'
import * as XLSX from 'xlsx'

const CSVImportModal = ({ isOpen, onClose, onImport, title, description, expectedFields, templateExample, additionalData = {}, showFormat2 = false }) => {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)
  // Fields detected in the uploaded file (used to render preview table)
  const previewFields = Object.keys(preview[0] || {})

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Accepter tous les fichiers sans validation
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file) => {
    const reader = new FileReader()

    // Helper: split a CSV line respecting quoted values
    const splitCSVLine = (line, delimiter = ',') => {
      const result = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          // if next char is also a quote, treat as escaped quote
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
          continue
        }

        if (char === delimiter && !inQuotes) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += char
        }
      }
      result.push(cur.trim())
      // Remove surrounding quotes from each value
      return result.map(v => {
        if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
        return v
      })
    }

    // Déterminer si c'est un fichier Excel ou CSV
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      // Lire comme ArrayBuffer pour les fichiers Excel
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          // Prendre la première feuille
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          console.log('📊 XLSX - Données brutes:', jsonData)

          // Accepter même si moins de 2 lignes
          if (jsonData.length < 1) {
            setPreview([])
            setErrors([])
            return
          }

          // La première ligne est l'en-tête
          const headers = jsonData[0].map(h => String(h).trim())

          console.log('🔍 DEBUG - Colonnes détectées dans le fichier XLSX:', headers)
          console.log('🔍 DEBUG - Colonnes attendues:', expectedFields)

          // Vérifier que tous les champs requis sont présents
          // const missingFields = expectedFields.filter(field => !headers.includes(field))
          // if (missingFields.length > 0) {
          //   setErrors([
          //     `Champs manquants dans le fichier: ${missingFields.join(', ')}`,
          //     ``,
          //     `Colonnes trouvées dans votre fichier: ${headers.join(', ')}`,
          //     ``,
          //     `Assurez-vous que votre fichier contient exactement ces colonnes: ${expectedFields.join(', ')}`
          //   ])
          //   return
          // }

          // Parser les données (limiter à 10 pour l'aperçu)
          const previewData = []
          for (let i = 1; i < Math.min(jsonData.length, 11); i++) {
            const row = {}
            headers.forEach((header, index) => {
              row[header] = jsonData[i][index] !== undefined ? String(jsonData[i][index]).trim() : ''
            })
            previewData.push(row)
          }

          setPreview(previewData)
          setErrors([])
        } catch (error) {
          // Ne pas afficher d'erreur, juste logger
          console.error('Excel parse error:', error)
          setPreview([])
          setErrors([])
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      // Lire comme texte pour les fichiers CSV
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n').filter(line => line.trim())

          // Accepter même si moins de 2 lignes
          if (lines.length < 1) {
            setPreview([])
            setErrors([])
            return
          }

          // Parse header - Support both comma and semicolon and respect quoted fields
          const detectedDelimiter = lines[0].includes(';') ? ';' : ','
          let headers = splitCSVLine(lines[0], detectedDelimiter).map(h => String(h).trim())

          console.log('🔍 DEBUG - Colonnes détectées dans le fichier CSV:', headers)
          console.log('🔍 DEBUG - Colonnes attendues:', expectedFields)

          // Ne plus vérifier les champs manquants - accepter tous les fichiers

          // Parse data rows using the detected delimiter and respecting quotes
          const data = []
          const parseErrors = []

          for (let i = 1; i < Math.min(lines.length, 11); i++) { // Preview first 10 rows
            const values = splitCSVLine(lines[i], detectedDelimiter)
            const row = {}

            headers.forEach((header, index) => {
              row[header] = values[index] !== undefined ? String(values[index]).trim() : ''
            })

            data.push(row)
          }

          setPreview(data)
          setErrors([])
        } catch (error) {
          // Ne pas afficher d'erreur, juste logger
          console.error('CSV parse error:', error)
          setPreview([])
          setErrors([])
        }
      }
      reader.readAsText(file)
    }
  }

  const handleImport = () => {
    // Accepter toujours si un fichier est sélectionné
    if (!file) {
      return
    }

    // Passer le fichier directement au parent qui gérera l'upload et l'import via l'API
    onImport(file)
    handleClose()
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      parseCSV(droppedFile)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              <Upload size={24} className="inline mr-2" />
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          {description && (
            <p className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
              ℹ️ {description}
            </p>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-2">{showFormat2 ? 'Formats attendus :' : 'Format attendu :'}</h3>
            {showFormat2 && (
              <p className="text-sm text-gray-700 mb-3">
                Le fichier CSV peut contenir l'un des formats suivants :
              </p>
            )}

            {/* Format 1 - Blue */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
              <p className="text-sm text-blue-900 font-semibold mb-2">📋 {showFormat2 ? 'Format 1 :' : 'Format :'}</p>
              <code className="block bg-white p-2 rounded text-xs text-blue-800 border border-blue-400">
                {expectedFields.join(', ')}
              </code>
              {templateExample && (
                <div className="mt-2">
                  <p className="text-xs text-blue-700 font-medium mb-1">Exemple :</p>
                  <code className="block bg-white p-2 rounded text-xs text-blue-800 border border-blue-400 overflow-x-auto">
                    {templateExample}
                  </code>
                </div>
              )}
            </div>

            {/* Format 2 - Green - Only show if showFormat2 is true */}
            {showFormat2 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-300">
                <p className="text-sm text-green-900 font-semibold mb-2">📋 OU bien Format 2 :</p>
                <code className="block bg-white p-2 rounded text-xs text-green-800 border border-green-400">
                  Enseignant, Semestre, Session, Jour, Séances
                </code>
                <div className="mt-2">
                  <p className="text-xs text-green-700 font-medium mb-1">Exemple :</p>
                  <code className="block bg-white p-2 rounded text-xs text-green-800 border border-green-400 overflow-x-auto">
                    N.BEN HARIZ,Semestre 1,Partiel,Mardi,S1,S2,S3,S4
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* File upload area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Glissez-déposez votre fichier CSV ici ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-500">Formats acceptés : CSV, XLSX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected file */}
          {file && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Erreurs détectées :</h3>
                  <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Aperçu ({preview.length} premières lignes) :
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0] || {}).map(field => (
                        <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {previewFields.map(field => (
                          <td key={field} className="px-4 py-2 text-sm text-gray-900">
                            {row[field]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!file}
            >
              Importer {preview.length > 0 && `(${preview.length}+ lignes)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CSVImportModal
