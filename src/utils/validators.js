// Utilitaires de validation

// Valider un email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valider un numéro de téléphone tunisien
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+216)?[2-9]\d{7}$/
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Valider un nom (au moins 2 caractères)
export const validateName = (name) => {
  return name && name.trim().length >= 2
}

// Valider une date
export const validateDate = (date) => {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d)
}

// Valider une plage de dates
export const validateDateRange = (dateDebut, dateFin) => {
  const debut = new Date(dateDebut)
  const fin = new Date(dateFin)
  return debut < fin
}

// Valider un nombre positif
export const validatePositiveNumber = (number) => {
  return !isNaN(number) && number > 0
}

// Valider une capacité de salle
export const validateCapacity = (capacity) => {
  return validatePositiveNumber(capacity) && capacity <= 500
}

// Valider un formulaire de session
export const validateSessionForm = (formData) => {
  const errors = {}
  
  if (!formData.name || formData.name.trim().length < 3) {
    errors.name = 'Le nom doit contenir au moins 3 caractères'
  }
  
  if (!validateDate(formData.dateDebut)) {
    errors.dateDebut = 'Date de début invalide'
  }
  
  if (!validateDate(formData.dateFin)) {
    errors.dateFin = 'Date de fin invalide'
  }
  
  if (formData.dateDebut && formData.dateFin && !validateDateRange(formData.dateDebut, formData.dateFin)) {
    errors.dateFin = 'La date de fin doit être après la date de début'
  }
  
  if (!formData.niveaux || formData.niveaux.length === 0) {
    errors.niveaux = 'Veuillez sélectionner au moins un niveau'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Valider un formulaire d'enseignant
export const validateTeacherForm = (formData) => {
  const errors = {}
  
  if (!validateName(formData.nom)) {
    errors.nom = 'Le nom doit contenir au moins 2 caractères'
  }
  
  if (!validateName(formData.prenom)) {
    errors.prenom = 'Le prénom doit contenir au moins 2 caractères'
  }
  
  if (!validateEmail(formData.email)) {
    errors.email = 'Email invalide'
  }
  
  if (formData.telephone && !validatePhone(formData.telephone)) {
    errors.telephone = 'Numéro de téléphone invalide'
  }
  
  if (!formData.grade) {
    errors.grade = 'Veuillez sélectionner un grade'
  }
  
  if (!formData.departement) {
    errors.departement = 'Veuillez sélectionner un département'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Valider un formulaire de salle
export const validateRoomForm = (formData) => {
  const errors = {}
  
  if (!formData.nom || formData.nom.trim().length < 2) {
    errors.nom = 'Le nom doit contenir au moins 2 caractères'
  }
  
  if (!validateCapacity(formData.capacite)) {
    errors.capacite = 'Capacité invalide (1-500)'
  }
  
  if (!formData.type) {
    errors.type = 'Veuillez sélectionner un type de salle'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Valider un fichier uploadé
export const validateFile = (file, allowedTypes, maxSize = 5 * 1024 * 1024) => {
  const errors = []
  
  if (!file) {
    errors.push('Aucun fichier sélectionné')
    return { isValid: false, errors }
  }
  
  // Vérifier le type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push('Type de fichier non autorisé')
  }
  
  // Vérifier la taille
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux (max: ${maxSize / 1024 / 1024}MB)`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Vérifier si une chaîne est vide
export const isEmpty = (value) => {
  return !value || value.trim().length === 0
}

// Vérifier si un objet est vide
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0
}