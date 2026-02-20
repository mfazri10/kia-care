// KIA Care - Type Definitions

export type Phase = 'pra-hamil' | 'hamil' | 'pasca-melahirkan';

export interface UserProfile {
  id: string;
  name: string;
  phase: Phase;
  age: number;
  weight: number; // kg
  height: number; // cm
  hpht?: string; // Hari Pertama Haid Terakhir (ISO date)
  babyDob?: string; // ISO date
  babyName?: string;
  babyGender?: 'laki-laki' | 'perempuan';
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  pinEnabled: boolean;
  pin?: string;
  biometricEnabled: boolean;
  activeProfileId: string | null;
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  language: 'id'; // Indonesian only
}

// ANC Visit Types
export interface ANCVisit {
  id: string;
  profileId: string;
  visitNumber: number; // 1-6
  scheduledDate: string;
  completedDate?: string;
  completed: boolean;
  checklist: ANCChecklist;
  notes?: string;
}

export interface ANCChecklist {
  tekananDarah: boolean; // Blood pressure
  beratBadan: boolean; // Weight
  tinggiFundus: boolean; // Fundal height
  denyutJantungJanin: boolean; // Fetal heartbeat
  statusImunisasiTT: boolean; // TT immunization
  tabletTambahDarah: boolean; // Iron supplement
  tesLaboratorium: boolean; // Lab tests
  tatalaksanaKasus: boolean; // Case management
  temuWicaraKonseling: boolean; // Counseling
  // Additional for specific visits
  lingkarLenganAtas?: boolean; // Upper arm circumference
  tinggiadan?: boolean; // Height (first visit)
  golonganDarah?: boolean; // Blood type (first visit)
  tesHIV?: boolean; // HIV test
  tesProteinUrin?: boolean; // Urine protein test
  tesGulaDarah?: boolean; // Blood sugar test
  tesSifilis?: boolean; // Syphilis test
  tesHepB?: boolean; // Hepatitis B test
  usg?: boolean; // Ultrasound
}

// TTD (Tablet Tambah Darah) Log
export interface TTDEntry {
  id: string;
  profileId: string;
  date: string; // ISO date
  taken: boolean;
  time?: string; // Time taken
  notes?: string;
}

// P4K (Program Perencanaan Persalinan dan Pencegahan Komplikasi)
export interface P4KData {
  profileId: string;
  lokasiPersalinan: string; // Birth location
  penolongPersalinan: string; // Birth attendant
  transportasi: string; // Transportation
  pendonorDarah: string; // Blood donor
  pendampingPersalinan: string; // Birth companion
  calonPendonorDarah: CalonPendonorDarah[];
  kontakDarurat: EmergencyContact[];
  tabungan: string; // Savings
  asuransi: string; // Insurance
  alamatRS: string; // Hospital address
  notes: string;
}

export interface CalonPendonorDarah {
  nama: string;
  golDarah: string;
  telepon: string;
}

export interface EmergencyContact {
  nama: string;
  hubungan: string;
  telepon: string;
}

// Danger Signs
export interface DangerSign {
  id: string;
  category: Phase;
  title: string;
  description: string;
  severity: 'warning' | 'danger';
}

export interface DangerSignCheck {
  id: string;
  profileId: string;
  date: string;
  signs: string[]; // IDs of detected signs
  actionTaken?: string;
}

// KF (Kunjungan Nifas) Visit
export interface KFVisit {
  id: string;
  profileId: string;
  visitNumber: number; // 1-4
  scheduledDate: string;
  completedDate?: string;
  completed: boolean;
  checklist: KFChecklist;
  notes?: string;
}

export interface KFChecklist {
  tekananDarah: boolean;
  suhuTubuh: boolean;
  pendarahan: boolean;
  kondisiPerineum: boolean;
  tandaInfeksi: boolean;
  kontraksiRahim: boolean;
  tinggiRahim: boolean;
  asi: boolean;
  kesehatanMental: boolean;
}

// Breastfeeding Log
export interface BreastfeedingSession {
  id: string;
  profileId: string;
  startTime: string;
  endTime?: string;
  side: 'kiri' | 'kanan' | 'keduanya'; // left, right, both
  type: 'menyusui' | 'pompa'; // nursing or pumping
  amount?: number; // ml for pumping
  notes?: string;
}

// Milk Stock
export interface MilkStock {
  id: string;
  profileId: string;
  dateStored: string;
  amount: number; // ml
  storageType: 'suhu-ruang' | 'kulkas' | 'freezer';
  expirationDate: string;
  used: boolean;
  usedDate?: string;
  notes?: string;
}

// Baby Growth
export interface BabyGrowthEntry {
  id: string;
  profileId: string;
  date: string;
  ageWeeks: number;
  weight?: number; // grams
  height?: number; // cm
  headCircumference?: number; // cm
  notes?: string;
}

// Baby Blues / PPD Screening
export interface BabyBluesScreening {
  id: string;
  profileId: string;
  date: string;
  answers: number[]; // EPDS scores (0-3 per question, 10 questions)
  totalScore: number;
  riskLevel: 'rendah' | 'sedang' | 'tinggi'; // low, medium, high
}

// Pre-Pregnancy Checklist
export interface PrePregnancyChecklist {
  profileId: string;
  asamFolat: boolean; // Folic acid
  pemeriksaanKesehatan: boolean; // Health check
  imunisasiTT: boolean; // TT immunization
  polaMakanSehat: boolean; // Healthy diet
  olahragaTeratur: boolean; // Regular exercise
  berhentiMerokok: boolean; // Stop smoking
  kurangiKafein: boolean; // Reduce caffeine
  kelolStres: boolean; // Manage stress
  periksaGigi: boolean; // Dental check
  catatSiklusMenstruasi: boolean; // Track menstrual cycle
}

// Fertility Calendar
export interface FertilityEntry {
  profileId: string;
  cycleStartDate: string;
  cycleLength: number; // days
  periodLength: number; // days
}

// Education Article
export interface EducationArticle {
  id: string;
  phase: Phase;
  weekNumber?: number; // Relevant week of pregnancy or baby age
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string;
}

// Calendar Event
export interface CalendarEvent {
  id: string;
  profileId: string;
  date: string;
  title: string;
  type: 'anc' | 'kf' | 'ttd' | 'imunisasi' | 'kontrol' | 'lainnya';
  completed: boolean;
  notes?: string;
}

// Notification
export interface AppNotification {
  id: string;
  profileId: string;
  title: string;
  body: string;
  scheduledDate: string;
  type: 'ttd' | 'anc' | 'kf' | 'menyusui' | 'imunisasi' | 'lainnya';
  read: boolean;
}
