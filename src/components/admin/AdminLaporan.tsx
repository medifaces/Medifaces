import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Download, FileText, Printer, Calendar, BarChart3 } from 'lucide-react';
import { HOSPITAL_UNIT_CATEGORIES } from '../../constants/hospitalData';

export const AdminLaporan: React.FC = () => {
  const [data, setData] = useState<{
    summary: any;
    rekapUnit: any[];
    records: any[];
  }>({
    summary: {
      hadir_pct: 92,
      telat_pct: 4,
      sakit_pct: 2,
      izin_pct: 2,
    },
    rekapUnit: [],
    records: [],
  });
  const [unitFilter, setUnitFilter] = useState('Semua Unit');

  useEffect(() => {
    api.getLaporan({ unit: unitFilter }).then(res => {
      if (res) setData(res);
    });
  }, [unitFilter]);

  // Ekspor Excel (CSV formatted download)
  const handleExportCSV = () => {
    const headers = ['No,NIP,Nama,Unit,Tanggal,Jam Masuk,Jam Pulang,Status,Jarak (m),Akurasi Wajah (%)'];
    const rows = (data.records || []).map((r, i) =>
      `${i + 1},"${r.user_nip || ''}","${r.user_nama || ''}","${r.user_unit || ''}","${r.tanggal || ''}","${r.jam_masuk?.slice(0, 5) || ''}","${r.jam_pulang?.slice(0, 5) || ''}","${r.status || ''}",${r.jarak_meter || 0},${r.skor_wajah || 0}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MEDIFACES_Laporan_Presensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header: Filter, Ekspor Excel & PDF */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#1479BD]" />
          <span className="text-xs font-bold text-[#0F2E4C]">Filter Periode:</span>
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="h-[42px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
          >
            <option value="Semua Unit">Semua Unit Kerja</option>
            {HOSPITAL_UNIT_CATEGORIES.map(cat => (
              <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                {cat.units.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Tombol Ekspor Excel & PDF (Print CSS Bersih) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-[44px] px-5 rounded-full bg-white border border-[#BFE0F5] text-[#1479BD] font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-[#DCEDF8] transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="h-[44px] px-5 rounded-full bg-[#1479BD] text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-[#10659e] transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Persentase: Hadir, Telat, Sakit, Izin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Persentase Hadir */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#1479BD] block">
            Tingkat Kehadiran
          </span>
          <div className="text-[38px] font-extrabold text-[#1479BD] leading-none mt-2 tabular-nums">
            {data.summary?.hadir_pct || 92}%
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-1.5 block">
            Staf hadir tepat waktu
          </span>
        </div>

        {/* Persentase Telat */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-red-200">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#D14343] block">
            Tingkat Keterlambatan
          </span>
          <div className="text-[38px] font-extrabold text-[#D14343] leading-none mt-2 tabular-nums">
            {data.summary?.telat_pct || 4}%
          </div>
          <span className="text-[11px] font-semibold text-[#D14343] mt-1.5 block">
            Melebihi toleransi shift
          </span>
        </div>

        {/* Persentase Sakit */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-amber-200">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#F2A65A] block">
            Izin Sakit Medis
          </span>
          <div className="text-[38px] font-extrabold text-[#F2A65A] leading-none mt-2 tabular-nums">
            {data.summary?.sakit_pct || 2}%
          </div>
          <span className="text-[11px] font-semibold text-[#0F2E4C] mt-1.5 block">
            Disertai surat dokter
          </span>
        </div>

        {/* Persentase Izin */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#2F6A94] block">
            Izin & Cuti Resmi
          </span>
          <div className="text-[38px] font-extrabold text-[#2F6A94] leading-none mt-2 tabular-nums">
            {data.summary?.izin_pct || 2}%
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-1.5 block">
            Disetujui oleh MSDM
          </span>
        </div>
      </div>

      {/* Tabel Rekap Per Unit dengan Bar Kehadiran */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
        <h3 className="text-base font-extrabold text-[#0F2E4C] mb-1">
          Rekapitulasi Kehadiran Per Unit Pelayanan
        </h3>
        <p className="text-xs text-[#2F6A94] mb-4">
          Performa disiplin dan kepatuhan shift kerja rumah sakit
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#DCEDF8] text-[#0F2E4C] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-[14px]">Unit Kerja</th>
                <th className="py-3 px-3 text-center">Total Staf</th>
                <th className="py-3 px-3 text-center">Hadir</th>
                <th className="py-3 px-3 text-center">Telat</th>
                <th className="py-3 px-4 rounded-r-[14px] min-w-[200px]">Persentase Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCEDF8]">
              {[
                { unit: 'Instalasi Gawat Darurat (UGD)', total: 12, hadir: 11, telat: 1, pct: 92 },
                { unit: 'Instalasi Rawat Inap', total: 18, hadir: 17, telat: 1, pct: 94 },
                { unit: 'Poli Penyakit Dalam', total: 8, hadir: 8, telat: 0, pct: 100 },
                { unit: 'Instalasi Farmasi', total: 6, hadir: 5, telat: 1, pct: 83 },
                { unit: 'Manajemen SDM & Rektorat Vokasi UI', total: 4, hadir: 4, telat: 0, pct: 100 },
              ].map(u => (
                <tr key={u.unit} className="hover:bg-[#DCEDF8]/30 transition">
                  <td className="py-3 px-4 font-extrabold text-[#0F2E4C]">{u.unit}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#2F6A94]">{u.total}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-[#1479BD]">{u.hadir}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-[#D14343]">{u.telat}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full bg-[#DCEDF8] overflow-hidden">
                        <div
                          className="h-full bg-[#1479BD] rounded-full"
                          style={{ width: `${u.pct}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-[#0F2E4C] tabular-nums text-xs min-w-[36px]">
                        {u.pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
