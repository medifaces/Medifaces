import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MedicalLogo } from '../common/MedicalLogo';
import { User, IdCard, Building, Briefcase, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { HOSPITAL_UNIT_CATEGORIES, HOSPITAL_ROLES, OTHER_OPTION } from '../../constants/hospitalData';

interface Props {
  onSuccess: () => void;
}

export const CompleteProfileScreen: React.FC<Props> = ({ onSuccess }) => {
  const { user, updateUser, setMustChangePassword } = useAuth();

  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(HOSPITAL_UNIT_CATEGORIES[0].units[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState(HOSPITAL_ROLES[0]);
  const [customJabatan, setCustomJabatan] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    const finalUnit = selectedUnit === OTHER_OPTION ? customUnit.trim() : selectedUnit;
    if (!finalUnit) {
      setError('Silakan tentukan unit kerja Anda.');
      return;
    }

    const finalJabatan = selectedJabatan === OTHER_OPTION ? customJabatan.trim() : selectedJabatan;
    if (!finalJabatan) {
      setError('Silakan tentukan jabatan/peran Anda di rumah sakit.');
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
        unit: finalUnit,
        jabatan: finalJabatan,
        new_password: newPassword,
      });

      if (res.user) {
        updateUser({
          ...res.user,
          must_change_password: false,
          is_profile_completed: true,
        });
      } else {
        updateUser({
          nama: trimmedNama,
          nip: trimmedNip,
          unit: finalUnit,
          jabatan: finalJabatan,
          must_change_password: false,
          is_profile_completed: true,
        });
      }
      setMustChangePassword(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil pegawai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DCEDF8] flex flex-col justify-between items-center p-4 selection:bg-[#BFE0F5]">
      <div className="w-full max-w-[390px] mx-auto flex flex-col pt-2 pb-24">
        {/* Logo Kotak Biru Palang Medis */}
        <div className="mb-4">
          <MedicalLogo size="md" />
        </div>

        {/* Hero Card */}
        <div className="bg-[#1479BD] rounded-[28px] p-[22px] text-white shadow-lg mb-3 relative overflow-hidden">
          <span className="text-[11px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white">
            Aktivasi Akun Pegawai
          </span>
          <h1 className="text-[26px] font-extrabold leading-[1.15] mt-2.5 tracking-tight">
            Lengkapi profil.
          </h1>
          <p className="text-[#BFE0F5] text-xs font-medium mt-1 leading-relaxed">
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
              <input
                type="text"
                required
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Contoh: dr. Budi Santoso, Sp.PD / Siti Rahma, S.Kep"
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                NIP Pegawai *
              </label>
              <input
                type="text"
                required
                value={nip}
                onChange={e => setNip(e.target.value)}
                placeholder="Nomor Induk Pegawai resmi"
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Instalasi / Unit Kerja *
              </label>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              >
                {HOSPITAL_UNIT_CATEGORIES.map(cat => (
                  <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                    {cat.units.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
              </select>

              {selectedUnit === OTHER_OPTION && (
                <input
                  type="text"
                  required
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value)}
                  placeholder="Tuliskan nama unit kerja Anda"
                  className="w-full h-[46px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD] mt-2 border border-[#1479BD]/30"
                />
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Jabatan / Peran di Rumah Sakit *
              </label>
              <select
                value={selectedJabatan}
                onChange={e => setSelectedJabatan(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              >
                {HOSPITAL_ROLES.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
              </select>

              {selectedJabatan === OTHER_OPTION && (
                <input
                  type="text"
                  required
                  value={customJabatan}
                  onChange={e => setCustomJabatan(e.target.value)}
                  placeholder="Tuliskan nama jabatan Anda"
                  className="w-full h-[46px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD] mt-2 border border-[#1479BD]/30"
                />
              )}
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

            {/* Tombol Simpan - full width & margin aman dari badge Netlify */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] rounded-full bg-[#1479BD] text-white font-extrabold text-[15px] tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
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
            </div>
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
