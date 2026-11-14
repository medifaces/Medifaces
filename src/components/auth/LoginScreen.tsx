import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MedicalLogo } from '../common/MedicalLogo';
import { ECGLine } from '../common/ECGLine';
import { ShieldCheck, ArrowRight, Info } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [roleMode, setRoleMode] = useState<'karyawan' | 'sdm'>('karyawan');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleMode = (mode: 'karyawan' | 'sdm') => {
    setRoleMode(mode);
    setError('');
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password, roleMode);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali data login Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DCEDF8] flex flex-col justify-between items-center p-5 selection:bg-[#BFE0F5]">
      <div className="w-full max-w-[390px] mx-auto flex flex-col pt-3 pb-6">
        {/* Logo Kotak Biru Berisi Palang Medis Putih */}
        <div className="mb-6">
          <MedicalLogo size="md" />
        </div>

        {/* Kartu Hero Biru */}
        <div className="bg-[#1479BD] rounded-[28px] p-[22px] text-white shadow-lg mb-3 relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[11px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white">
              Hospital Attendance System
            </span>
            <h1 className="text-[34px] font-extrabold leading-[1.1] mt-3 tracking-tight">
              {roleMode === 'sdm' ? 'Portal MSDM.' : 'Selamat bertugas.'}
            </h1>
            <p className="text-[#BFE0F5] text-xs font-medium mt-1.5">
              {roleMode === 'sdm'
                ? 'Kelola presensi, jadwal shift, dan laporan staf medis.'
                : 'Presensi presisi berbasis pengenalan wajah & geofencing.'}
            </p>
          </div>

          {/* Garis Detak Jantung (ECG) Berujung Titik Amber */}
          <div className="mt-4 pt-1">
            <ECGLine />
          </div>
        </div>

        {/* Kartu Putih Login */}
        <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5]">
          {/* Toggle Pegawai | MSDM */}
          <div className="grid grid-cols-2 p-1 bg-[#DCEDF8] rounded-[16px] mb-5">
            <button
              type="button"
              onClick={() => handleToggleMode('karyawan')}
              className={`h-[42px] rounded-[12px] text-xs font-bold transition flex items-center justify-center ${
                roleMode === 'karyawan'
                  ? 'bg-[#1479BD] text-white shadow-sm'
                  : 'text-[#2F6A94] hover:text-[#0F2E4C]'
              }`}
            >
              Pegawai
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('sdm')}
              className={`h-[42px] rounded-[12px] text-xs font-bold transition flex items-center justify-center ${
                roleMode === 'sdm'
                  ? 'bg-[#1479BD] text-white shadow-sm'
                  : 'text-[#2F6A94] hover:text-[#0F2E4C]'
              }`}
            >
              Portal MSDM
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D14343] mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1.5">
                {roleMode === 'sdm' ? 'Email Kantor' : 'Email / NIP'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={roleMode === 'sdm' ? 'Email admin terdaftar' : 'NIP atau email terdaftar'}
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>

            {/* Tombol Utama Bentuk Pil */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[54px] rounded-full bg-[#1479BD] text-white font-extrabold text-[16px] tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center justify-center gap-2 mt-5 disabled:opacity-50"
            >
              {loading ? (
                'Memverifikasi...'
              ) : (
                <>
                  <span>{roleMode === 'sdm' ? 'Masuk ke dashboard' : 'Masuk sekarang'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Catatan Persetujuan Data Wajah */}
          <div className="mt-5 p-3 rounded-[14px] bg-[#DCEDF8]/50 border border-[#BFE0F5] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#1479BD] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[#2F6A94] leading-relaxed">
              Dengan masuk, Anda menyetujui pemrosesan data biometrik wajah dan koordinat lokasi untuk keperluan absensi rumah sakit terenkripsi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] font-semibold text-[#2F6A94]/80">
            MEDIFACES v1.0 · Smart Attendance, Better Healthcare
          </p>
        </div>
      </div>
    </div>
  );
};
