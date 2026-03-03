// KIA Care - Static Milestone Data for Child Development Tracking

export interface MilestoneItem {
  id: string;
  label: string;
}

export interface MilestoneCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  colorLight: string;
  colorBg: string;
  items: MilestoneItem[];
}

export interface StimulationTip {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export const milestoneCategories: MilestoneCategory[] = [
  {
    id: 'motorik',
    title: 'Motorik',
    icon: 'walk-outline',
    color: '#5CB85C',
    colorLight: '#D4EDDA',
    colorBg: '#F0FFF4',
    items: [
      { id: 'motorik-1', label: 'Bisa berdiri sendiri' },
      { id: 'motorik-2', label: 'Berjalan dengan berpegangan' },
      { id: 'motorik-3', label: 'Menggenggam benda kecil dengan jari' },
      { id: 'motorik-4', label: 'Memasukkan benda ke wadah' },
      { id: 'motorik-5', label: 'Bertepuk tangan' },
    ],
  },
  {
    id: 'bahasa',
    title: 'Bahasa & Komunikasi',
    icon: 'chatbubble-ellipses-outline',
    color: '#5B9BD5',
    colorLight: '#D6EAF8',
    colorBg: '#EBF5FB',
    items: [
      { id: 'bahasa-1', label: 'Mengucapkan 2-3 kata' },
      { id: 'bahasa-2', label: 'Merespon saat dipanggil namanya' },
      { id: 'bahasa-3', label: 'Menunjuk benda yang diinginkan' },
      { id: 'bahasa-4', label: 'Memahami perintah sederhana' },
      { id: 'bahasa-5', label: 'Menirukan suara atau kata' },
    ],
  },
  {
    id: 'sosial',
    title: 'Sosial & Emosional',
    icon: 'heart-outline',
    color: '#9B8EC4',
    colorLight: '#E8DAEF',
    colorBg: '#F5F0FF',
    items: [
      { id: 'sosial-1', label: 'Tersenyum pada orang yang dikenal' },
      { id: 'sosial-2', label: 'Menangis saat ditinggal orang tua' },
      { id: 'sosial-3', label: 'Melambaikan tangan (da-da)' },
      { id: 'sosial-4', label: 'Bermain cilukba' },
    ],
  },
];

export const stimulationTips: StimulationTip[] = [
  {
    id: 'tip-1',
    icon: 'football-outline',
    title: 'Ajak bermain bola',
    description: 'Gelindingkan bola ke arah anak untuk melatih koordinasi mata dan tangan.',
    color: '#5CB85C',
  },
  {
    id: 'tip-2',
    icon: 'book-outline',
    title: 'Bacakan buku setiap hari',
    description: 'Pilih buku bergambar dan ceritakan isinya untuk merangsang kemampuan bahasa.',
    color: '#5B9BD5',
  },
  {
    id: 'tip-3',
    icon: 'musical-notes-outline',
    title: 'Nyanyikan lagu anak',
    description: 'Ajak anak bernyanyi dan bergerak mengikuti irama untuk stimulasi motorik dan bahasa.',
    color: '#9B8EC4',
  },
  {
    id: 'tip-4',
    icon: 'people-outline',
    title: 'Ajak bermain bersama teman sebaya',
    description: 'Interaksi dengan anak seusia membantu perkembangan sosial dan emosional.',
    color: '#E8919B',
  },
  {
    id: 'tip-5',
    icon: 'cube-outline',
    title: 'Bermain susun balok',
    description: 'Latih anak menyusun balok untuk meningkatkan koordinasi dan kemampuan kognitif.',
    color: '#E8C547',
  },
];

export const dummyChildInfo = {
  name: 'Adik Cantik',
  ageMonths: 12,
  ageLabel: '12 Bulan',
  gender: 'Perempuan' as const,
};
