import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Camera, CheckCircle2, ShieldCheck, Lock, LogOut, Building, Clock, IdCard } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingPass, setLoadingPass] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(!!user?.face_descriptor);
  const [enrolMsg, setEnrolMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setLoadingPass(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setLoadingPass(false);
    }
  };

  const handleEnrolFace = async () => {
    setEnrolMsg(null);
    try {
      // Simulasikan pendaftaran fitur wajah biometrik (embedding 128 dimensi)
      const mockVector = JSON.stringify({
        enrolled: true,
        version: '1.0',
        timestamp: new Date().toISOString(),
      });
      await api.enrolFace(mockVector);
      setFaceEnrolled(true);
      updateUser({ face_descriptor: mockVector });
      setEnrolMsg('Data biometrik wajah berhasil diperbarui dan disimpan!');
      setTimeout(() => setEnrolMsg(null), 4000);
    } catch (err: any) {
      setEnrolMsg('Gagal memperbarui data wajah.');
    }
  };

  const initials = (user?.nama || 'SM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-[12px] pb-6">
      {/* Header */}
      <div className="pt-1">
        <h2 className="text-[18px] font-extrabold text-[#0F2E4C] leading-none">
          Profil Pegawai
        </h2>
        <span className="text-[11px] font-semibold text-[#2F6A94] mt-0.5 block">
          Identitas dan pengaturan keamanan akun
        </span>
      </div>

      {/* Kartu Profil Utama */}
      <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5] flex flex-col items-center text-center">
        {/* Foto 96px radius 32px + tombol kamera kecil */}
        <div className="relative mb-3">
          <div className="w-[96px] h-[96px] rounded-[32px] bg-[#1479BD] text-white font-extrabold text-[32px] flex items-center justify-center shadow-md">
            {initials}
          </div>
          <button
            type="button"
            aria-label="Ubah Foto Profil"
            className="w-8 h-8 rounded-full bg-[#0F2E4C] text-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-md hover:bg-[#17406A] transition active:scale-95 border-2 border-white"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-[18px] font-extrabold text-[#0F2E4C]">{user?.nama || 'Siti Mulia Rahmah'}</h3>
        <span className="text-xs font-bold text-[#1479BD] mt-0.5 block">{user?.jabatan || 'Perawat Pelaksana'}</span>
        <span className="text-[11px] text-[#2F6A94] font-medium mt-0.5 block">{user?.unit || 'Instalasi Rawat Inap'}</span>

        {/* Informasi Detail: NIP, Jam Kerja, Penempatan */}
        <div className="w-full grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-[#DCEDF8] text-left text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#DCEDF8]/60">
            <IdCard className="w-4 h-4 text-[#1479BD] flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#2F6A94] block">NIP Karyawan</span>
              <span className="font-extrabold text-[#0F2E4C]">{user?.nip || '48'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#DCEDF8]/60">
            <Clock className="w-4 h-4 text-[#1479BD] flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#2F6A94] block">Jam Kerja Operasional</span>
              <span className="font-extrabold text-[#0F2E4C]">{user?.jam_kerja || '08.00 - 14.00 WIB'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#DCEDF8]/60">
            <Building className="w-4 h-4 text-[#1479BD] flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#2F6A94] block">Lokasi Penempatan</span>
              <span className="font-extrabold text-[#0F2E4C]">{user?.lokasi_penempatan || 'Gedung A Lt. 2 - Vokasi UI'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kartu "Data Wajah" (Badge Terdaftar + Tombol Perbarui) */}
      <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1479BD]" />
            <span className="text-sm font-extrabold text-[#0F2E4C]">Data Biometrik Wajah</span>
          </div>
          <StatusBadge status={faceEnrolled ? 'Terdaftar' : 'Belum Terdaftar'} size="sm" />
        </div>

        <p className="text-xs text-[#2F6A94] leading-relaxed mb-4">
          Data template wajah digunakan untuk mencocokkan wajah saat memindai kamera absensi dengan teknologi liveness check.
        </p>

        {enrolMsg && (
          <div className="mb-3 p-2.5 bg-blue-50 border border-[#1479BD]/30 text-[#1479BD] rounded-[12px] text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{enrolMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleEnrolFace}
          className="w-full h-[46px] rounded-full bg-[#1479BD] text-white font-bold text-xs tracking-wide hover:bg-[#10659e] transition flex items-center justify-center gap-2 active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>{faceEnrolled ? 'Perbarui Template Wajah' : 'Daftarkan Wajah Sekarang'}</span>
        </button>
      </div>

      {/* Form Sandi Baru + Tombol Simpan */}
      <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5]">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-[#1479BD]" />
          <span className="text-sm font-extrabold text-[#0F2E4C]">Keamanan & Kata Sandi</span>
        </div>

        {passwordMsg && (
          <div
            className={`mb-3 p-2.5 rounded-[12px] text-xs font-semibold ${
              passwordMsg.type === 'success'
                ? 'bg-blue-50 border border-[#1479BD]/30 text-[#1479BD]'
                : 'bg-red-50 border border-[#D14343]/30 text-[#D14343]'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama"
              className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <button
            type="submit"
            disabled={loadingPass}
            className="w-full h-[48px] rounded-full bg-[#1479BD] text-white font-bold text-xs tracking-wide hover:bg-[#10659e] transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loadingPass ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Tombol Logout */}
      <button
        type="button"
        onClick={logout}
        className="w-full h-[52px] rounded-full border-2 border-[#D14343] text-[#D14343] font-extrabold text-xs tracking-wide hover:bg-red-50 transition flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  );
};
