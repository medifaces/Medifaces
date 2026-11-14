-- ══════════════════════════════════════════════════════════════════════════════
-- MEDIFACES v1.0 — PostgreSQL Database Schema (Neon / Supabase / Standard PG)
-- Tagline: Smart Attendance, Better Healthcare.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Pengaturan Sistem (Geofencing, Toleransi, Ambang Wajah)
CREATE TABLE IF NOT EXISTS pengaturan (
    id SERIAL PRIMARY KEY,
    nama_instansi VARCHAR(255) NOT NULL DEFAULT 'Fakultas Vokasi UI / RS Mitra',
    pusat_lat NUMERIC(10, 7) NOT NULL DEFAULT -6.3642000,
    pusat_lng NUMERIC(10, 7) NOT NULL DEFAULT 106.8285000,
    radius_meter INT NOT NULL DEFAULT 100,
    toleransi_telat_menit INT NOT NULL DEFAULT 15,
    ambang_wajah_persen INT NOT NULL DEFAULT 85,
    allow_gps_simulation BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    nama_shift VARCHAR(100) NOT NULL,
    jam_masuk TIME NOT NULL,
    jam_pulang TIME NOT NULL,
    deskripsi VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (SDM & Karyawan)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('sdm', 'karyawan')),
    jabatan VARCHAR(100) NOT NULL DEFAULT 'Staf Medis',
    unit VARCHAR(100) NOT NULL DEFAULT 'Instalasi Rawat Inap',
    lokasi_penempatan VARCHAR(150) DEFAULT 'Gedung A Lt. 2 - Vokasi UI',
    jam_kerja VARCHAR(100) DEFAULT '08.00 - 14.00 WIB',
    foto_url TEXT,
    face_descriptor TEXT, -- JSON vector descriptor
    face_photo_ref TEXT, -- Base64 reference image
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jadwal Mingguan Pegawai
CREATE TABLE IF NOT EXISTS jadwal (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id INT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    hari VARCHAR(20) NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    tanggal DATE,
    kode VARCHAR(10) NOT NULL DEFAULT 'P', -- P: Pagi, S: Siang, M: Malam, L: Libur
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Transaksi Absensi
CREATE TABLE IF NOT EXISTS absensi (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id INT REFERENCES shifts(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jam_masuk TIMESTAMP WITH TIME ZONE,
    jam_pulang TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Telat', 'Sakit', 'Izin', 'Alpha')),
    jarak_meter NUMERIC(10, 2),
    skor_wajah NUMERIC(5, 2),
    foto_masuk TEXT, -- Base64 bukti scan masuk
    foto_pulang TEXT, -- Base64 bukti scan pulang
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    is_simulated_gps BOOLEAN DEFAULT FALSE,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Pengajuan Izin & Cuti
CREATE TABLE IF NOT EXISTS pengajuan_izin (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jenis VARCHAR(30) NOT NULL CHECK (jenis IN ('Sakit', 'Izin', 'Cuti')),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    keterangan TEXT NOT NULL,
    dokumen_url TEXT, -- Base64 dokumen atau bukti surat dokter
    status VARCHAR(20) NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak')),
    catatan_admin TEXT,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Log & Security Events (Live Attendance & Rejection Log)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'REJECTED')),
    alasan TEXT,
    jarak_meter NUMERIC(10, 2),
    skor_wajah NUMERIC(5, 2),
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA (UPSERT)
-- Catatan Keamanan: Hash di bawah adalah bcrypt standard untuk 'vokasi123'
-- ($2a$10$wE99Jb0ZJ2/7R8iU0kO9I.yJk3v2e.5T6c/H9Q1l0p.1z2y3x4w5v)
-- ══════════════════════════════════════════════════════════════════════════════

-- Insert Pengaturan Awal
INSERT INTO pengaturan (id, nama_instansi, pusat_lat, pusat_lng, radius_meter, toleransi_telat_menit, ambang_wajah_persen, allow_gps_simulation)
VALUES (1, 'Fakultas Vokasi UI, Depok', -6.3642000, 106.8285000, 100, 15, 85, TRUE)
ON CONFLICT (id) DO UPDATE SET
    pusat_lat = EXCLUDED.pusat_lat,
    pusat_lng = EXCLUDED.pusat_lng,
    radius_meter = EXCLUDED.radius_meter,
    toleransi_telat_menit = EXCLUDED.toleransi_telat_menit,
    ambang_wajah_persen = EXCLUDED.ambang_wajah_persen;

-- Insert Shifts
INSERT INTO shifts (id, nama_shift, jam_masuk, jam_pulang, deskripsi)
VALUES 
    (1, 'Shift Pagi', '08:00:00', '14:00:00', 'Pelayanan Pagi'),
    (2, '5 Hari Kerja', '07:30:00', '16:00:00', 'Staf Administrasi & Manajemen'),
    (3, 'Shift Siang', '14:00:00', '20:00:00', 'Pelayanan Siang'),
    (4, 'Shift Malam', '20:00:00', '08:00:00', 'Pelayanan Malam & UGD'),
    (5, '6 Hari Kerja', '08:00:00', '14:30:00', 'Staf Penunjang Medis'),
    (6, 'Koperasi - Sore', '13:00:00', '19:00:00', 'Staf Koperasi RS'),
    (7, 'Driver Pagi', '06:00:00', '14:00:00', 'Ambulans & Operasional Pagi'),
    (8, 'Driver Siang', '14:00:00', '22:00:00', 'Ambulans & Operasional Siang'),
    (9, 'Driver Subuh', '03:00:00', '11:00:00', 'Siaga Ambulans Dini Hari')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence shifts jika perlu
SELECT setval(pg_get_serial_sequence('shifts', 'id'), COALESCE(MAX(id), 1)) FROM shifts;

-- Insert Akun Seed Awal
-- Catatan: password_hash default di-generate untuk seed password awal 'vokasi123'
-- $2b$10$3p45uC5o6Hk8eW3X4/i6Z.475m8504EvyWw5rG4nfl.a2CekdKevK = bcrypt hash
INSERT INTO users (nip, nama, email, password_hash, role, jabatan, unit, lokasi_penempatan, jam_kerja, must_change_password, is_active)
VALUES 
    (
        'SDM001', 
        'Admin MSDM', 
        'sdm@vokasi.ui.ac.id', 
        '$2b$10$3p45uC5o6Hk8eW3X4/i6Z.475m8504EvyWw5rG4nfl.a2CekdKevK', 
        'sdm', 
        'Kepala Urusan MSDM', 
        'Manajemen SDM', 
        'Gedung Administrasi Lt. 2', 
        '07.30 - 16.00 WIB', 
        TRUE, 
        TRUE
    ),
    (
        '48', 
        'Siti Mulia Rahmah', 
        'sitimuliarahmah@gmail.com', 
        '$2b$10$3p45uC5o6Hk8eW3X4/i6Z.475m8504EvyWw5rG4nfl.a2CekdKevK', 
        'karyawan', 
        'Perawat Pelaksana', 
        'Instalasi Rawat Inap', 
        'Gedung A Lt. 2 - Vokasi UI', 
        '08.00 - 14.00 WIB', 
        TRUE, 
        TRUE
    )
ON CONFLICT (email) DO UPDATE SET
    nip = EXCLUDED.nip,
    nama = EXCLUDED.nama,
    role = EXCLUDED.role;
