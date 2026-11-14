import React, { useState } from 'react';
import { api } from '../../services/api';
import { Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ onSuccess }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-[#BFE0F5]">
        <div className="w-12 h-12 rounded-2xl bg-[#DCEDF8] text-[#1479BD] flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-[#1479BD]" />
        </div>

        <h3 className="text-xl font-extrabold text-[#0F2E4C]">Aktivasi Kata Sandi Baru</h3>
        <p className="text-sm text-[#2F6A94] mt-1 mb-5">
          Demi keamanan akun rumah sakit Anda, Anda diwajibkan untuk mengganti kata sandi awal pada login pertama.
        </p>

        {error && (
          <div className="bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1.5">
              Kata Sandi Saat Ini (Seed)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi awal (vokasi123)"
                className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1.5">
              Kata Sandi Baru (Min. 6 Karakter)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru yang kuat"
              className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full h-[48px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-full bg-[#1479BD] text-white font-bold text-sm tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Simpan & Lanjutkan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
