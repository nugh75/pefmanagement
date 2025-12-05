/**
 * Italian UI Labels for PEF Management System
 * Mapping database fields to human-readable labels
 */

export const labels = {
  // Roles
  roles: {
    TLC: 'Amministrazione TLC',
    DIPARTIMENTO: 'Amministratore Dipartimento',
    DOCENTE: 'Docente',
    CORSISTA: 'Corsista',
    COORD_TUTOR: 'Tutor Coordinatore',
    COLLAB_TUTOR: 'Tutor Collaboratore',
  },

  // Status
  projectStatus: {
    In_Corso: 'In Corso',
    Completato: 'Completato',
    Sospeso: 'Sospeso',
    Annullato: 'Annullato',
  },

  attendanceStatus: {
    Presente: 'Presente',
    Assente: 'Assente',
    Giustificato: 'Giustificato',
  },

  paymentStatus: {
    Pagato: 'Pagato',
    In_Sospeso: 'In Sospeso',
    Rimborsato: 'Rimborsato',
    Annullato: 'Annullato',
  },

  recognitionStatus: {
    Approvato: 'Approvato',
    In_Revisione: 'In Revisione',
    Rifiutato: 'Rifiutato',
    Annullato: 'Annullato',
  },

  deliveryMode: {
    Presenza: 'Presenza',
    Online: 'Online',
    Non_Applicabile: 'Non Applicabile',
  },

  cfuCategoryType: {
    DIDATTICA: 'Didattica',
    TRASVERSALE: 'Trasversale',
    TIROCINIO_DIRETTO: 'Tirocinio Diretto',
    TIROCINIO_INDIRETTO: 'Tirocinio Indiretto',
  },

  // Table: Departments
  departments: {
    _title: 'Dipartimenti',
    id: 'ID Dipartimento',
    name: 'Nome Dipartimento',
    code: 'Codice Dipartimento',
    description: 'Descrizione',
  },

  // Table: Academic Years & Editions
  academicYearEditions: {
    _title: 'Anni Accademici ed Edizioni',
    id: 'ID Anno/Edizione',
    yearLabel: 'Etichetta Anno Accademico',
    editionLabel: 'Etichetta Edizione',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    description: 'Descrizione',
  },

  // Table: Course Types
  courseTypes: {
    _title: 'Tipologie di Percorso',
    id: 'ID Tipo Percorso',
    name: 'Nome Tipologia',
    description: 'Descrizione',
    hasInItinereExams: 'Esami In Itinere',
  },

  // Table: Competition Classes
  competitionClasses: {
    _title: 'Classi di Concorso',
    id: 'ID Classe Concorso',
    code: 'Codice Classe',
    name: 'Nome Classe',
    description: 'Descrizione',
  },

  // Table: Schools
  schools: {
    _title: 'Istituti Scolastici',
    id: 'ID Scuola',
    name: 'Nome Scuola',
    address: 'Indirizzo',
    city: 'Città',
    province: 'Provincia',
    contactPerson: 'Persona di Contatto',
    phone: 'Telefono',
    email: 'Email',
  },

  // Table: USR Referents
  usrReferents: {
    _title: 'Referenti USR',
    id: 'ID Referente USR',
    firstName: 'Nome',
    lastName: 'Cognome',
    email: 'Email',
    phone: 'Telefono',
    usrOfficeName: 'Ufficio USR',
  },

  // Table: Users
  users: {
    _title: 'Utenti del Sistema',
    id: 'ID Utente',
    email: 'Email',
    passwordHash: 'Hash Password',
    role: 'Ruolo',
    isActive: 'Attivo',
    departmentId: 'Dipartimento',
    createdAt: 'Data Creazione',
    updatedAt: 'Data Ultimo Aggiornamento',
  },

  // Table: Student Profiles
  studentProfiles: {
    _title: 'Profili Corsisti',
    id: 'ID Corsista',
    userId: 'ID Utente',
    firstName: 'Nome',
    lastName: 'Cognome',
    fiscalCode: 'Codice Fiscale',
    dateOfBirth: 'Data di Nascita',
    address: 'Indirizzo',
    city: 'Città',
    phone: 'Telefono',
  },

  // Table: Teacher Profiles
  teacherProfiles: {
    _title: 'Profili Docenti',
    id: 'ID Docente',
    userId: 'ID Utente',
    firstName: 'Nome',
    lastName: 'Cognome',
    departmentId: 'Dipartimento',
    competitionClassId: 'Classe di Concorso',
    phone: 'Telefono',
  },

  // Table: Coordinator Tutor Profiles
  coordinatorTutorProfiles: {
    _title: 'Profili Tutor Coordinatori',
    id: 'ID Tutor Coordinatore',
    userId: 'ID Utente',
    firstName: 'Nome',
    lastName: 'Cognome',
    departmentId: 'Dipartimento',
    phone: 'Telefono',
  },

  // Table: Collaborator Tutor Profiles
  collaboratorTutorProfiles: {
    _title: 'Profili Tutor Collaboratori',
    id: 'ID Tutor Collaboratore',
    userId: 'ID Utente',
    firstName: 'Nome',
    lastName: 'Cognome',
    schoolId: 'Scuola',
    phone: 'Telefono',
  },

  // Table: Courses
  courses: {
    _title: 'Insegnamenti',
    id: 'ID Insegnamento',
    name: 'Nome Insegnamento',
    description: 'Descrizione',
    cfu: 'CFU',
    departmentId: 'Dipartimento',
  },

  // Table: Teacher Course Assignments
  teacherCourseAssignments: {
    _title: 'Assegnazione Docenti a Insegnamenti',
    id: 'ID Assegnazione',
    teacherId: 'Docente',
    courseId: 'Insegnamento',
    academicYearEditionId: 'Anno/Edizione',
  },

  // Table: Training Projects
  trainingProjects: {
    _title: 'Progetti Formativi',
    id: 'ID Progetto Formativo',
    studentId: 'Corsista',
    courseTypeId: 'Tipo Percorso',
    academicYearEditionId: 'Anno/Edizione',
    departmentId: 'Dipartimento',
    status: 'Stato',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
  },

  // Table: Student Course Enrollments
  studentCourseEnrollments: {
    _title: 'Iscrizioni Corsisti a Insegnamenti',
    id: 'ID Iscrizione',
    trainingProjectId: 'Progetto Formativo',
    courseId: 'Insegnamento',
    enrollmentDate: 'Data Iscrizione',
    grade: 'Voto',
  },

  // Table: Lessons
  lessons: {
    _title: 'Lezioni',
    id: 'ID Lezione',
    courseId: 'Insegnamento',
    teacherId: 'Docente',
    lessonDate: 'Data Lezione',
    startTime: 'Ora Inizio',
    endTime: 'Ora Fine',
    room: 'Aula',
    pef60All1DeliveryMode: 'Modalità PEF60 all.1',
    pef30All2DeliveryMode: 'Modalità PEF30 all.2',
    pef36All5DeliveryMode: 'Modalità PEF36 all.5',
    pef30Art13DeliveryMode: 'Modalità PEF30 art.13',
    teamsMeetingLink: 'Link Riunione Teams',
    lessonCfu: 'CFU Lezione',
  },

  // Table: Lesson Attendances
  lessonAttendances: {
    _title: 'Frequenze Lezioni',
    id: 'ID Frequenza',
    lessonId: 'Lezione',
    studentId: 'Corsista',
    attendanceStatus: 'Stato Frequenza',
    attendanceDate: 'Data Registrazione',
  },

  // Table: Direct Internships
  directInternships: {
    _title: 'Tirocinio Diretto',
    id: 'ID Tirocinio Diretto',
    studentId: 'Corsista',
    schoolId: 'Scuola',
    collaboratorTutorId: 'Tutor Collaboratore',
    trainingProjectId: 'Progetto Formativo',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    totalHours: 'Ore Totali',
    description: 'Descrizione',
  },

  // Table: Indirect Internships
  indirectInternships: {
    _title: 'Tirocinio Indiretto',
    id: 'ID Tirocinio Indiretto',
    studentId: 'Corsista',
    coordinatorTutorId: 'Tutor Coordinatore',
    trainingProjectId: 'Progetto Formativo',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    totalHours: 'Ore Totali',
    description: 'Descrizione',
  },

  // Table: Direct Internship Attendances
  directInternshipAttendances: {
    _title: 'Frequenza Tirocinio Diretto',
    id: 'ID Frequenza',
    directInternshipId: 'Tirocinio Diretto',
    studentId: 'Corsista',
    date: 'Data Frequenza',
    hoursAttended: 'Ore Frequentate',
    description: 'Descrizione',
  },

  // Table: Indirect Internship Attendances
  indirectInternshipAttendances: {
    _title: 'Frequenza Tirocinio Indiretto',
    id: 'ID Frequenza',
    indirectInternshipId: 'Tirocinio Indiretto',
    studentId: 'Corsista',
    date: 'Data Frequenza',
    hoursAttended: 'Ore Frequentate',
    description: 'Descrizione',
  },

  // Table: Payments
  payments: {
    _title: 'Pagamenti Effettuati',
    id: 'ID Pagamento',
    studentId: 'Corsista',
    academicYearEditionId: 'Anno/Edizione',
    amount: 'Importo',
    paymentDate: 'Data Pagamento',
    status: 'Stato Pagamento',
    description: 'Descrizione',
  },

  // Table: Final Exam Schedule
  finalExamSchedule: {
    _title: 'Calendario Prove Finali',
    id: 'ID Calendario Esame',
    academicYearEditionId: 'Anno/Edizione',
    courseTypeId: 'Tipo Percorso',
    examDate: 'Data Esame',
    startTime: 'Ora Inizio',
    endTime: 'Ora Fine',
    location: 'Luogo',
    description: 'Descrizione',
  },

  // Table: Final Exam Commissions
  finalExamCommissions: {
    _title: 'Commissioni Prove Finali',
    id: 'ID Commissione',
    scheduleId: 'Calendario Esame',
    teacherId: 'Docente',
    roleInCommission: 'Ruolo nella Commissione',
  },

  // Table: Recognitions
  recognitions: {
    _title: 'Riconoscimenti',
    id: 'ID Riconoscimento',
    studentId: 'Corsista',
    trainingProjectId: 'Progetto Formativo',
    recognizedCourseId: 'Insegnamento Riconosciuto',
    recognizedDirectInternshipId: 'Tirocinio Diretto Riconosciuto',
    recognizedIndirectInternshipId: 'Tirocinio Indiretto Riconosciuto',
    cfuRecognized: 'CFU Riconosciuti',
    recognitionDate: 'Data Riconoscimento',
    status: 'Stato Riconoscimento',
    notes: 'Note',
  },

  // Table: CFU Categories
  cfuCategories: {
    _title: 'Categorie CFU',
    id: 'ID Categoria CFU',
    name: 'Nome Categoria',
    categoryType: 'Tipo Categoria',
    description: 'Descrizione',
  },

  // Table: Course Type CFU Structure
  courseTypeCfuStructure: {
    _title: 'Struttura CFU Tipologia Percorso',
    id: 'ID Struttura CFU',
    courseTypeId: 'Tipo Percorso',
    cfuCategoryId: 'Categoria CFU',
    cfuAmount: 'Quantità CFU',
    notes: 'Note',
  },



  // Common actions
  actions: {
    create: 'Crea',
    edit: 'Modifica',
    delete: 'Elimina',
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    search: 'Cerca',
    filter: 'Filtra',
    export: 'Esporta',
    import: 'Importa',
    view: 'Visualizza',
    back: 'Indietro',
    next: 'Avanti',
    previous: 'Precedente',
  },

  // Common messages
  messages: {
    loading: 'Caricamento...',
    noData: 'Nessun dato disponibile',
    error: 'Si è verificato un errore',
    success: 'Operazione completata con successo',
    confirmDelete: 'Sei sicuro di voler eliminare questo elemento?',
    required: 'Campo obbligatorio',
  },
} as const

export type Labels = typeof labels
