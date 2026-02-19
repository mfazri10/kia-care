// KIA Care - Static Data Constants (Indonesian)

import { DangerSign, EducationArticle } from '@/types';

// ANC Visit Schedule Templates
export const ANC_SCHEDULE = [
  {
    visitNumber: 1,
    trimester: 1,
    label: 'Kunjungan 1 (K1)',
    description: 'Trimester 1 (0-12 minggu)',
    weekRange: '0-12',
    keyChecks: [
      'Tinggi badan & berat badan',
      'Tekanan darah',
      'Lingkar lengan atas (LILA)',
      'Tinggi fundus uteri',
      'Golongan darah',
      'Tes laboratorium (Hb, HIV, Sifilis, HepB)',
      'Imunisasi TT',
      'Tablet Tambah Darah',
    ],
  },
  {
    visitNumber: 2,
    trimester: 2,
    label: 'Kunjungan 2 (K2)',
    description: 'Trimester 2 (>12-24 minggu)',
    weekRange: '13-24',
    keyChecks: [
      'Berat badan',
      'Tekanan darah',
      'Tinggi fundus uteri',
      'Denyut jantung janin',
      'Tablet Tambah Darah',
      'Konseling gizi & aktivitas',
    ],
  },
  {
    visitNumber: 3,
    trimester: 2,
    label: 'Kunjungan 3 (K3)',
    description: 'Trimester 2 (>24-28 minggu)',
    weekRange: '24-28',
    keyChecks: [
      'Berat badan',
      'Tekanan darah',
      'Tinggi fundus uteri',
      'Denyut jantung janin',
      'Tes gula darah',
      'Tablet Tambah Darah',
    ],
  },
  {
    visitNumber: 4,
    trimester: 3,
    label: 'Kunjungan 4 (K4)',
    description: 'Trimester 3 (>28-32 minggu)',
    weekRange: '28-32',
    keyChecks: [
      'Berat badan',
      'Tekanan darah',
      'Tinggi fundus uteri',
      'Denyut jantung janin',
      'Presentasi janin',
      'Tablet Tambah Darah',
      'Persiapan persalinan (P4K)',
    ],
  },
  {
    visitNumber: 5,
    trimester: 3,
    label: 'Kunjungan 5 (K5)',
    description: 'Trimester 3 (>32-36 minggu)',
    weekRange: '32-36',
    keyChecks: [
      'Berat badan',
      'Tekanan darah',
      'Tinggi fundus uteri',
      'Denyut jantung janin',
      'Presentasi janin',
      'Tes protein urin',
      'Tablet Tambah Darah',
      'Konseling tanda persalinan',
    ],
  },
  {
    visitNumber: 6,
    trimester: 3,
    label: 'Kunjungan 6 (K6)',
    description: 'Trimester 3 (>36-40 minggu)',
    weekRange: '36-40',
    keyChecks: [
      'Berat badan',
      'Tekanan darah',
      'Tinggi fundus uteri',
      'Denyut jantung janin',
      'Presentasi janin',
      'USG (jika perlu)',
      'Tablet Tambah Darah',
      'Rencana persalinan final',
    ],
  },
];

// KF Visit Schedule
export const KF_SCHEDULE = [
  {
    visitNumber: 1,
    label: 'KF 1',
    description: '6-48 jam setelah persalinan',
    timing: '6-48 jam',
    keyChecks: [
      'Tekanan darah',
      'Suhu tubuh',
      'Tinggi rahim & kontraksi',
      'Pendarahan',
      'Kondisi perineum',
      'Tanda infeksi',
      'Inisiasi Menyusu Dini (IMD)',
      'Konseling ASI eksklusif',
    ],
  },
  {
    visitNumber: 2,
    label: 'KF 2',
    description: '3-7 hari setelah persalinan',
    timing: '3-7 hari',
    keyChecks: [
      'Tekanan darah',
      'Pendarahan & lokia',
      'Kondisi jahitan (jika ada)',
      'Tanda infeksi',
      'ASI & menyusui',
      'Kesehatan mental ibu',
      'Perawatan bayi',
    ],
  },
  {
    visitNumber: 3,
    label: 'KF 3',
    description: '8-28 hari setelah persalinan',
    timing: '8-28 hari',
    keyChecks: [
      'Tekanan darah',
      'Penyembuhan luka',
      'ASI eksklusif',
      'Kesehatan mental',
      'Aktivitas fisik',
      'KB (Keluarga Berencana)',
      'Tumbuh kembang bayi',
    ],
  },
  {
    visitNumber: 4,
    label: 'KF 4',
    description: '29-42 hari setelah persalinan',
    timing: '29-42 hari',
    keyChecks: [
      'Pemeriksaan umum',
      'Pendarahan & lokia',
      'ASI eksklusif',
      'Kesehatan mental',
      'KB (Keluarga Berencana)',
      'Imunisasi bayi',
      'Rencana tindak lanjut',
    ],
  },
];

