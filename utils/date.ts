// KIA Care - Date Utilities

// Get pregnancy week from HPHT (Hari Pertama Haid Terakhir)
export function getPregnancyWeek(hpht: string): number {
  const hphtDate = new Date(hpht);
  const now = new Date();
  const diffMs = now.getTime() - hphtDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// Get estimated due date (40 weeks from HPHT)
export function getEstimatedDueDate(hpht: string): Date {
  const hphtDate = new Date(hpht);
  const edd = new Date(hphtDate);
  edd.setDate(edd.getDate() + 280); // 40 weeks
  return edd;
}

// Get trimester from pregnancy week
export function getTrimester(week: number): number {
  if (week <= 12) return 1;
  if (week <= 27) return 2;
  return 3;
}

// Get days remaining until due date
export function getDaysUntilDue(hpht: string): number {
  const edd = getEstimatedDueDate(hpht);
  const now = new Date();
  const diffMs = edd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// Get baby age in weeks
export function getBabyAgeWeeks(dob: string): number {
  const dobDate = new Date(dob);
  const now = new Date();
  const diffMs = now.getTime() - dobDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
}

// Get baby age in months
export function getBabyAgeMonths(dob: string): number {
  const dobDate = new Date(dob);
  const now = new Date();
  let months = (now.getFullYear() - dobDate.getFullYear()) * 12;
  months += now.getMonth() - dobDate.getMonth();
  if (now.getDate() < dobDate.getDate()) months--;
  return Math.max(0, months);
}

// Get baby age display text
export function getBabyAgeText(dob: string): string {
  const weeks = getBabyAgeWeeks(dob);
  if (weeks < 4) return `${weeks} minggu`;
  const months = getBabyAgeMonths(dob);
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} tahun`;
  return `${years} tahun ${remainingMonths} bulan`;
}

// Format date to Indonesian
export function formatDateID(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format date short
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Format time
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Get today's date as ISO string (date only)
export function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check if two dates are same day
export function isSameDay(date1: string, date2: string): boolean {
  return date1.split('T')[0] === date2.split('T')[0];
}

// Get days between two dates
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Get fertility window (ovulation around day 14 of cycle)
export function getFertilityWindow(cycleStartDate: string, cycleLength: number): {
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
} {
  const start = new Date(cycleStartDate);
  const ovulationDay = cycleLength - 14;

  const ovulationDate = new Date(start);
  ovulationDate.setDate(start.getDate() + ovulationDay);

  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5);

  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1);

  return { ovulationDate, fertileStart, fertileEnd };
}

// Calculate milk expiration based on storage type
export function getMilkExpirationDate(storedDate: string, storageType: 'suhu-ruang' | 'kulkas' | 'freezer'): Date {
  const date = new Date(storedDate);
  switch (storageType) {
    case 'suhu-ruang':
      date.setHours(date.getHours() + 4);
      break;
    case 'kulkas':
      date.setHours(date.getHours() + 96); // 4 days
      break;
    case 'freezer':
      date.setMonth(date.getMonth() + 6);
      break;
  }
  return date;
}

// Format duration (seconds to mm:ss or hh:mm:ss)
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Get Indonesian day name
export function getDayNameID(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

// Get days in month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Generate calendar dates for a month
export function getCalendarDates(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = getDaysInMonth(year, month);

  const dates: (Date | null)[] = [];

  // Add empty slots for days before the 1st
  for (let i = 0; i < startDay; i++) {
    dates.push(null);
  }

  // Add actual dates
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }

  return dates;
}
