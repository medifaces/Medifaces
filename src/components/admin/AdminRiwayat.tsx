import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Printer, Search, Filter, Edit3, Image, X, Check } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const AdminRiwayat: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [loading, setLoading] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('Hadir');
  const [keterangan, setKeterangan] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadRiwayat();
  }, [unitFilter, statusFilter]);

  const loadRiwayat = async () => {
    setLoading(true);
    try {
      const res = await api.getLaporan({
        unit: unitFilter,
        status: statusFilter,
      });
      if (res?.records) {
        setRecords(res.records);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCorrection = (r: any) => {
    setCorrectionModal(r);
    setNewStatus(r.status || 'Hadir');
    setKeterangan(r.keterangan || 'Koreksi administratif MSDM');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModal) return;

    try {
      await api.koreksiAbsensi(correctionModal.id, newStatus, keterangan);
      setCorrectionModal(null);
      loadRiwayat();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Action Bar */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Unit */}
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="h-[44px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
          >
            <option value="Semua Unit">Semua Unit</option>
            <option value="Instalasi Rawat Inap">Instalasi Rawat Inap</option>
            <option value="Instalasi Gawat Darurat (UGD)">Instalasi Gawat Darurat (UGD)</option>
            <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
            <option value="Instalasi Farmasi">Instalasi Farmasi</option>
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-[44px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Telat">Telat</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
          </select>
        </div>

        {/* Tombol Cetak */}
        <button
          type="button"
          onClick={() => window.print()}
          className="h-[44px] px-5 rounded-full bg-white border border-[#BFE0F5] text-[#1479BD] font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-[#DCEDF8] transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen</span>
        </button>
      </div>

      {/* Tabel Riwayat Absensi */}
      {/* Kolom: No, NIP, Nama, Tanggal, Masuk, Pulang, Status, Foto, Koreksi Manual */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#DCEDF8] text-[#0F2E4C] font-extrabold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 rounded-l-[14px]">No</th>
              <th className="py-3 px-3">NIP</th>
              <th className="py-3 px-3">Nama Pegawai</th>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Masuk</th>
              <th className="py-3 px-3">Pulang</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-center">Foto</th>
              <th className="py-3 px-3 rounded-r-[14px] text-center">Koreksi Manual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCEDF8]">
            {records.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-[#DCEDF8]/30 transition">
                <td className="py-3 px-3 font-bold text-[#2F6A94]">{idx + 1}</td>
                <td className="py-3 px-3 font-extrabold text-[#1479BD]">{r.user_nip || '-'}</td>
                <td className="py-3 px-3 font-bold text-[#0F2E4C]">
                  <div>{r.user_nama || 'Pegawai'}</div>
                  <div className="text-[10px] text-[#2F6A94]">{r.user_unit || '-'}</div>
                </td>
                <td className="py-3 px-3 text-[#2F6A94] font-medium whitespace-nowrap">{r.tanggal}</td>
                <td className="py-3 px-3 font-extrabold text-[#0F2E4C]">
                  {r.jam_masuk?.slice(0, 5) || '--:--'}
                </td>
                <td className="py-3 px-3 font-extrabold text-[#0F2E4C]">
                  {r.jam_pulang?.slice(0, 5) || '--:--'}
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={r.status || 'Hadir'} size="sm" />
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto(r.foto_masuk || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80')}
                    className="p-1.5 rounded-[10px] bg-[#DCEDF8] text-[#1479BD] hover:bg-[#BFE0F5] transition"
                    title="Lihat Bukti Foto"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleOpenCorrection(r)}
                    className="h-[32px] px-3 rounded-[10px] bg-[#1479BD] text-white font-bold text-[11px] hover:bg-[#10659e] transition inline-flex items-center gap-1 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Koreksi</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Koreksi Manual */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-[#BFE0F5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEDF8] mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2E4C]">Koreksi Presensi Manual</h3>
                <p className="text-xs text-[#2F6A94]">Pegawai: {correctionModal.user_nama}</p>
              </div>
              <button
                type="button"
                onClick={() => setCorrectionModal(null)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Ubah Status Menjadi
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                >
                  <option value="Hadir">Hadir (Tepat Waktu)</option>
                  <option value="Telat">Telat</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Alasan Koreksi / Catatan Audit
                </label>
                <textarea
                  required
                  rows={3}
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Contoh: Kesalahan jaringan geofencing saat dinas rawat darurat"
                  className="w-full p-3 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1479BD] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectionModal(null)}
                  className="h-[44px] px-5 rounded-full border border-gray-300 text-[#0F2E4C] text-xs font-bold hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-[44px] px-6 rounded-full bg-[#1479BD] text-white text-xs font-extrabold hover:bg-[#10659e] transition shadow-md"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-4 max-w-sm w-full shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-xs font-extrabold text-[#0F2E4C]">Bukti Pindai Wajah</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="w-7 h-7 rounded-full bg-[#DCEDF8] flex items-center justify-center text-[#0F2E4C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewPhoto}
              alt="Bukti Absensi"
              className="w-full h-64 object-cover rounded-[18px] bg-slate-900 border border-[#BFE0F5]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