// Danger Signs
export const DANGER_SIGNS_HAMIL: DangerSign[] = [
  {
    id: 'dsh-1',
    category: 'hamil',
    title: 'Pendarahan dari jalan lahir',
    description: 'Keluar darah dari vagina selama kehamilan, bisa menandakan keguguran, plasenta previa, atau solusio plasenta.',
    severity: 'danger',
  },
  {
    id: 'dsh-2',
    category: 'hamil',
    title: 'Sakit kepala hebat',
    description: 'Sakit kepala yang tidak hilang dan disertai pandangan kabur, bisa menandakan preeklamsia.',
    severity: 'danger',
  },
  {
    id: 'dsh-3',
    category: 'hamil',
    title: 'Pandangan kabur',
    description: 'Mata berkunang-kunang atau pandangan tidak jelas, tanda kemungkinan preeklamsia.',
    severity: 'danger',
  },
  {
    id: 'dsh-4',
    category: 'hamil',
    title: 'Bengkak pada wajah, tangan, dan kaki',
    description: 'Pembengkakan yang tidak normal bisa menjadi tanda preeklamsia atau masalah ginjal.',
    severity: 'danger',
  },
  {
    id: 'dsh-5',
    category: 'hamil',
    title: 'Demam tinggi',
    description: 'Suhu tubuh >38°C bisa menandakan infeksi yang perlu penanganan segera.',
    severity: 'danger',
  },
  {
    id: 'dsh-6',
    category: 'hamil',
    title: 'Gerakan janin berkurang',
    description: 'Bayi bergerak kurang dari 10 kali dalam 12 jam. Perlu segera ke fasilitas kesehatan.',
    severity: 'danger',
  },
  {
    id: 'dsh-7',
    category: 'hamil',
    title: 'Ketuban pecah sebelum waktunya',
    description: 'Keluar cairan bening dari jalan lahir sebelum tanda persalinan dimulai.',
    severity: 'danger',
  },
  {
    id: 'dsh-8',
    category: 'hamil',
    title: 'Mual muntah berlebihan',
    description: 'Tidak bisa makan dan minum, berat badan turun drastis (hiperemesis gravidarum).',
    severity: 'warning',
  },
  {
    id: 'dsh-9',
    category: 'hamil',
    title: 'Nyeri perut hebat',
    description: 'Nyeri yang sangat kuat di perut, bisa menandakan kehamilan ektopik atau solusio plasenta.',
    severity: 'danger',
  },
  {
    id: 'dsh-10',
    category: 'hamil',
    title: 'Kejang',
    description: 'Kejang pada ibu hamil merupakan tanda eklamsia, kondisi darurat medis.',
    severity: 'danger',
  },
];

export const DANGER_SIGNS_PASCA: DangerSign[] = [
  {
    id: 'dsp-1',
    category: 'pasca-melahirkan',
    title: 'Pendarahan banyak setelah melahirkan',
    description: 'Darah yang keluar sangat banyak (membasahi lebih dari 1 pembalut per jam).',
    severity: 'danger',
  },
  {
    id: 'dsp-2',
    category: 'pasca-melahirkan',
    title: 'Demam tinggi (>38°C)',
    description: 'Bisa menandakan infeksi nifas yang perlu penanganan segera.',
    severity: 'danger',
  },
  {
    id: 'dsp-3',
    category: 'pasca-melahirkan',
    title: 'Cairan vagina berbau busuk',
    description: 'Lokia yang berbau tidak normal menandakan kemungkinan infeksi.',
    severity: 'danger',
  },
  {
    id: 'dsp-4',
    category: 'pasca-melahirkan',
    title: 'Nyeri perut hebat',
    description: 'Nyeri yang tidak membaik bisa menandakan infeksi atau masalah rahim.',
    severity: 'danger',
  },
  {
    id: 'dsp-5',
    category: 'pasca-melahirkan',
    title: 'Payudara bengkak, merah, panas, nyeri',
    description: 'Bisa menandakan mastitis (infeksi payudara) yang perlu penanganan.',
    severity: 'warning',
  },
  {
    id: 'dsp-6',
    category: 'pasca-melahirkan',
    title: 'Sakit kepala hebat / pandangan kabur',
    description: 'Tekanan darah tinggi pasca melahirkan bisa terjadi hingga 6 minggu setelah persalinan.',
    severity: 'danger',
  },
  {
    id: 'dsp-7',
    category: 'pasca-melahirkan',
    title: 'Sesak napas',
    description: 'Kesulitan bernapas bisa menandakan emboli paru atau masalah jantung.',
    severity: 'danger',
  },
  {
    id: 'dsp-8',
    category: 'pasca-melahirkan',
    title: 'Keinginan menyakiti diri sendiri atau bayi',
    description: 'Segera cari pertolongan. Ini bisa menjadi tanda depresi pasca melahirkan berat.',
    severity: 'danger',
  },
];

