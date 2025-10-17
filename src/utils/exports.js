// Utilitaires pour l'export de données

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.log('Aucune donnée à exporter')
    return
  }

  // Récupérer les en-têtes
  const headers = Object.keys(data[0])
  
  // Créer les lignes CSV
  const csvContent = [
    headers.join(','), // En-têtes
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Créer et télécharger le fichier
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  console.log('✅ Export CSV réussi:', filename)
}

export const exportToJSON = (data, filename) => {
  if (!data) {
    console.log('Aucune donnée à exporter')
    return
  }

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  console.log('✅ Export JSON réussi:', filename)
}

export const exportToPDF = (title, content) => {
  // Simulation d'export PDF
  console.log('📄 Export PDF:', title)
  console.log(`Export PDF de "${title}" en cours...\n\nCette fonctionnalité nécessite une librairie PDF comme jsPDF ou html2pdf.`)
}

export const printContent = () => {
  window.print()
  console.log('🖨️ Impression lancée')
}

// Utilitaire pour l'import de fichiers
export const importFromFile = (acceptedTypes = '.csv,.json') => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = acceptedTypes
    
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) {
        reject('Aucun fichier sélectionné')
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target.result
          
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content)
            resolve({ type: 'json', data, filename: file.name })
          } else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n')
            const headers = lines[0].split(',')
            const data = lines.slice(1).map(line => {
              const values = line.split(',')
              const obj = {}
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim()
              })
              return obj
            })
            resolve({ type: 'csv', data, filename: file.name })
          } else {
            reject('Format de fichier non supporté')
          }
        } catch (error) {
          reject('Erreur lors de la lecture du fichier: ' + error.message)
        }
      }
      
      reader.onerror = () => reject('Erreur lors de la lecture du fichier')
      reader.readAsText(file)
    }
    
    input.click()
  })
}

// Notification système - Removed (only console logs now)
export const showNotification = (title, message, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${title} - ${message}`)
}
