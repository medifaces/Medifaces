import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Radio, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const AdminLive: React.FC = () => {
  const [data, setData] = useState<{
    totalScans: number;
    successCount: number;
    rejectedCount: number;
    logs: any[];
    rejectionReasons: any[];
  }>({
    totalScans: 4,
    successCount: 2,
    rejectedCount: 2,
    logs: [],
    rejectionReasons: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLiveFeed();
    const interval = setInterval(loadLiveFeed, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveFeed = async () => {
    try {
      const res = await api.getLive();
      if (res) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Kartu Angka: Pindai hari ini, Berhasil, Ditolak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#2F6A94]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Pindai Hari Ini</span>
            <div className="w-9 h-9 rounded-[12px] bg-[#DCEDF8] text-[#1479BD] flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse text-[#1479BD]" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#0F2E4C] leading-none mt-3 tabular-nums">
            {data.totalScans}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-2 block">
            Total upaya autentikasi biometrik
          </span>
        </div>

        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#1479BD]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Verifikasi Berhasil</span>
            <div className="w-9 h-9 rounded-[12px] bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#1479BD] leading-none mt-3 tabular-nums">
            {data.successCount}
          </div>
          <span className="text-[11px] font-semibold text-[#1479BD] mt-2 block">
            Wajah cocok & dalam radius RS
          </span>
        </div>

        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-red-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#D14343]">
            <span className="text-[12px] font-bold uppercase tracking-wider">Pindai Ditolak</span>
            <div className="w-9 h-9 rounded-[12px] bg-red-50 text-[#D14343] flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[38px] font-extrabold text-[#D14343] leading-none mt-3 tabular-nums">
            {data.rejectedCount}
          </div>
          <span className="text-[11px] font-semibold text-[#D14343] mt-2 block">
            Pelanggaran radius, liveness, atau wajah
          </span>
        </div>
      </div>

      {/* Row 2: Live Log Pindai Wajah & Grafik Alasan Penolakan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daftar Pindai Wajah Terbaru (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2E4C] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                Siaran Pindai Wajah Real-Time
              </h3>
              <p className="text-xs text-[#2F6A94]">Log audit verifikasi kamera dan koordinat geofencing</p>
            </div>
            <span className="text-xs font-bold text-[#1479BD] bg-[#DCEDF8] px-3 py-1 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#DCEDF8] text-[#0F2E4C] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-[12px]">Waktu</th>
                  <th className="py-2.5 px-3">Pegawai</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-[12px]">Alasan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCEDF8]">
                {data.logs.map((log: any, idx: number) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id || idx} className="hover:bg-[#DCEDF8]/40 transition">
                      <td className="py-3 px-3 text-[#2F6A94] font-medium whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID') : 'Baru saja'}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#0F2E4C]">
                        {log.user_nama || 'Pegawai RS'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#2F6A94]">
                        {log.action}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSuccess
                              ? 'bg-[#1479BD] text-white'
                              : 'bg-[#D14343] text-white'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#0F2E4C] font-semibold max-w-[280px]">
                        {log.alasan}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grafik Alasan Penolakan Hari Ini */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-[#D14343]" />
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Alasan Penolakan Hari Ini</h3>
            </div>
            <p className="text-xs text-[#2F6A94] mb-4">
              Klasifikasi pelanggaran keamanan absensi
            </p>

            <div className="space-y-3.5 mt-2">
              {data.rejectionReasons.map((reason, index) => (
                <div key={index} className="p-3 rounded-[14px] bg-[#DCEDF8]/50 border border-[#BFE0F5]">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#0F2E4C]">{reason.name}</span>
                    <span className="text-[#D14343] tabular-nums font-extrabold">{reason.count} kasus</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#DCEDF8] overflow-hidden">
                    <div
                      className="h-full bg-[#D14343] rounded-full"
                      style={{ width: `${Math.min(100, reason.count * 50)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-[14px] bg-red-50 border border-red-200 mt-4 text-[11px] text-[#D14343] font-semibold">
            Semua penolakan otomatis dicatat di Audit Log untuk investigasi MSDM.
          </div>
        </div>
      </div>
    </div>
  );
};
