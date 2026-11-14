import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MedicalLogo } from '../common/MedicalLogo';
import { User, IdCard, Building, Briefcase, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export const CompleteProfileScreen: React.FC<Props> = ({ onSuccess }) => {
  const { user, updateUser } = useAuth();

  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [unit, setUnit] = useState('Instalasi Rawat Inap');
  const [jabatan, setJabatan] = useState('Staf Medis');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const unitOptions = [
    'Instalasi Rawat Inap',
    'Instalasi Gawat Darurat (UGD)',
    'Poli Penyakit Dalam',
    'Instalasi Farmasi',
    'Kamar Operasi (OK)',
    'Laboratorium Patologi',
    'Radiologi',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedNama = nama.trim();
    const trimmedNip = nip.trim();

    if (!trimmedNama) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!trimmedNip) {
      setError('NIP pegawai wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword.toLowerCase() === 'vokasi123') {
      setError('Kata sandi baru tidak boleh sama dengan kata sandi awal (vokasi123).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.completeProfile({
        nama: trimmedNama,
        nip: trimmedNip,
        unit,
        jabatan: jabatan.trim() || 'Staf Medis',
        new_password: newPassword,
      });

      if (res.user) {
        updateUser(res.user);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil pegawai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DCEDF8] flex flex-col justify-between items-center p-5 selection:bg-[#BFE0F5]">
      <div className="w-full max-w-[390px] mx-auto flex flex-col pt-3 pb-6">
        {/* Logo Kotak Biru Palang Medis */}
        <div className="mb-5">
          <MedicalLogo size="md" />
        </div>

        {/* Hero Card */}
        <div className="bg-[#1479BD] rounded-[28px] p-[22px] text-white shadow-lg mb-3 relative overflow-hidden">
          <span className="text-[11px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white">
            Aktivasi Akun Pegawai
          </span>
          <h1 className="text-[28px] font-extrabold leading-[1.15] mt-3 tracking-tight">
            Lengkapi profil.
          </h1>
          <p className="text-[#BFE0F5] text-xs font-medium mt-1.5 leading-relaxed">
            Silakan lengkapi identitas rumah sakit dan buat kata sandi baru untuk mulai bertugas.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5]">
          {/* Email Info Badge */}
          <div className="mb-4 p-3 rounded-[14px] bg-[#DCEDF8]/60 border border-[#BFE0F5] flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#2F6A94] uppercase tracking-wider">Email Terdaftar</span>
            <span className="text-xs font-extrabold text-[#0F2E4C] truncate max-w-[200px]">
              {user?.email || 'email@rumahsakit.com'}
            </span>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Nama Lengkap & Gelar *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Contoh: dr. Budi Santoso, Sp.PD"
                  className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                NIP Pegawai *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  placeholder="Nomor Induk Pegawai resmi"
                  className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Instalasi / Unit Kerja *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              >
                {unitOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Jabatan Medis *
              </label>
              <input
                type="text"
                required
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                placeholder="Contoh: Perawat Pelaksana / Staf Medis"
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>

            <div className="pt-2 border-t border-[#DCEDF8]">
              <span className="text-[11px] font-bold text-[#1479BD] uppercase tracking-wider block mb-2">
                Buat Kata Sandi Baru
              </span>

              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Kata Sandi Baru (Min. 8 Karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (bukan vokasi123)"
                    className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Konfirmasi Kata Sandi Baru *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Simpan */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] rounded-full bg-[#1479BD] text-white font-extrabold text-[15px] tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center justify-center gap-2 mt-5 disabled:opacity-50"
            >
              {loading ? (
                'Menyimpan Profil...'
              ) : (
                <>
                  <span>Simpan & Mulai Bertugas</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-[14px] bg-[#DCEDF8]/50 border border-[#BFE0F5] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1479BD] mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-[#2F6A94] leading-relaxed">
              Setelah profil disimpan, password awal (vokasi123) tidak berlaku lagi. Anda dapat login berikutnya menggunakan email dan kata sandi baru Anda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5">
          <p className="text-[11px] font-semibold text-[#2F6A94]/80">
            MEDIFACES v1.0 · Smart Attendance, Better Healthcare
          </p>
        </div>
      </div>
    </div>
  );
};
