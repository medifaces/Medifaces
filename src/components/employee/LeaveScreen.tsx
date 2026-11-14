import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileUp, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const LeaveScreen: React.FC = () => {
  const [jenis, setJenis] = useState<'Sakit' | 'Izin' | 'Cuti'>('Sakit');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [listIzin, setListIzin] = useState<any[]>([]);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const res = await api.getIzin();
      if (res?.list) {
        setListIzin(res.list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!keterangan.trim()) {
      setError('Keterangan pengajuan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await api.submitIzin({
        jenis,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        keterangan,
        dokumen_url: filePreview || undefined,
      });

      setSuccess(true);
      setKeterangan('');
      setFilePreview(null);
      loadList();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-[12px] pb-6">
      {/* Header */}
      <div className="pt-1">
        <h2 className="text-[18px] font-extrabold text-[#0F2E4C] leading-none">
          Pengajuan Izin & Cuti
        </h2>
        <span className="text-[11px] font-semibold text-[#2F6A94] mt-0.5 block">
          Formulir izin medis dan cuti staf
        </span>
      </div>

      {/* Kartu Form Pengajuan */}
      <div className="bg-white rounded-[22px] p-5 shadow-sm border border-[#BFE0F5]">
        {/* Segmented Sakit / Izin / Cuti */}
        <div className="grid grid-cols-3 p-1 bg-[#DCEDF8] rounded-[16px] mb-4">
          {(['Sakit', 'Izin', 'Cuti'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setJenis(tab)}
              className={`h-[40px] rounded-[12px] text-xs font-bold transition ${
                jenis === tab
                  ? 'bg-[#1479BD] text-white shadow-sm'
                  : 'text-[#2F6A94] hover:text-[#0F2E4C]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-blue-50 border border-[#1479BD]/30 text-[#1479BD] p-3 rounded-[14px] text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#1479BD]" />
            <span>Pengajuan berhasil dikirim ke Admin MSDM!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Rentang Tanggal */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Mulai
              </label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={e => setTanggalMulai(e.target.value)}
                className="w-full h-[48px] px-3 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Selesai
              </label>
              <input
                type="date"
                required
                value={tanggalSelesai}
                onChange={e => setTanggalSelesai(e.target.value)}
                className="w-full h-[48px] px-3 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Keterangan Alasan
            </label>
            <textarea
              required
              rows={3}
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Jelaskan alasan izin / sakit secara rinci..."
              className="w-full p-3 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] placeholder-[#2F6A94]/60 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD] resize-none"
            />
          </div>

          {/* Unggah Surat Dokter / Bukti */}
          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Unggah Surat Dokter / Bukti Pendukung
            </label>
            <label className="w-full h-[48px] rounded-[14px] bg-[#DCEDF8] border border-dashed border-[#1479BD]/50 flex items-center justify-center gap-2 text-xs font-bold text-[#1479BD] cursor-pointer hover:bg-[#BFE0F5]/50 transition">
              <FileUp className="w-4 h-4" />
              <span>{filePreview ? 'File Terpilih (Ganti)' : 'Pilih Foto / Dokumen'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {filePreview && (
              <div className="mt-2 p-1 bg-[#DCEDF8] rounded-[10px] inline-block">
                <img src={filePreview} alt="Bukti" className="h-14 w-auto rounded-[8px] object-cover" />
              </div>
            )}
          </div>

          {/* Tombol Kirim Pengajuan (Pil) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] rounded-full bg-[#1479BD] text-white font-extrabold text-[15px] tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </form>
      </div>

      {/* Daftar Status Pengajuan */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#2F6A94] px-1">
          Status Pengajuan Anda
        </span>

        {listIzin.length === 0 ? (
          <div className="bg-white rounded-[22px] p-5 text-center text-[#2F6A94] text-xs border border-[#BFE0F5]">
            Belum ada riwayat pengajuan izin atau cuti.
          </div>
        ) : (
          listIzin.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-[18px] p-4 shadow-sm border border-[#BFE0F5] flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-[#0F2E4C]">{item.jenis}</span>
                  <span className="text-[11px] text-[#2F6A94] font-medium">
                    {item.tanggal_mulai} s.d {item.tanggal_selesai}
                  </span>
                </div>
                <p className="text-xs text-[#2F6A94] mt-1 font-medium">{item.keterangan}</p>
                {item.catatan_admin && (
                  <p className="text-[11px] text-[#0F2E4C] bg-[#DCEDF8] p-2 rounded-[8px] mt-2 font-medium">
                    Catatan MSDM: {item.catatan_admin}
                  </p>
                )}
              </div>
              <StatusBadge status={item.status} size="sm" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