// EPDS (Edinburgh Postnatal Depression Scale) Questions - Indonesian
export const EPDS_QUESTIONS = [
  {
    id: 1,
    question: 'Saya bisa tertawa dan melihat sisi lucu dari berbagai hal',
    options: [
      { value: 0, label: 'Sama seperti biasanya' },
      { value: 1, label: 'Tidak begitu sering sekarang' },
      { value: 2, label: 'Jelas lebih jarang sekarang' },
      { value: 3, label: 'Sama sekali tidak' },
    ],
  },
  {
    id: 2,
    question: 'Saya bisa menantikan sesuatu dengan senang hati',
    options: [
      { value: 0, label: 'Sama seperti biasanya' },
      { value: 1, label: 'Agak kurang dari biasanya' },
      { value: 2, label: 'Jelas kurang dari biasanya' },
      { value: 3, label: 'Hampir tidak bisa sama sekali' },
    ],
  },
  {
    id: 3,
    question: 'Saya menyalahkan diri sendiri tanpa alasan ketika ada yang salah',
    options: [
      { value: 3, label: 'Ya, hampir sepanjang waktu' },
      { value: 2, label: 'Ya, kadang-kadang' },
      { value: 1, label: 'Tidak terlalu sering' },
      { value: 0, label: 'Tidak, tidak pernah' },
    ],
  },
  {
    id: 4,
    question: 'Saya merasa cemas atau khawatir tanpa alasan yang jelas',
    options: [
      { value: 0, label: 'Tidak, sama sekali tidak' },
      { value: 1, label: 'Hampir tidak pernah' },
      { value: 2, label: 'Ya, kadang-kadang' },
      { value: 3, label: 'Ya, sangat sering' },
    ],
  },
  {
    id: 5,
    question: 'Saya merasa takut atau panik tanpa alasan yang jelas',
    options: [
      { value: 3, label: 'Ya, cukup sering' },
      { value: 2, label: 'Ya, kadang-kadang' },
      { value: 1, label: 'Tidak, jarang' },
      { value: 0, label: 'Tidak, sama sekali tidak' },
    ],
  },
  {
    id: 6,
    question: 'Berbagai hal menumpuk dan terasa berat bagi saya',
    options: [
      { value: 3, label: 'Ya, saya tidak bisa mengatasinya' },
      { value: 2, label: 'Ya, kadang saya tidak bisa mengatasi seperti biasa' },
      { value: 1, label: 'Tidak, saya bisa mengatasi dengan baik' },
      { value: 0, label: 'Tidak, saya mengatasi sama baiknya seperti biasa' },
    ],
  },
  {
    id: 7,
    question: 'Saya sangat tidak bahagia sehingga sulit tidur',
    options: [
      { value: 3, label: 'Ya, hampir sepanjang waktu' },
      { value: 2, label: 'Ya, kadang-kadang' },
      { value: 1, label: 'Tidak terlalu sering' },
      { value: 0, label: 'Tidak, sama sekali tidak' },
    ],
  },
  {
    id: 8,
    question: 'Saya merasa sedih atau sengsara',
    options: [
      { value: 3, label: 'Ya, hampir sepanjang waktu' },
      { value: 2, label: 'Ya, cukup sering' },
      { value: 1, label: 'Tidak terlalu sering' },
      { value: 0, label: 'Tidak, sama sekali tidak' },
    ],
  },
  {
    id: 9,
    question: 'Saya sangat tidak bahagia sehingga saya menangis',
    options: [
      { value: 3, label: 'Ya, hampir sepanjang waktu' },
      { value: 2, label: 'Ya, cukup sering' },
      { value: 1, label: 'Hanya kadang-kadang' },
      { value: 0, label: 'Tidak, tidak pernah' },
    ],
  },
  {
    id: 10,
    question: 'Pikiran untuk menyakiti diri sendiri pernah terlintas',
    options: [
      { value: 3, label: 'Ya, cukup sering' },
      { value: 2, label: 'Kadang-kadang' },
      { value: 1, label: 'Hampir tidak pernah' },
      { value: 0, label: 'Tidak pernah' },
    ],
  },
];

