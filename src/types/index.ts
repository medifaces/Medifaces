export type Role = 'sdm' | 'karyawan';

export interface User {
  id: number;
  nip: string;
  nama: string;
  email: string;
  no_hp?: string;
  role: Role;
  jabatan: string;
  unit: string;
  lokasi_penempatan?: string;
  jam_kerja?: string;
  foto_url?: string;
  face_descriptor?: string; // JSON string
  face_photo_ref?: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at?: string;
}

export interface Shift {
  id: number;
  nama_shift: string;
  jam_masuk: string;
  jam_pulang: string;
  deskripsi?: string;
  is_active?: boolean;
}

export interface Jadwal {
  id: number;
  user_id: number;
  shift_id: number;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  kode: 'P' | 'S' | 'M' | 'L'; // Pagi, Siang, Malam, Libur
}

export interface AbsensiRecord {
  id: number;
  user_id: number;
  user_nama?: string;
  user_nip?: string;
  user_unit?: string;
  shift_id?: number;
  shift_nama?: string;
  tanggal: string; // YYYY-MM-DD
  jam_masuk?: string;
  jam_pulang?: string;
  status: 'Hadir' | 'Telat' | 'Sakit' | 'Izin' | 'Alpha';
  jarak_meter: number;
  skor_wajah: number;
  foto_masuk?: string;
  foto_pulang?: string;
  lat?: number;
  lng?: number;
  is_simulated_gps?: boolean;
  keterangan?: string;
  created_at?: string;
}

export interface PengajuanIzin {
  id: number;
  user_id: number;
  user_nama?: string;
  user_nip?: string;
  user_unit?: string;
  jenis: 'Sakit' | 'Izin' | 'Cuti';
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  dokumen_url?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  catatan_admin?: string;
  approved_by?: number;
  created_at: string;
}

export interface Pengaturan {
  id: number;
  nama_instansi: string;
  pusat_lat: number;
  pusat_lng: number;
  radius_meter: number;
  toleransi_telat_menit: number;
  ambang_wajah_persen: number;
  allow_gps_simulation: boolean;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_nama?: string;
  action: string;
  status: 'SUCCESS' | 'REJECTED';
  alasan?: string;
  jarak_meter?: number;
  skor_wajah?: number;
  ip_address?: string;
  created_at: string;
}
