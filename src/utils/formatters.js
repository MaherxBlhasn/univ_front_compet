// Utilitaires de formatage

// Formater une date
export const formatDate = (date, format = 'long') => {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('fr-FR')
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toLocaleDateString('fr-FR')
}

// Formater un créneau horaire
export const formatCreneau = (creneau) => {
  return creneau
}

// Formater un nom complet
export const formatFullName = (prenom, nom) => {
  return `${prenom} ${nom}`
}

// Formater un numéro de téléphone
export const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\+216)?(\d{2})(\d{3})(\d{3})/, '+216 $2 $3 $4');
}

// Formater un email
export const formatEmail = (email) => {
  return email.toLowerCase()
}

// Formater un pourcentage
export const formatPercent = (value) => {
  return `${value.toFixed(1)}%`
}

// Formater un nombre
export const formatNumber = (number) => {
  return new Intl.NumberFormat('fr-FR').format(number)
}

// Obtenir les initiales
export const getInitials = (prenom, nom) => {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

// Formater une durée relative (Il y a X temps)
export const formatRelativeTime = (date) => {
  const now = new Date()
  const then = new Date(date)
  const diff = now - then
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  
  return formatDate(date, 'short')
}

// Formater le statut
export const formatStatus = (status) => {
  const statusMap = {
    'En cours': { text: 'En cours', color: 'green' },
    'Terminée': { text: 'Terminée', color: 'gray' },
    'Planifiée': { text: 'Planifiée', color: 'blue' },
    'Annulée': { text: 'Annulée', color: 'red' }
  }
  
  return statusMap[status] || { text: status, color: 'gray' }
}

// Formater le grade
export const formatGrade = (grade) => {
  const gradeMap = {
    'Professeur': 'Prof.',
    'Maître de Conférences': 'MC',
    'Maître Assistant': 'MA',
    'Assistant': 'Ass.'
  }
  
  return gradeMap[grade] || grade
}

// Calculer la couleur selon le pourcentage de disponibilité
export const getDisponibiliteColor = (percent) => {
  if (percent >= 90) return 'green'
  if (percent >= 75) return 'blue'
  if (percent >= 60) return 'yellow'
  return 'red'
}

// Extraire le jour de la semaine
export const getDayOfWeek = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' })
}

// Formater la période d'une session
export const formatPeriode = (dateDebut, dateFin) => {
  return `${formatDate(dateDebut, 'short')} - ${formatDate(dateFin, 'short')}`
}