import { User, Shift, AbsensiRecord, PengajuanIzin, Pengaturan, AuditLog } from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('medifaces_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error('Server tidak dapat dihubungi. Periksa koneksi internet atau status server.');
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Layanan endpoint tidak ditemukan (404). Pastikan deployment backend aktif.');
      }
      if (res.status === 500 || res.status === 502) {
        throw new Error('Terjadi kendala pada server database (500). Silakan coba sesaat lagi.');
      }
      throw new Error(`Permintaan gagal dengan status ${res.status}.`);
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Permintaan gagal (status ${res.status}).`);
  }

  return data;
}

export const api = {
  // ── AUTHENTICATION ──
  async login(email: string, password: string, role_target?: string): Promise<{
    token: string;
    user: User;
    must_change_password?: boolean;
    is_profile_completed?: boolean;
    is_new_registration?: boolean;
  }> {
    return await apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password, role_target }),
    });
  },

  async completeProfile(data: {
    nama: string;
    nip: string;
    unit: string;
    jabatan: string;
    new_password: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    return await apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete_profile', ...data }),
    });
  },

  async changePassword(old_password: string, new_password: string): Promise<{ success: boolean; message: string }> {
    return await apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'change_password', old_password, new_password }),
    });
  },

  async updateProfile(data: {
    nama: string;
    email: string;
    no_hp?: string;
    foto_url?: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    return await apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_profile', ...data }),
    });
  },

  async enrolFace(face_descriptor: string, face_photo_ref?: string): Promise<{ success: boolean; message: string }> {
    return await apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'enrol_face', face_descriptor, face_photo_ref }),
    });
  },

  // ── ABSENSI ──
  async getStatusHariIni(): Promise<{
    record: AbsensiRecord | null;
    pengaturan: Pengaturan;
    shift: Shift;
    serverTime: string;
  }> {
    return await apiRequest('/absen', { method: 'GET' });
  },

  async kirimAbsen(data: {
    tipe: 'masuk' | 'pulang';
    lat: number;
    lng: number;
    is_simulated_gps: boolean;
    skor_wajah: number;
    liveness_passed: boolean;
    foto_base64: string;
    shift_id?: number;
  }): Promise<{ success: boolean; record: AbsensiRecord; message?: string }> {
    return await apiRequest('/absen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── DATA PEGAWAI (ADMIN) ──
  async getPegawai(search?: string, unit?: string): Promise<{ pegawai: any[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (unit && unit !== 'Semua Unit') params.append('unit', unit);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/pegawai${query}`, { method: 'GET' });
  },

  async tambahPegawai(data: {
    nip: string;
    nama: string;
    email: string;
    role?: 'sdm' | 'karyawan';
    jabatan?: string;
    unit?: string;
    lokasi_penempatan?: string;
    jam_kerja?: string;
  }): Promise<{ success: boolean; user: any }> {
    return await apiRequest('/pegawai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePegawai(id: number, data: {
    nip?: string;
    nama?: string;
    email?: string;
    jabatan?: string;
    unit?: string;
    lokasi_penempatan?: string;
    jam_kerja?: string;
    role?: 'sdm' | 'karyawan';
    no_hp?: string;
  }): Promise<{ success: boolean; message?: string; user?: any }> {
    return await apiRequest('/pegawai', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  },

  async toggleActivePegawai(id: number): Promise<{ success: boolean; message?: string }> {
    return await apiRequest('/pegawai', {
      method: 'PUT',
      body: JSON.stringify({ id, action: 'toggle_active' }),
    });
  },

  async resetPasswordPegawai(id: number): Promise<{ success: boolean; message: string }> {
    return await apiRequest('/pegawai', {
      method: 'PUT',
      body: JSON.stringify({ id, action: 'reset_password' }),
    });
  },

  // ── SHIFTS & JADWAL ──
  async getShifts(): Promise<{ shifts: Shift[]; jadwal: any[] }> {
    return await apiRequest('/shift', { method: 'GET' });
  },

  async updateJadwal(user_id: number, shift_id: number, hari: string, kode: string): Promise<{ success: boolean }> {
    return await apiRequest('/shift', {
      method: 'POST',
      body: JSON.stringify({ user_id, shift_id, hari, kode }),
    });
  },

  // ── IZIN & CUTI ──
  async getIzin(): Promise<{ list: PengajuanIzin[] }> {
    return await apiRequest('/izin', { method: 'GET' });
  },

  async submitIzin(data: {
    jenis: 'Sakit' | 'Izin' | 'Cuti';
    tanggal_mulai: string;
    tanggal_selesai: string;
    keterangan: string;
    dokumen_url?: string;
  }): Promise<{ success: boolean; item: PengajuanIzin }> {
    return await apiRequest('/izin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approveIzin(id: number, status: 'Disetujui' | 'Ditolak', catatan_admin?: string): Promise<{ success: boolean }> {
    return await apiRequest('/izin', {
      method: 'PUT',
      body: JSON.stringify({ id, status, catatan_admin }),
    });
  },

  // ── LAPORAN & RIWAYAT ──
  async getLaporan(params?: {
    unit?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    records: AbsensiRecord[];
    summary: {
      total: number;
      hadir: number;
      telat: number;
      sakit: number;
      izin: number;
      hadir_pct: number;
      telat_pct: number;
      sakit_pct: number;
      izin_pct: number;
    };
    rekapUnit: any[];
  }> {
    const q = new URLSearchParams();
    if (params?.unit) q.append('unit', params.unit);
    if (params?.status) q.append('status', params.status);
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date) q.append('end_date', params.end_date);
    const query = q.toString() ? `?${q.toString()}` : '';
    return await apiRequest(`/laporan${query}`, { method: 'GET' });
  },

  async koreksiAbsensi(id: number, status: string, keterangan: string): Promise<{ success: boolean }> {
    return await apiRequest('/laporan', {
      method: 'PUT',
      body: JSON.stringify({ id, status, keterangan }),
    });
  },

  // ── LIVE MONITORING ──
  async getLive(): Promise<{
    totalScans: number;
    successCount: number;
    rejectedCount: number;
    logs: AuditLog[];
    rejectionReasons: { name: string; count: number }[];
  }> {
    return await apiRequest('/live', { method: 'GET' });
  },

  // ── PENGATURAN SISTEM ──
  async getPengaturan(): Promise<{ pengaturan: Pengaturan }> {
    return await apiRequest('/pengaturan', { method: 'GET' });
  },

  async updatePengaturan(data: Partial<Pengaturan>): Promise<{ success: boolean; pengaturan: Pengaturan }> {
    return await apiRequest('/pengaturan', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
