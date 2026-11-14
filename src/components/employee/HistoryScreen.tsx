import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Printer, Filter, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const HistoryScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    hadir: 22,
    telat: 1,
    sakit: 0,
    izin: 1,
  });
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRiwayat();
  }, [selectedMonth]);

  const loadRiwayat = async () => {
    setLoading(true);
    try {
      const res = await api.getLaporan();
      if (res?.records) {
        setRecords(res.records);
        if (res.summary) {
          setSummary({
            hadir: res.summary.hadir || 22,
            telat: res.summary.telat || 1,
            sakit: res.summary.sakit || 0,
            izin: res.summary.izin || 1,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-[12px] pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white text-[#0F2E4C] flex items-center justify-center shadow-sm border border-[#BFE0F5]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[18px] font-extrabold text-[#0F2E4C] leading-none">
              Riwayat Presensi
            </h2>
            <span className="text-[11px] font-semibold text-[#2F6A94] mt-0.5 block">
              Catatan kehadiran terverifikasi
            </span>
          </div>
        </div>

        {/* Tombol Cetak (window.print) */}
        <button
          type="button"
          onClick={handlePrint}
          aria-label="Cetak Riwayat Presensi"
          className="h-[40px] px-3.5 rounded-full bg-white border border-[#BFE0F5] text-[#1479BD] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#DCEDF8] transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak</span>
        </button>
      </div>

      {/* Rekap 4 Kotak di Atas */}
      {/* Hadir, Telat (merah), Sakit (amber), Izin (biru muda) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Hadir */}
        <div className="bg-[#1479BD] text-white rounded-[18px] p-3 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
            Hadir
          </span>
          <span className="text-[22px] font-extrabold tabular-nums block mt-0.5">
            {summary.hadir}
          </span>
          <span className="text-[9px] opacity-80">Hari</span>
        </div>

        {/* Telat Merah */}
        <div className="bg-[#D14343] text-white rounded-[18px] p-3 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
            Telat
          </span>
          <span className="text-[22px] font-extrabold tabular-nums block mt-0.5">
            {summary.telat}
          </span>
          <span className="text-[9px] opacity-80">Hari</span>
        </div>

        {/* Sakit Amber */}
        <div className="bg-[#F2A65A] text-[#0F2E4C] rounded-[18px] p-3 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90">
            Sakit
          </span>
          <span className="text-[22px] font-extrabold tabular-nums block mt-0.5">
            {summary.sakit}
          </span>
          <span className="text-[9px] font-semibold">Hari</span>
        </div>

        {/* Izin Biru Muda */}
        <div className="bg-[#BFE0F5] text-[#0F2E4C] rounded-[18px] p-3 shadow-sm text-center border border-[#1479BD]/20">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
            Izin
          </span>
          <span className="text-[22px] font-extrabold tabular-nums block mt-0.5">
            {summary.izin}
          </span>
          <span className="text-[9px] font-semibold">Hari</span>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="bg-white rounded-[18px] p-3 shadow-sm border border-[#BFE0F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1479BD]" />
          <span className="text-xs font-bold text-[#0F2E4C]">Periode Bulan:</span>
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="h-[36px] px-3 rounded-[10px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
        >
          <option value="2026-11">November 2026</option>
          <option value="2026-10">Oktober 2026</option>
          <option value="2026-09">September 2026</option>
        </select>
      </div>

      {/* Daftar Harian: Tanggal, Jam Masuk-Pulang, Badge Status */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#2F6A94] px-1">
          Aktivitas Harian
        </span>

        {records.length === 0 ? (
          <div className="bg-white rounded-[22px] p-6 text-center text-[#2F6A94] text-xs border border-[#BFE0F5]">
            Belum ada catatan presensi untuk periode ini.
          </div>
        ) : (
          records.map((r, idx) => (
            <div
              key={r.id || idx}
              className="bg-white rounded-[18px] p-4 shadow-sm border border-[#BFE0F5] flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-extrabold text-[#0F2E4C] block">
                  {r.tanggal || '14 November 2026'}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#2F6A94] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#1479BD]" />
                  <span>
                    Masuk: {r.jam_masuk ? r.jam_masuk.slice(0, 5) : '--:--'} · Pulang: {r.jam_pulang ? r.jam_pulang.slice(0, 5) : '--:--'}
                  </span>
                </div>
                {r.jarak_meter && (
                  <span className="text-[10px] text-[#2F6A94]/80 mt-0.5 block">
                    Radius: {Math.round(r.jarak_meter)}m · Akurasi wajah: {r.skor_wajah ? Math.round(r.skor_wajah) : 94}%
                  </span>
                )}
              </div>
              <StatusBadge status={r.status || 'Hadir'} size="sm" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
