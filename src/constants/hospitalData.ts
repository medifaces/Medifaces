export interface UnitCategory {
  category: string;
  units: string[];
}

export const HOSPITAL_UNIT_CATEGORIES: UnitCategory[] = [
  {
    category: 'Pelayanan Medis',
    units: [
      'Rawat Inap',
      'Rawat Jalan / Poli',
      'Instalasi Gawat Darurat (UGD/IGD)',
      'Intensive Care Unit (ICU)',
      'Kamar Operasi (OK)',
      'Kebidanan & Kandungan (VK)',
      'Anak / Perinatologi',
      'Hemodialisa',
    ],
  },
  {
    category: 'Penunjang Medis',
    units: [
      'Instalasi Farmasi',
      'Laboratorium Patologi & Klinik',
      'Radiologi & Imaging',
      'Instalasi Gizi Medis',
      'Rehabilitasi Medik / Fisioterapi',
      'Rekam Medis & Info Medis',
    ],
  },
  {
    category: 'Administrasi & Manajemen',
    units: [
      'Administrasi Umum & Sekretariat',
      'Keuangan & Akuntansi',
      'Manajemen Sumber Daya Manusia (MSDM)',
      'Pendaftaran & Admisi',
      'Kasir Rumah Sakit',
      'IT & SIMRS',
      'Humas & Pemasaran',
      'Pengadaan & Logistik Farmasi',
    ],
  },
  {
    category: 'Pendukung & Operasional',
    units: [
      'Keamanan (Satpam / Security)',
      'Pengelolaan Parkir',
      'Kebersihan (Cleaning Service)',
      'Driver & Ambulans',
      'Teknisi & IPSRS (Sarana Prasarana)',
      'Laundry & Linen',
      'Dapur & Logistik Gizi',
      'Koperasi Rumah Sakit',
    ],
  },
];

export const ALL_HOSPITAL_UNITS: string[] = HOSPITAL_UNIT_CATEGORIES.flatMap(cat => cat.units);

export const HOSPITAL_ROLES: string[] = [
  // Medis & Perawatan
  'Dokter Spesialis',
  'Dokter Umum',
  'Kepala Ruangan / Perawat Primer',
  'Perawat Pelaksana',
  'Bidan Pelaksana',
  // Penunjang Medis
  'Apoteker',
  'Tenaga Teknis Kefarmasian',
  'Pranata Laboratorium / Analis Lab',
  'Radiografer',
  'Nutrisionis / Dietisien',
  'Fisioterapis',
  'Perekam Medis',
  // Administrasi & Manajemen
  'Staf Administrasi Umum',
  'Staf Keuangan & Akuntansi',
  'Kasir Rumah Sakit',
  'Petugas Pendaftaran / Admisi',
  'Staf IT & SIMRS',
  'Staf Humas & Layanan Pelanggan',
  'Staf Logistik & Pengadaan',
  // Operasional & Pendukung
  'Petugas Keamanan / Satpam',
  'Petugas Parkir',
  'Cleaning Service / Pramubakti',
  'Pengemudi Ambulans / Driver',
  'Teknisi IPSRS / Elektromedik',
  'Staf Laundry & Sterilisasi Linen',
  'Juru Masak / Petugas Dapur',
  'Pengelola Koperasi',
];

export const OTHER_OPTION = 'Lainnya (Tulis Sendiri)';

export const getUnitCategory = (unitName: string): string => {
  for (const cat of HOSPITAL_UNIT_CATEGORIES) {
    if (cat.units.includes(unitName)) {
      return cat.category;
    }
  }
  return 'Lainnya / Khusus';
};