// Milk Storage Duration (in hours)
export const MILK_STORAGE_DURATION = {
  'suhu-ruang': {
    label: 'Suhu Ruang (25°C)',
    maxHours: 4,
    icon: 'thermometer-outline',
  },
  'kulkas': {
    label: 'Kulkas (4°C)',
    maxHours: 96, // 4 days
    icon: 'snow-outline',
  },
  'freezer': {
    label: 'Freezer (-18°C)',
    maxHours: 4320, // 6 months (180 days)
    icon: 'ice-cream-outline',
  },
};

// Pre-Pregnancy Checklist Items
export const PRE_PREGNANCY_ITEMS = [
  {
    key: 'asamFolat',
    title: 'Konsumsi Asam Folat',
    description: 'Mulai konsumsi 400 mcg asam folat setiap hari, minimal 1 bulan sebelum kehamilan.',
    icon: 'medical-outline',
  },
  {
    key: 'pemeriksaanKesehatan',
    title: 'Pemeriksaan Kesehatan',
    description: 'Lakukan pemeriksaan kesehatan umum termasuk cek darah, tekanan darah, dan gula darah.',
    icon: 'fitness-outline',
  },
  {
    key: 'imunisasiTT',
    title: 'Imunisasi TT',
    description: 'Pastikan status imunisasi Tetanus Toksoid (TT) lengkap.',
    icon: 'shield-checkmark-outline',
  },
  {
    key: 'polaMakanSehat',
    title: 'Pola Makan Sehat',
    description: 'Perbanyak buah, sayur, protein, dan karbohidrat kompleks. Kurangi makanan olahan.',
    icon: 'nutrition-outline',
  },
  {
    key: 'olahragaTeratur',
    title: 'Olahraga Teratur',
    description: 'Lakukan olahraga ringan minimal 30 menit, 3-5 kali seminggu.',
    icon: 'walk-outline',
  },
  {
    key: 'berhentiMerokok',
    title: 'Berhenti Merokok',
    description: 'Hindari rokok dan paparan asap rokok (termasuk pasif).',
    icon: 'ban-outline',
  },
  {
    key: 'kurangiKafein',
    title: 'Kurangi Kafein',
    description: 'Batasi konsumsi kafein maksimal 200mg/hari (±2 cangkir kopi).',
    icon: 'cafe-outline',
  },
  {
    key: 'kelolStres',
    title: 'Kelola Stres',
    description: 'Praktikkan relaksasi, meditasi, atau aktivitas menyenangkan secara rutin.',
    icon: 'happy-outline',
  },
  {
    key: 'periksaGigi',
    title: 'Periksa Gigi',
    description: 'Kunjungi dokter gigi untuk memastikan kesehatan mulut sebelum hamil.',
    icon: 'sparkles-outline',
  },
  {
    key: 'catatSiklusMenstruasi',
    title: 'Catat Siklus Menstruasi',
    description: 'Catat tanggal mulai dan selesai menstruasi untuk mengetahui masa subur.',
    icon: 'calendar-outline',
  },
];

