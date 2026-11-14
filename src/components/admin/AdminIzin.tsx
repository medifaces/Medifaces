import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Check, X, FileText, Image, AlertCircle, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const AdminIzin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Menunggu' | 'Disetujui' | 'Ditolak'>('Menunggu');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    loadIzin();
  }, []);

  const loadIzin = async () => {
    setLoading(true);
    try {
      const res = await api.getIzin();
      if (res?.list) {
        setList(res.list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'Disetujui' | 'Ditolak') => {
    try {
      await api.approveIzin(id, status, `Ditinjau oleh Admin MSDM pada ${new Date().toLocaleDateString('id-ID')}`);
      loadIzin();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredList = list.filter(item => item.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation: Menunggu / Disetujui / Ditolak */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-[#DCEDF8] rounded-[16px]">
          {(['Menunggu', 'Disetujui', 'Ditolak'] as const).map(tab => {
            const count = list.filter(l => l.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-[42px] px-5 rounded-[12px] text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#1479BD] text-white shadow-sm'
                    : 'text-[#2F6A94] hover:text-[#0F2E4C]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white text-[#1479BD]' : 'bg-[#DCEDF8] text-[#2F6A94]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-semibold text-[#2F6A94]">
          Total {filteredList.length} pengajuan dalam kategori ini
        </span>
      </div>

      {/* Tabel Persetujuan Izin & Cuti */}
      {/* Kolom: Pegawai, Jenis, Tanggal, Keterangan, Dokumen, Aksi */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] overflow-x-auto">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-[#2F6A94] text-xs font-semibold">
            Tidak ada permohonan dalam status {activeTab}.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#DCEDF8] text-[#0F2E4C] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-[14px]">Pegawai</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-3">Rentang Tanggal</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-3 text-center">Dokumen</th>
                <th className="py-3 px-4 rounded-r-[14px] text-center">Aksi Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCEDF8]">
              {filteredList.map(item => (
                <tr key={item.id} className="hover:bg-[#DCEDF8]/30 transition">
                  <td className="py-3.5 px-4 font-bold text-[#0F2E4C]">
                    <div className="text-sm font-extrabold">{item.user_nama || 'Pegawai Medis'}</div>
                    <div className="text-[11px] text-[#2F6A94]">
                      NIP {item.user_nip || '-'} · {item.user_unit || '-'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={item.jenis} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#0F2E4C] whitespace-nowrap">
                    {item.tanggal_mulai} s.d {item.tanggal_selesai}
                  </td>
                  <td className="py-3.5 px-4 text-[#0F2E4C] font-medium max-w-[280px]">
                    {item.keterangan}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {item.dokumen_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item.dokumen_url)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-[#DCEDF8] text-[#1479BD] font-bold text-[11px] hover:bg-[#BFE0F5] transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-medium">Tanpa Lampiran</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.status === 'Menunggu' ? (
                      <div className="flex items-center justify-center gap-2">
                        {/* Tombol ✓ Setujui (Biru #1479BD) */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Disetujui')}
                          className="h-[34px] px-3.5 rounded-[10px] bg-[#1479BD] text-white font-extrabold text-[11px] hover:bg-[#10659e] transition flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Setujui</span>
                        </button>

                        {/* Tombol ✕ Tolak (Outline Merah #D14343) */}
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Ditolak')}
                          className="h-[34px] px-3.5 rounded-[10px] border border-[#D14343] text-[#D14343] font-extrabold text-[11px] hover:bg-red-50 transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#2F6A94]">
                        Telah diproses ({item.status})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Preview Dokumen Surat Dokter */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-5 max-w-md w-full shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-sm font-extrabold text-[#0F2E4C]">Surat Keterangan Dokter / Bukti Izin</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] flex items-center justify-center text-[#0F2E4C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewDoc}
              alt="Surat Dokter"
              className="w-full h-80 object-cover rounded-[18px] bg-slate-100 border border-[#BFE0F5]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
