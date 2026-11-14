import { User, Shift, AbsensiRecord, PengajuanIzin, Pengaturan, AuditLog } from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('medifaces_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Fallback in-browser storage when Netlify function is running offline
const LOCAL_STORAGE_KEY = 'medifaces_local_db_v1';

function getLocalDB() {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      // parse error, re-seed
    }
  }

  const initialDB = {
    pengaturan: {
      id: 1,
      nama_instansi: 'Fakultas Vokasi UI, Depok',
      pusat_lat: -6.3642,
      pusat_lng: 106.8285,
      radius_meter: 100,
      toleransi_telat_menit: 15,
      ambang_wajah_persen: 85,
      allow_gps_simulation: true,
    },
    shifts: [
      { id: 1, nama_shift: 'Shift Pagi', jam_masuk: '08:00', jam_pulang: '14:00', deskripsi: 'Pelayanan Pagi', is_active: true },
      { id: 2, nama_shift: '5 Hari Kerja', jam_masuk: '07:30', jam_pulang: '16:00', deskripsi: 'Staf Administrasi & Manajemen', is_active: true },
      { id: 3, nama_shift: 'Shift Siang', jam_masuk: '14:00', jam_pulang: '20:00', deskripsi: 'Pelayanan Siang', is_active: true },
      { id: 4, nama_shift: 'Shift Malam', jam_masuk: '20:00', jam_pulang: '08:00', deskripsi: 'Pelayanan Malam & UGD', is_active: true },
      { id: 5, nama_shift: '6 Hari Kerja', jam_masuk: '08:00', jam_pulang: '14:30', deskripsi: 'Staf Penunjang Medis', is_active: true },
      { id: 6, nama_shift: 'Koperasi - Sore', jam_masuk: '13:00', jam_pulang: '19:00', deskripsi: 'Staf Koperasi RS', is_active: true },
      { id: 7, nama_shift: 'Driver Pagi', jam_masuk: '06:00', jam_pulang: '14:00', deskripsi: 'Ambulans & Operasional Pagi', is_active: true },
      { id: 8, nama_shift: 'Driver Siang', jam_masuk: '14:00', jam_pulang: '22:00', deskripsi: 'Ambulans & Operasional Siang', is_active: true },
      { id: 9, nama_shift: 'Driver Subuh', jam_masuk: '03:00', jam_pulang: '11:00', deskripsi: 'Siaga Ambulans Dini Hari', is_active: true },
    ],
    users: [
      {
        id: 1,
        nip: 'SDM001',
        nama: 'Admin MSDM',
        email: 'sdm@vokasi.ui.ac.id',
        role: 'sdm',
        jabatan: 'Kepala Urusan MSDM',
        unit: 'Manajemen SDM',
        lokasi_penempatan: 'Gedung Administrasi Lt. 2',
        jam_kerja: '07.30 - 16.00 WIB',
        face_descriptor: null,
        face_photo_ref: null,
        is_active: true,
        must_change_password: true,
      },
      {
        id: 2,
        nip: '48',
        nama: 'Siti Mulia Rahmah',
        email: 'sitimuliarahmah@gmail.com',
        role: 'karyawan',
        jabatan: 'Perawat Pelaksana',
        unit: 'Instalasi Rawat Inap',
        lokasi_penempatan: 'Gedung A Lt. 2 - Vokasi UI',
        jam_kerja: '08.00 - 14.00 WIB',
        face_descriptor: null,
        face_photo_ref: null,
        is_active: true,
        must_change_password: true,
      },
      {
        id: 3,
        nip: '102',
        nama: 'dr. Andika Pratama, Sp.PD',
        email: 'andika.pratama@vokasi.ui.ac.id',
        role: 'karyawan',
        jabatan: 'Dokter Spesialis Penyakit Dalam',
        unit: 'Poli Penyakit Dalam',
        lokasi_penempatan: 'Gedung Rawat Jalan Lt. 1',
        jam_kerja: '08.00 - 14.00 WIB',
        face_descriptor: '{"enrolled": true}',
        is_active: true,
        must_change_password: false,
      },
      {
        id: 4,
        nip: '109',
        nama: 'Ns. Ratna Wulandari, S.Kep',
        email: 'ratna.wulandari@vokasi.ui.ac.id',
        role: 'karyawan',
        jabatan: 'Perawat UGD',
        unit: 'Instalasi Gawat Darurat (UGD)',
        lokasi_penempatan: 'Gedung UGD Lt. 1',
        jam_kerja: '08.00 - 14.00 WIB',
        face_descriptor: '{"enrolled": true}',
        is_active: true,
        must_change_password: false,
      },
      {
        id: 5,
        nip: '115',
        nama: 'Budi Santoso, S.Farm, Apt',
        email: 'budi.santoso@vokasi.ui.ac.id',
        role: 'karyawan',
        jabatan: 'Apoteker Penanggung Jawab',
        unit: 'Instalasi Farmasi',
        lokasi_penempatan: 'Gedung Penunjang Medis Lt. 1',
        jam_kerja: '08.00 - 14.00 WIB',
        face_descriptor: null,
        is_active: true,
        must_change_password: false,
      }
    ],
    absensi: [
      {
        id: 1,
        user_id: 3,
        user_nama: 'dr. Andika Pratama, Sp.PD',
        user_nip: '102',
        user_unit: 'Poli Penyakit Dalam',
        shift_id: 1,
        shift_nama: 'Shift Pagi',
        tanggal: new Date().toISOString().split('T')[0],
        jam_masuk: '07:48:12',
        jam_pulang: null,
        status: 'Hadir',
        jarak_meter: 32.5,
        skor_wajah: 94.2,
        keterangan: 'Tepat waktu',
      },
      {
        id: 2,
        user_id: 4,
        user_nama: 'Ns. Ratna Wulandari, S.Kep',
        user_nip: '109',
        user_unit: 'Instalasi Gawat Darurat (UGD)',
        shift_id: 1,
        shift_nama: 'Shift Pagi',
        tanggal: new Date().toISOString().split('T')[0],
        jam_masuk: '08:22:10',
        jam_pulang: null,
        status: 'Telat',
        jarak_meter: 41.0,
        skor_wajah: 91.8,
        keterangan: 'Terlambat 22 menit',
      }
    ],
    pengajuan_izin: [
      {
        id: 1,
        user_id: 5,
        user_nama: 'Budi Santoso, S.Farm, Apt',
        user_nip: '115',
        user_unit: 'Instalasi Farmasi',
        jenis: 'Sakit',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        keterangan: 'Demam tinggi dan radang tenggorokan (Surat dokter terlampir)',
        dokumen_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
        status: 'Menunggu',
        created_at: new Date().toISOString(),
      }
    ],
    audit_log: [
      {
        id: 1,
        user_id: 3,
        user_nama: 'dr. Andika Pratama, Sp.PD',
        action: 'Absen Masuk',
        status: 'SUCCESS',
        alasan: 'Verifikasi wajah 94.2% & Geofencing 32.5m valid',
        jarak_meter: 32.5,
        skor_wajah: 94.2,
        ip_address: '10.20.14.88',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 2,
        user_id: 4,
        user_nama: 'Ns. Ratna Wulandari, S.Kep',
        action: 'Absen Masuk',
        status: 'SUCCESS',
        alasan: 'Verifikasi wajah 91.8% & Geofencing 41.0m valid (Telat)',
        jarak_meter: 41.0,
        skor_wajah: 91.8,
        ip_address: '10.20.14.92',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 3,
        user_id: 2,
        user_nama: 'Siti Mulia Rahmah',
        action: 'Pindai Wajah Gagal',
        status: 'REJECTED',
        alasan: 'Di luar radius geofencing (142 m > batas 100 m)',
        jarak_meter: 142.0,
        skor_wajah: 88.5,
        ip_address: '180.252.12.11',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 4,
        user_id: 5,
        user_nama: 'Budi Santoso, S.Farm, Apt',
        action: 'Pindai Wajah Gagal',
        status: 'REJECTED',
        alasan: 'Kemiripan wajah di bawah ambang batas (71% < 85%)',
        jarak_meter: 15.0,
        skor_wajah: 71.0,
        ip_address: '10.20.14.105',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ]
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
}

function saveLocalDB(db: any) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

export const api = {
  // AUTH
  async login(email: string, password: string, role_target?: string) {
    try {
      const res = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role_target }),
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login gagal.');
    } catch (err: any) {
      // Local fallback for offline sandbox
      const db = getLocalDB();
      const clean = email.trim().toLowerCase();
      const user = db.users.find((u: any) => u.email.toLowerCase() === clean || u.nip.toLowerCase() === clean);
      if (!user) {
        throw new Error('Akun tidak terdaftar. Hubungi Admin MSDM untuk aktivasi.');
      }
      if (role_target && user.role !== role_target) {
        throw new Error(role_target === 'sdm' ? 'Akun ini tidak memiliki hak akses Portal MSDM.' : 'Silakan gunakan tab Portal MSDM untuk login admin.');
      }
      // Check password (accept 'vokasi123' or user password)
      if (password !== 'vokasi123' && password !== user.password) {
        throw new Error('Kata sandi salah.');
      }

      const mockToken = 'mock_jwt_token_' + user.id + '_' + Date.now();
      return {
        token: mockToken,
        user,
        must_change_password: user.must_change_password,
      };
    }
  },

  async changePassword(old_password: string, new_password: string) {
    try {
      const res = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'change_password', old_password, new_password }),
      });
      if (res.ok) return await res.json();
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Gagal mengubah kata sandi.');
    } catch (err: any) {
      const db = getLocalDB();
      const currentUserId = Number(localStorage.getItem('medifaces_current_user_id') || 2);
      const user = db.users.find((u: any) => u.id === currentUserId);
      if (user) {
        user.must_change_password = false;
        user.password = new_password;
        saveLocalDB(db);
      }
      return { success: true, message: 'Kata sandi berhasil diperbarui.' };
    }
  },

  async updateProfile(data: { nama: string; email: string; no_hp?: string; foto_url?: string }) {
    try {
      const res = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'update_profile', ...data }),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui profil.');
    } catch (e: any) {
      const db = getLocalDB();
      const currentUserId = Number(localStorage.getItem('medifaces_current_user_id'));
      if (!currentUserId) throw new Error('Pengguna tidak terautentikasi.');

      const cleanEmail = data.email.trim().toLowerCase();
      // Validasi keunikan email di antara akun lain
      const isTaken = db.users.some((u: any) => u.email.toLowerCase() === cleanEmail && u.id !== currentUserId);
      if (isTaken) {
        throw new Error('Email sudah digunakan oleh akun lain. Gunakan email berbeda.');
      }

      const user = db.users.find((u: any) => u.id === currentUserId);
      if (!user) throw new Error('Pengguna tidak ditemukan.');

      const oldEmail = user.email;
      const emailChanged = oldEmail.toLowerCase() !== cleanEmail;

      user.nama = data.nama.trim();
      user.email = cleanEmail;
      if (data.no_hp !== undefined) user.no_hp = data.no_hp;
      if (data.foto_url) user.foto_url = data.foto_url;

      if (emailChanged) {
        db.audit_log.unshift({
          id: db.audit_log.length + 1,
          user_id: currentUserId,
          user_nama: user.nama,
          action: 'Ubah Email Akun',
          status: 'SUCCESS',
          alasan: `Email diubah dari ${oldEmail} menjadi ${cleanEmail}`,
          created_at: new Date().toISOString(),
        });
      }

      saveLocalDB(db);
      return { success: true, message: 'Profil berhasil diperbarui.', user };
    }
  },

  async enrolFace(face_descriptor: string, face_photo_ref?: string) {
    try {
      const res = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'enrol_face', face_descriptor, face_photo_ref }),
      });
      if (res.ok) return await res.json();
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Gagal mendaftarkan wajah.');
    } catch (err: any) {
      const db = getLocalDB();
      const currentUserId = Number(localStorage.getItem('medifaces_current_user_id') || 2);
      const user = db.users.find((u: any) => u.id === currentUserId);
      if (user) {
        user.face_descriptor = face_descriptor;
        user.face_photo_ref = face_photo_ref;
        saveLocalDB(db);
      }
      return { success: true, message: 'Data wajah berhasil didaftarkan.' };
    }
  },

  // ABSENSI
  async getStatusHariIni() {
    try {
      const res = await fetch(`${BASE_URL}/absen`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    const db = getLocalDB();
    const currentUserId = Number(localStorage.getItem('medifaces_current_user_id') || 2);
    const today = new Date().toISOString().split('T')[0];
    const record = db.absensi.find((a: any) => a.user_id === currentUserId && a.tanggal === today) || null;
    return {
      record,
      pengaturan: db.pengaturan,
      shift: db.shifts[0],
      serverTime: new Date().toISOString(),
    };
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
  }) {
    try {
      const res = await fetch(`${BASE_URL}/absen`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memproses absensi.');
    } catch (e: any) {
      // Offline fallback processing
      const db = getLocalDB();
      const currentUserId = Number(localStorage.getItem('medifaces_current_user_id') || 2);
      const currentUser = db.users.find((u: any) => u.id === currentUserId) || db.users[1];
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      // Geofencing verification
      const R = 6371e3;
      const lat1 = data.lat * Math.PI / 180;
      const lat2 = db.pengaturan.pusat_lat * Math.PI / 180;
      const dLat = (db.pengaturan.pusat_lat - data.lat) * Math.PI / 180;
      const dLon = (db.pengaturan.pusat_lng - data.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

      if (distance > db.pengaturan.radius_meter) {
        const errorMsg = `Di luar radius geofencing (${distance} m > batas ${db.pengaturan.radius_meter} m). Anda harus berada di area RS / Vokasi UI.`;
        db.audit_log.unshift({
          id: db.audit_log.length + 1,
          user_id: currentUserId,
          user_nama: currentUser.nama,
          action: `Pindai Wajah (${data.tipe}) Ditolak`,
          status: 'REJECTED',
          alasan: errorMsg,
          jarak_meter: distance,
          skor_wajah: data.skor_wajah,
          created_at: new Date().toISOString(),
        });
        saveLocalDB(db);
        throw new Error(errorMsg);
      }

      if (!data.liveness_passed) {
        const errorMsg = 'Verifikasi liveness gagal (tidak ada kedipan terdeteksi).';
        db.audit_log.unshift({
          id: db.audit_log.length + 1,
          user_id: currentUserId,
          user_nama: currentUser.nama,
          action: `Pindai Wajah (${data.tipe}) Ditolak`,
          status: 'REJECTED',
          alasan: errorMsg,
          jarak_meter: distance,
          skor_wajah: data.skor_wajah,
          created_at: new Date().toISOString(),
        });
        saveLocalDB(db);
        throw new Error(errorMsg);
      }

      if (data.skor_wajah < db.pengaturan.ambang_wajah_persen) {
        const errorMsg = `Kemiripan wajah tidak mencukupi (${Math.round(data.skor_wajah)}% < ambang ${db.pengaturan.ambang_wajah_persen}%).`;
        db.audit_log.unshift({
          id: db.audit_log.length + 1,
          user_id: currentUserId,
          user_nama: currentUser.nama,
          action: `Pindai Wajah (${data.tipe}) Ditolak`,
          status: 'REJECTED',
          alasan: errorMsg,
          jarak_meter: distance,
          skor_wajah: data.skor_wajah,
          created_at: new Date().toISOString(),
        });
        saveLocalDB(db);
        throw new Error(errorMsg);
      }

      let existing = db.absensi.find((ab: any) => ab.user_id === currentUserId && ab.tanggal === today);
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15);
      const status = isLate ? 'Telat' : 'Hadir';

      if (data.tipe === 'masuk') {
        if (!existing) {
          existing = {
            id: db.absensi.length + 1,
            user_id: currentUserId,
            user_nama: currentUser.nama,
            user_nip: currentUser.nip,
            user_unit: currentUser.unit,
            shift_id: data.shift_id || 1,
            shift_nama: 'Shift Pagi',
            tanggal: today,
            jam_masuk: timeStr,
            jam_pulang: null,
            status,
            jarak_meter: distance,
            skor_wajah: data.skor_wajah,
            foto_masuk: data.foto_base64,
            foto_pulang: null,
            keterangan: isLate ? 'Terlambat masuk' : 'Tepat waktu',
          };
          db.absensi.push(existing);
        } else {
          existing.jam_masuk = timeStr;
          existing.status = status;
          existing.jarak_meter = distance;
          existing.skor_wajah = data.skor_wajah;
          existing.foto_masuk = data.foto_base64;
        }
      } else {
        if (!existing) {
          existing = {
            id: db.absensi.length + 1,
            user_id: currentUserId,
            user_nama: currentUser.nama,
            user_nip: currentUser.nip,
            user_unit: currentUser.unit,
            shift_id: data.shift_id || 1,
            shift_nama: 'Shift Pagi',
            tanggal: today,
            jam_masuk: timeStr,
            jam_pulang: timeStr,
            status: 'Hadir',
            jarak_meter: distance,
            skor_wajah: data.skor_wajah,
            foto_masuk: '',
            foto_pulang: data.foto_base64,
            keterangan: 'Absen selesai',
          };
          db.absensi.push(existing);
        } else {
          existing.jam_pulang = timeStr;
          existing.foto_pulang = data.foto_base64;
        }
      }

      db.audit_log.unshift({
        id: db.audit_log.length + 1,
        user_id: currentUserId,
        user_nama: currentUser.nama,
        action: `Absen ${data.tipe === 'masuk' ? 'Masuk' : 'Pulang'}`,
        status: 'SUCCESS',
        alasan: `Verifikasi wajah ${Math.round(data.skor_wajah)}% & Geofencing ${distance}m valid (${status})`,
        jarak_meter: distance,
        skor_wajah: data.skor_wajah,
        created_at: new Date().toISOString(),
      });

      saveLocalDB(db);
      return { success: true, message: `Absen ${data.tipe} berhasil!`, record: existing };
    }
  },

  // PEGAWAI CRUD (SDM)
  async getPegawai(search?: string, unit?: string) {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (unit) q.append('unit', unit);
      const res = await fetch(`${BASE_URL}/pegawai?${q.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    let list = db.users.map((u: any) => ({
      ...u,
      face_registered: !!u.face_descriptor,
    }));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((u: any) => u.nama.toLowerCase().includes(s) || u.nip.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (unit && unit !== 'Semua Unit') {
      list = list.filter((u: any) => u.unit === unit);
    }
    return { pegawai: list };
  },

  async tambahPegawai(data: Partial<User>) {
    try {
      const res = await fetch(`${BASE_URL}/pegawai`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambah staf.');
    } catch (e: any) {
      const db = getLocalDB();
      const dup = db.users.find((u: any) => u.email.toLowerCase() === data.email?.toLowerCase() || u.nip === data.nip);
      if (dup) throw new Error('Email atau NIP sudah terdaftar.');
      const newUser = {
        id: db.users.length + 1,
        nip: data.nip,
        nama: data.nama,
        email: data.email,
        role: data.role || 'karyawan',
        jabatan: data.jabatan || 'Staf Medis',
        unit: data.unit || 'Instalasi Rawat Inap',
        lokasi_penempatan: data.lokasi_penempatan || 'Gedung A Lt. 2',
        jam_kerja: data.jam_kerja || '08.00 - 14.00 WIB',
        is_active: true,
        must_change_password: true,
      };
      db.users.push(newUser);
      saveLocalDB(db);
      return { success: true, user: newUser };
    }
  },

  async toggleActivePegawai(id: number) {
    try {
      const res = await fetch(`${BASE_URL}/pegawai`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, action: 'toggle_active' }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    const u = db.users.find((usr: any) => usr.id === id);
    if (u) {
      u.is_active = !u.is_active;
      saveLocalDB(db);
    }
    return { success: true };
  },

  async resetPasswordPegawai(id: number) {
    try {
      const res = await fetch(`${BASE_URL}/pegawai`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, action: 'reset_password' }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    const u = db.users.find((usr: any) => usr.id === id);
    if (u) {
      u.must_change_password = true;
      u.password = 'vokasi123';
      saveLocalDB(db);
    }
    return { success: true, message: 'Kata sandi berhasil di-reset ke nilai seed.' };
  },

  // SHIFTS
  async getShifts() {
    try {
      const res = await fetch(`${BASE_URL}/shift`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getLocalDB();
    return { shifts: db.shifts, jadwal: [] };
  },

  // IZIN & CUTI
  async getIzin() {
    try {
      const res = await fetch(`${BASE_URL}/izin`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getLocalDB();
    return { list: db.pengajuan_izin };
  },

  async submitIzin(data: {
    jenis: 'Sakit' | 'Izin' | 'Cuti';
    tanggal_mulai: string;
    tanggal_selesai: string;
    keterangan: string;
    dokumen_url?: string;
  }) {
    try {
      const res = await fetch(`${BASE_URL}/izin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengajukan permohonan.');
    } catch (e: any) {
      const db = getLocalDB();
      const currentUserId = Number(localStorage.getItem('medifaces_current_user_id') || 2);
      const currentUser = db.users.find((u: any) => u.id === currentUserId) || db.users[1];
      const newItem = {
        id: db.pengajuan_izin.length + 1,
        user_id: currentUserId,
        user_nama: currentUser.nama,
        user_nip: currentUser.nip,
        user_unit: currentUser.unit,
        jenis: data.jenis,
        tanggal_mulai: data.tanggal_mulai,
        tanggal_selesai: data.tanggal_selesai,
        keterangan: data.keterangan,
        dokumen_url: data.dokumen_url,
        status: 'Menunggu',
        created_at: new Date().toISOString(),
      };
      db.pengajuan_izin.unshift(newItem);
      saveLocalDB(db);
      return { success: true, item: newItem };
    }
  },

  async approveIzin(id: number, status: 'Disetujui' | 'Ditolak', catatan_admin?: string) {
    try {
      const res = await fetch(`${BASE_URL}/izin`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, status, catatan_admin }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    const item = db.pengajuan_izin.find((p: any) => p.id === id);
    if (item) {
      item.status = status;
      item.catatan_admin = catatan_admin;
      saveLocalDB(db);
    }
    return { success: true };
  },

  // LAPORAN & RIWAYAT
  async getLaporan(params?: { unit?: string; status?: string; start_date?: string; end_date?: string }) {
    try {
      const q = new URLSearchParams();
      if (params?.unit) q.append('unit', params.unit);
      if (params?.status) q.append('status', params.status);
      if (params?.start_date) q.append('start_date', params.start_date);
      if (params?.end_date) q.append('end_date', params.end_date);
      const res = await fetch(`${BASE_URL}/laporan?${q.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    let records = [...db.absensi];
    if (params?.unit && params.unit !== 'Semua Unit') {
      records = records.filter((r: any) => r.user_unit === params.unit);
    }
    if (params?.status && params.status !== 'Semua Status') {
      records = records.filter((r: any) => r.status === params.status);
    }

    const total = records.length || 1;
    const hadir = records.filter((r: any) => r.status === 'Hadir').length;
    const telat = records.filter((r: any) => r.status === 'Telat').length;
    const sakit = records.filter((r: any) => r.status === 'Sakit').length;
    const izin = records.filter((r: any) => r.status === 'Izin').length;

    const unitMap: Record<string, any> = {};
    db.users.filter((u: any) => u.role === 'karyawan').forEach((u: any) => {
      if (!unitMap[u.unit]) unitMap[u.unit] = { unit: u.unit, total: 0, hadir: 0, telat: 0 };
      unitMap[u.unit].total += 1;
    });
    records.forEach((r: any) => {
      if (unitMap[r.user_unit]) {
        if (r.status === 'Hadir') unitMap[r.user_unit].hadir += 1;
        if (r.status === 'Telat') unitMap[r.user_unit].telat += 1;
      }
    });

    const rekapUnit = Object.values(unitMap).map((u: any) => ({
      ...u,
      persentase: u.total > 0 ? Math.round((u.hadir / u.total) * 100) : 0,
    }));

    return {
      records,
      summary: {
        total: records.length,
        hadir,
        telat,
        sakit,
        izin,
        hadir_pct: Math.round((hadir / total) * 100),
        telat_pct: Math.round((telat / total) * 100),
        sakit_pct: Math.round((sakit / total) * 100),
        izin_pct: Math.round((izin / total) * 100),
      },
      rekapUnit,
    };
  },

  async koreksiAbsensi(id: number, status: string, keterangan: string) {
    try {
      const res = await fetch(`${BASE_URL}/laporan`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, status, keterangan }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getLocalDB();
    const item = db.absensi.find((a: any) => a.id === id);
    if (item) {
      item.status = status;
      item.keterangan = keterangan;
      saveLocalDB(db);
    }
    return { success: true };
  },

  // LIVE MONITORING
  async getLive() {
    try {
      const res = await fetch(`${BASE_URL}/live`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    const logs = db.audit_log || [];
    return {
      totalScans: logs.length,
      successCount: logs.filter((l: any) => l.status === 'SUCCESS').length,
      rejectedCount: logs.filter((l: any) => l.status === 'REJECTED').length,
      logs: logs.slice(0, 30),
      rejectionReasons: [
        { name: 'Di Luar Radius Geofencing', count: logs.filter((l: any) => (l.alasan || '').toLowerCase().includes('radius')).length },
        { name: 'Wajah Tidak Cocok (< Ambang)', count: logs.filter((l: any) => (l.alasan || '').toLowerCase().includes('wajah') || (l.alasan || '').toLowerCase().includes('kemiripan')).length },
        { name: 'Liveness / Kedipan Gagal', count: logs.filter((l: any) => (l.alasan || '').toLowerCase().includes('liveness') || (l.alasan || '').toLowerCase().includes('kedip')).length },
        { name: 'GPS Nonaktif / Palsu', count: logs.filter((l: any) => (l.alasan || '').toLowerCase().includes('gps')).length },
      ],
    };
  },

  // PENGATURAN
  async getPengaturan() {
    try {
      const res = await fetch(`${BASE_URL}/pengaturan`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    const db = getLocalDB();
    return { pengaturan: db.pengaturan };
  },

  async updatePengaturan(data: Partial<Pengaturan>) {
    try {
      const res = await fetch(`${BASE_URL}/pengaturan`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const db = getLocalDB();
    db.pengaturan = { ...db.pengaturan, ...data };
    saveLocalDB(db);
    return { success: true, pengaturan: db.pengaturan };
  },
};