// Education articles (sample - will be generated by AI later)
export const EDUCATION_ARTICLES: EducationArticle[] = [
  // Pre-pregnancy
  {
    id: 'edu-pra-1',
    phase: 'pra-hamil',
    title: 'Persiapan Nutrisi Sebelum Hamil',
    summary: 'Panduan lengkap nutrisi yang perlu dipenuhi sebelum memulai program hamil.',
    content: 'Persiapan nutrisi yang baik sebelum hamil sangat penting untuk kesehatan ibu dan calon bayi...',
    category: 'Nutrisi',
  },
  {
    id: 'edu-pra-2',
    phase: 'pra-hamil',
    title: 'Mengenal Masa Subur Anda',
    summary: 'Cara menghitung masa subur dan tips untuk meningkatkan peluang kehamilan.',
    content: 'Masa subur adalah periode di mana sel telur siap untuk dibuahi...',
    category: 'Kesuburan',
  },
  // Pregnancy
  {
    id: 'edu-hamil-1',
    phase: 'hamil',
    weekNumber: 4,
    title: 'Minggu ke-4: Awal Kehidupan Baru',
    summary: 'Perkembangan janin di minggu ke-4 dan perubahan yang terjadi pada tubuh Anda.',
    content: 'Di minggu ke-4, embrio mulai menempel di dinding rahim...',
    category: 'Perkembangan Janin',
  },
  {
    id: 'edu-hamil-2',
    phase: 'hamil',
    weekNumber: 12,
    title: 'Minggu ke-12: Trimester Pertama Berakhir',
    summary: 'Apa yang terjadi di akhir trimester pertama dan persiapan trimester kedua.',
    content: 'Selamat! Anda telah melewati trimester pertama...',
    category: 'Perkembangan Janin',
  },
  {
    id: 'edu-hamil-3',
    phase: 'hamil',
    title: 'Pentingnya Tablet Tambah Darah',
    summary: 'Mengapa ibu hamil wajib mengonsumsi 90 tablet tambah darah selama kehamilan.',
    content: 'Tablet Tambah Darah (TTD) mengandung zat besi dan asam folat yang sangat penting...',
    category: 'Suplemen',
  },
  // Postpartum
  {
    id: 'edu-pasca-1',
    phase: 'pasca-melahirkan',
    title: 'ASI Eksklusif 6 Bulan',
    summary: 'Panduan lengkap pemberian ASI eksklusif selama 6 bulan pertama.',
    content: 'ASI eksklusif berarti memberikan hanya ASI tanpa tambahan makanan atau minuman lain...',
    category: 'ASI',
  },
  {
    id: 'edu-pasca-2',
    phase: 'pasca-melahirkan',
    title: 'Perawatan Bayi Baru Lahir',
    summary: 'Tips perawatan bayi baru lahir yang perlu diketahui setiap ibu.',
    content: 'Merawat bayi baru lahir membutuhkan perhatian khusus...',
    category: 'Perawatan Bayi',
  },
  {
    id: 'edu-pasca-3',
    phase: 'pasca-melahirkan',
    title: 'Mengenali Baby Blues dan Depresi Pasca Melahirkan',
    summary: 'Perbedaan baby blues dan depresi pasca melahirkan serta cara mengatasinya.',
    content: 'Baby blues adalah kondisi yang umum terjadi pada ibu baru melahirkan...',
    category: 'Kesehatan Mental',
  },
];

// Baby Growth WHO Standards (simplified - weight in grams by age in weeks)
export const BABY_GROWTH_STANDARDS = {
  'laki-laki': {
    weight: {
      0: { p3: 2500, p50: 3300, p97: 4200 },
      4: { p3: 3400, p50: 4500, p97: 5800 },
      8: { p3: 4400, p50: 5600, p97: 7200 },
      12: { p3: 5100, p50: 6400, p97: 8200 },
      16: { p3: 5600, p50: 7000, p97: 8900 },
      20: { p3: 6000, p50: 7500, p97: 9500 },
      24: { p3: 6400, p50: 7900, p97: 10000 },
      36: { p3: 7400, p50: 9100, p97: 11400 },
      48: { p3: 8100, p50: 9900, p97: 12500 },
    },
    height: {
      0: { p3: 46.3, p50: 49.9, p97: 53.4 },
      4: { p3: 51.1, p50: 54.7, p97: 58.4 },
      8: { p3: 54.7, p50: 58.4, p97: 62.2 },
      12: { p3: 57.6, p50: 61.4, p97: 65.3 },
      16: { p3: 60.0, p50: 63.9, p97: 67.8 },
      24: { p3: 63.4, p50: 67.6, p97: 71.9 },
      36: { p3: 68.2, p50: 72.3, p97: 76.5 },
      48: { p3: 71.6, p50: 75.7, p97: 80.2 },
    },
  },
  'perempuan': {
    weight: {
      0: { p3: 2400, p50: 3200, p97: 4200 },
      4: { p3: 3200, p50: 4200, p97: 5400 },
      8: { p3: 4000, p50: 5100, p97: 6600 },
      12: { p3: 4600, p50: 5800, p97: 7500 },
      16: { p3: 5100, p50: 6400, p97: 8200 },
      20: { p3: 5500, p50: 6900, p97: 8700 },
      24: { p3: 5900, p50: 7300, p97: 9200 },
      36: { p3: 6900, p50: 8500, p97: 10600 },
      48: { p3: 7600, p50: 9300, p97: 11700 },
    },
    height: {
      0: { p3: 45.6, p50: 49.1, p97: 52.7 },
      4: { p3: 49.8, p50: 53.4, p97: 57.1 },
      8: { p3: 53.2, p50: 57.0, p97: 60.8 },
      12: { p3: 55.8, p50: 59.8, p97: 63.8 },
      16: { p3: 58.0, p50: 62.1, p97: 66.2 },
      24: { p3: 61.5, p50: 65.7, p97: 70.0 },
      36: { p3: 66.2, p50: 70.4, p97: 74.8 },
      48: { p3: 69.8, p50: 74.0, p97: 78.5 },
    },
  },
};
