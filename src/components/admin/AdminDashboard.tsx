import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalPegawai: 5,
    sudahAbsen: 3,
    belumAbsen: 2,
    terlambat: 1,
  });
  const [latestAbsen, setLatestAbsen] = useState<any[]>([]);
  const [unitDiscipline, setUnitDiscipline] = useState<any[]>([]);

  // Weekly Attendance Trend Data (Senin - Minggu), Jumat dibedakan warna
  const weeklyData = [
    { day: 'Sen', rate: 96, isFriday: false },
    { day: 'Sel', rate: 92, isFriday: false },
    { day: 'Rab', rate: 94, isFriday: false },
    { day: 'Kam', rate: 90, isFriday: false },
    { day: 'Jum', rate: 85, isFriday: true }, // Jumat dibedakan warna
    { day: 'Sab', rate: 88, isFriday: false },
    { day: 'Min', rate: 82, isFriday: false },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getLaporan();
      if (res?.records) {
        setLatestAbsen(res.records.slice(0, 5));
      }
      if (res?.rekapUnit) {
        setUnitDiscipline(res.rekapUnit);
      }
      if (res?.summary) {
        setMetrics({
          totalPegawai: 5,
          sudahAbsen: res.summary.hadir + res.summary.telat || 3,
          belumAbsen: Math.max(0, 5 - (res.summary.hadir + res.summary.telat)),
          terlambat: res.summary.telat || 1,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Kartu Angka: Kartu radius 22px padding 20px; angka metrik 36-40px weight 800 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pegawai */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#2F6A94]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Total Pegawai</span>
            <div className="w-9 h-9 rounded-[12px] bg-[#DCEDF8] text-[#1479BD] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#0F2E4C] leading-none mt-3 tabular-nums">
            {metrics.totalPegawai}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-2 block">
            Staf medis & non-medis aktif
          </span>
        </div>

        {/* Sudah Absen */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#2F6A94]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Sudah Absen</span>
            <div className="w-9 h-9 rounded-[12px] bg-green-50 text-green-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#1479BD] leading-none mt-3 tabular-nums">
            {metrics.sudahAbsen}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-2 block">
            Hari ini shift pagi & reguler
          </span>
        </div>

        {/* Belum Absen */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#2F6A94]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Belum Absen</span>
            <div className="w-9 h-9 rounded-[12px] bg-[#DCEDF8] text-[#2F6A94] flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#2F6A94] leading-none mt-3 tabular-nums">
            {metrics.belumAbsen}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-2 block">
            Menunggu jadwal shift siang/malam
          </span>
        </div>

        {/* Terlambat (Merah) */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-red-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#D14343]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Terlambat</span>
            <div className="w-9 h-9 rounded-[12px] bg-red-50 text-[#D14343] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#D14343] leading-none mt-3 tabular-nums">
            {metrics.terlambat}
          </div>
          <span className="text-[11px] font-semibold text-[#D14343] mt-2 block">
            Melewati toleransi 15 menit
          </span>
        </div>
      </div>

      {/* Row 2: Grafik Tren Kehadiran Recharts (Jumat dibedakan warna) & Panel Perlu Perhatian */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tren Kehadiran Minggu Ini (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Tren Kehadiran Minggu Ini</h3>
              <p className="text-xs text-[#2F6A94]">
                Tingkat kehadiran staf per hari (kolom berwarna amber menandai hari Jumat)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#2F6A94]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#1479BD]" /> Reguler
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#F2A65A]" /> Jumat
              </span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#0F2E4C', fontSize: 12, fontWeight: 700 }} />
                <YAxis domain={[50, 100]} tick={{ fill: '#2F6A94', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Kehadiran']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #BFE0F5',
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFriday ? '#F2A65A' : '#1479BD'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel "Perlu Perhatian" */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-[#F2A65A]" />
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Perlu Perhatian</h3>
            </div>
            <p className="text-xs text-[#2F6A94] mb-4">
              Pemberitahuan anomali kehadiran & verifikasi medis
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-[14px] bg-red-50 border border-red-200">
                <span className="text-xs font-bold text-[#D14343] block">
                  Ns. Ratna Wulandari, S.Kep
                </span>
                <span className="text-[11px] text-[#0F2E4C] mt-0.5 block">
                  Terlambat 22 menit pada Shift Pagi (UGD)
                </span>
              </div>

              <div className="p-3 rounded-[14px] bg-[#DCEDF8] border border-[#BFE0F5]">
                <span className="text-xs font-bold text-[#1479BD] block">
                  Budi Santoso, S.Farm, Apt
                </span>
                <span className="text-[11px] text-[#0F2E4C] mt-0.5 block">
                  Mengajukan Izin Sakit (Surat dokter terlampir)
                </span>
              </div>

              <div className="p-3 rounded-[14px] bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-[#0F2E4C] block">
                  Siti Mulia Rahmah (NIP 48)
                </span>
                <span className="text-[11px] text-[#2F6A94] mt-0.5 block">
                  Template wajah belum terdaftar di sistem
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCEDF8] text-[11px] text-[#2F6A94] font-semibold text-center">
            Pusat Notifikasi Keselamatan Staf Medis
          </div>
        </div>
      </div>

      {/* Row 3: Absen Terbaru & Kedisiplinan Per Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daftar "Absen Terbaru" */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <h3 className="text-base font-extrabold text-[#0F2E4C] mb-1">Absen Terbaru Hari Ini</h3>
          <p className="text-xs text-[#2F6A94] mb-4">Aktivitas pindai masuk terverifikasi</p>

          <div className="divide-y divide-[#DCEDF8]">
            {latestAbsen.map((item, idx) => (
              <div key={item.id || idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#1479BD] text-white font-extrabold text-xs flex items-center justify-center">
                    {(item.user_nama || 'SM').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0F2E4C] block">
                      {item.user_nama || 'dr. Andika Pratama, Sp.PD'}
                    </span>
                    <span className="text-[11px] text-[#2F6A94] font-medium block">
                      {item.user_unit || 'Poli Penyakit Dalam'} · Pukul {item.jam_masuk?.slice(0, 5) || '07:48'}
                    </span>
                  </div>
                </div>
                <StatusBadge status={item.status || 'Hadir'} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Kedisiplinan Per Unit (Bar Horizontal) */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <h3 className="text-base font-extrabold text-[#0F2E4C] mb-1">Kedisiplinan Per Unit</h3>
          <p className="text-xs text-[#2F6A94] mb-4">Persentase ketepatan waktu berdasarkan instalasi medis</p>

          <div className="space-y-4">
            {[
              { unit: 'Instalasi Gawat Darurat (UGD)', pct: 92 },
              { unit: 'Instalasi Rawat Inap', pct: 95 },
              { unit: 'Poli Penyakit Dalam', pct: 98 },
              { unit: 'Instalasi Farmasi', pct: 88 },
              { unit: 'Manajemen SDM & Rektorat', pct: 100 },
            ].map(u => (
              <div key={u.unit}>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-[#0F2E4C]">{u.unit}</span>
                  <span className="text-[#1479BD] tabular-nums">{u.pct}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#DCEDF8] overflow-hidden">
                  <div
                    className="h-full bg-[#1479BD] rounded-full transition-all duration-500"
                    style={{ width: `${u.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
