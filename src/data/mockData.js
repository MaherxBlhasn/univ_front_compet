// Données fictives pour le développement

export const MOCK_SESSIONS = [
  {
    id: 1,
    name: 'Session Janvier 2025',
    dateDebut: '2025-01-15',
    dateFin: '2025-01-30',
    niveaux: ['L1', 'L2', 'L3'],
    status: 'En cours',
    nbExamens: 28,
    nbSalles: 12
  },
  {
    id: 2,
    name: 'Session Mai 2024',
    dateDebut: '2024-05-10',
    dateFin: '2024-05-25',
    niveaux: ['L1', 'M1'],
    status: 'Terminée',
    nbExamens: 22,
    nbSalles: 10
  },
  {
    id: 3,
    name: 'Session Juin 2024',
    dateDebut: '2024-06-20',
    dateFin: '2024-07-05',
    niveaux: ['L2', 'L3', 'M2'],
    status: 'Planifiée',
    nbExamens: 35,
    nbSalles: 15
  }
]

export const MOCK_TEACHERS = [
  {
    code_smartex_ens: 1001,
    nom_ens: 'Ben Ahmed',
    prenom_ens: 'Mohamed',
    email_ens: 'mohamed.benahmed@isi.tn',
    grade_code_ens: 'PROF',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1002,
    nom_ens: 'Trabelsi',
    prenom_ens: 'Fatma',
    email_ens: 'fatma.trabelsi@isi.tn',
    grade_code_ens: 'MA',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1003,
    nom_ens: 'Messaoudi',
    prenom_ens: 'Karim',
    email_ens: 'karim.messaoudi@isi.tn',
    grade_code_ens: 'ASST',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1004,
    nom_ens: 'Gharbi',
    prenom_ens: 'Sami',
    email_ens: 'sami.gharbi@isi.tn',
    grade_code_ens: 'MC',
    participe_surveillance: false
  },
  {
    code_smartex_ens: 1005,
    nom_ens: 'Ben Salem',
    prenom_ens: 'Leila',
    email_ens: 'leila.bensalem@isi.tn',
    grade_code_ens: 'ASST',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1006,
    nom_ens: 'Hamdi',
    prenom_ens: 'Ahmed',
    email_ens: 'ahmed.hamdi@isi.tn',
    grade_code_ens: 'PROF',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1007,
    nom_ens: 'Bouaziz',
    prenom_ens: 'Sarra',
    email_ens: 'sarra.bouaziz@isi.tn',
    grade_code_ens: 'MC',
    participe_surveillance: true
  },
  {
    code_smartex_ens: 1008,
    nom_ens: 'Karoui',
    prenom_ens: 'Hichem',
    email_ens: 'hichem.karoui@isi.tn',
    grade_code_ens: 'MA',
    participe_surveillance: false
  }
]

// Mapping des codes de grade vers les noms complets
export const GRADE_LABELS = {
  'PR': 'Professeur',
  'MA': 'Maître Assistant',
  'PTC': 'Professeur Technologue',
  'AC': 'Assistant Contractuel',
  'VA': 'Vacataire',
  'AS': 'Assistant',
  'EX': 'Expert',
  'PES': 'Professeur d\'Enseignement Supérieur',
  'MC': 'Maître de Conférences',
  'V': 'Autre'
}

export const MOCK_PLANNING = [
  {
    id: 1,
    date: '2025-01-15',
    creneau: '08:00-10:00',
    niveau: 'L1',
    matiere: 'Algorithmique',
    salle: 'A101',
    surveillants: ['Mohamed Ben Ahmed', 'Fatma Trabelsi']
  },
  {
    id: 2,
    date: '2025-01-15',
    creneau: '10:00-12:00',
    niveau: 'L2',
    matiere: 'Base de données',
    salle: 'B201',
    surveillants: ['Karim Messaoudi', 'Sami Gharbi']
  },
  {
    id: 3,
    date: '2025-01-15',
    creneau: '14:00-16:00',
    niveau: 'L3',
    matiere: 'Réseaux',
    salle: 'A102',
    surveillants: ['Leila Ben Salem', 'Mohamed Ben Ahmed']
  },
  {
    id: 4,
    date: '2025-01-16',
    creneau: '08:00-10:00',
    niveau: 'M1',
    matiere: 'Intelligence Artificielle',
    salle: 'C301',
    surveillants: ['Sami Gharbi', 'Fatma Trabelsi']
  },
  {
    id: 5,
    date: '2025-01-16',
    creneau: '10:00-12:00',
    niveau: 'L1',
    matiere: 'Programmation C',
    salle: 'A103',
    surveillants: ['Karim Messaoudi', 'Leila Ben Salem']
  }
]

export const MOCK_ROOMS = [
  {
    id: 1,
    nom: 'A101',
    capacite: 40,
    type: 'Amphi',
    equipements: ['Projecteur', 'Tableau'],
    disponible: true
  },
  {
    id: 2,
    nom: 'A102',
    capacite: 35,
    type: 'Salle TP',
    equipements: ['PC', 'Projecteur'],
    disponible: true
  },
  {
    id: 3,
    nom: 'B201',
    capacite: 50,
    type: 'Amphi',
    equipements: ['Projecteur', 'Tableau', 'Micro'],
    disponible: true
  },
  {
    id: 4,
    nom: 'B202',
    capacite: 30,
    type: 'Salle TD',
    equipements: ['Tableau'],
    disponible: false
  },
  {
    id: 5,
    nom: 'C301',
    capacite: 45,
    type: 'Amphi',
    equipements: ['Projecteur', 'Tableau', 'Climatisation'],
    disponible: true
  }
]

export const MOCK_VOEUX = [
  {
    id: 1,
    teacherId: 1,
    date: '2025-01-15',
    creneau: '08:00-10:00',
    motif: 'Cours programmé'
  },
  {
    id: 2,
    teacherId: 1,
    date: '2025-01-20',
    creneau: '14:00-16:00',
    motif: 'Rendez-vous médical'
  },
  {
    id: 3,
    teacherId: 2,
    date: '2025-01-18',
    creneau: '10:00-12:00',
    motif: 'Réunion département'
  }
]

export const MOCK_STATS = {
  totalEnseignants: 45,
  totalSessions: 3,
  totalSalles: 12,
  totalSurveillances: 156,
  tauxCouverture: 97.5,
  conflitsDetectes: 2,
  enseignantsActifs: 42,
  examensPlannifies: 28
}

export const MOCK_RECENT_ACTIVITIES = [
  {
    id: 1,
    action: 'Planning généré',
    details: 'Session 2025 - Niveau 1',
    time: 'Il y a 2h',
    type: 'success'
  },
  {
    id: 2,
    action: 'Voeux soumis',
    details: 'Dr. Ben Ahmed',
    time: 'Il y a 5h',
    type: 'info'
  },
  {
    id: 3,
    action: 'Export effectué',
    details: 'Planning_Final.pdf',
    time: 'Hier',
    type: 'success'
  },
  {
    id: 4,
    action: 'Session créée',
    details: 'Session Janvier 2025',
    time: 'Il y a 2 jours',
    type: 'info'
  }
]