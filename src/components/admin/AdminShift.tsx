import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ChevronLeft, ChevronRight, Plus, Calendar, Filter, X } from 'lucide-react';

export const AdminShift: React.FC = () => {
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);

  // Shift assignment state
  const [selectedPegawai, setSelectedPegawai] = useState<number>(2);
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [selectedShiftCode, setSelectedShiftCode] = useState<string>('P');

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Initial Matrix Schedule
  const [scheduleMatrix, setScheduleMatrix] = useState<Record<number, Record<string, string>>>({
    2: { Senin: 'P', Selasa: 'P', Rabu: 'S', Kamis: 'M', Jumat: 'L', Sabtu: 'P', Minggu: 'L' }, // Siti Mulia Rahmah
    3: { Senin: 'P', Selasa: 'P', Rabu: 'P', Kamis: 'P', Jumat: 'P', Sabtu: 'L', Minggu: 'L' }, // dr Andika
    4: { Senin: 'M', Selasa: 'M', Rabu: 'L', Kamis: 'P', Jumat: 'S', Sabtu: 'S', Minggu: 'L' }, // Ns Ratna
    5: { Senin: 'P', Selasa: 'P', Rabu: 'P', Kamis: 'P', Jumat: 'P', Sabtu: 'L', Minggu: 'L' }, // Budi Santoso
  });

  useEffect(() => {
    api.getPegawai().then(res => {
      if (res?.pegawai) {
        setPegawaiList(res.pegawai.filter((p: any) => p.role === 'karyawan'));
      }
    });
  }, []);

  const getShiftBadge = (code: string) => {
    switch (code) {
      case 'P':
        return <span className="w-8 h-8 rounded-[10px] bg-[#1479BD] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">P</span>;
      case 'S':
        return <span className="w-8 h-8 rounded-[10px] bg-[#F2A65A] text-[#0F2E4C] font-extrabold text-xs flex items-center justify-center shadow-xs">S</span>;
      case 'M':
        return <span className="w-8 h-8 rounded-[10px] bg-[#0F2E4C] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">M</span>;
      case 'L':
      default:
        return <span className="w-8 h-8 rounded-[10px] bg-[#DCEDF8] text-[#2F6A94] font-extrabold text-xs flex items-center justify-center">L</span>;
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMatrix(prev => ({
      ...prev,
      [selectedPegawai]: {
        ...(prev[selectedPegawai] || {}),
        [selectedDay]: selectedShiftCode,
      },
    }));
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Navigasi Minggu, Filter Unit, Tombol + Atur Shift */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-wrap items-center justify-between gap-4">
        {/* Navigasi Minggu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#DCEDF8] p-1 rounded-[14px]">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-[10px] bg-white text-[#0F2E4C] flex items-center justify-center shadow-xs hover:bg-[#BFE0F5] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-[#0F2E4C] px-3 whitespace-nowrap">
              Minggu {weekOffset === 0 ? 'Ini (10 - 16 Nov 2026)' : `${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-8 h-8 rounded-[10px] bg-white text-[#0F2E4C] flex items-center justify-center shadow-xs hover:bg-[#BFE0F5] transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="h-[42px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
          >
            <option value="Semua Unit">Semua Unit</option>
            <option value="Instalasi Rawat Inap">Instalasi Rawat Inap</option>
            <option value="Instalasi Gawat Darurat (UGD)">Instalasi Gawat Darurat (UGD)</option>
            <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
            <option value="Instalasi Farmasi">Instalasi Farmasi</option>
          </select>
        </div>

        {/* Legenda & Tombol + Atur Shift */}
        <div className="flex items-center gap-5">
          {/* Legenda (Pagi, Siang, Malam, Libur) */}
          <div className="flex items-center gap-3 text-xs font-bold text-[#0F2E4C]">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#1479BD]" /> Pagi (P)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#F2A65A]" /> Siang (S)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#0F2E4C]" /> Malam (M)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#DCEDF8] border border-[#BFE0F5]" /> Libur (L)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="h-[44px] px-5 rounded-full bg-[#1479BD] text-white font-extrabold text-xs tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Atur Shift</span>
          </button>
        </div>
      </div>

      {/* Matriks Pegawai x Sen-Min Sel P/S/M/L */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#DCEDF8] text-[#0F2E4C] text-xs font-extrabold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-[14px] min-w-[220px]">Nama Pegawai & Jabatan</th>
              {days.map((day, idx) => (
                <th
                  key={day}
                  className={`py-3 px-3 text-center ${idx === days.length - 1 ? 'rounded-r-[14px]' : ''}`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCEDF8]">
            {pegawaiList.map(staf => {
              const staffSched = scheduleMatrix[staf.id] || {
                Senin: 'P',
                Selasa: 'P',
                Rabu: 'P',
                Kamis: 'P',
                Jumat: 'P',
                Sabtu: 'L',
                Minggu: 'L',
              };

              return (
                <tr key={staf.id} className="hover:bg-[#DCEDF8]/30 transition">
                  <td className="py-3 px-4">
                    <span className="text-xs font-extrabold text-[#0F2E4C] block">{staf.nama}</span>
                    <span className="text-[11px] text-[#2F6A94] font-medium block">
                      NIP {staf.nip} · {staf.unit}
                    </span>
                  </td>
                  {days.map(day => (
                    <td key={day} className="py-3 px-3 text-center">
                      <div className="flex justify-center">
                        {getShiftBadge(staffSched[day] || 'P')}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Atur Shift Pegawai */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-[#BFE0F5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCEDF8] mb-4">
              <h3 className="text-lg font-extrabold text-[#0F2E4C]">Alokasi Shift Staf Medis</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Pilih Pegawai
                </label>
                <select
                  value={selectedPegawai}
                  onChange={e => setSelectedPegawai(Number(e.target.value))}
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                >
                  {pegawaiList.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} (NIP {p.nip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Hari Penugasan
                </label>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Kode Shift
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: 'P', label: 'Pagi (08-14)' },
                    { code: 'S', label: 'Siang (14-20)' },
                    { code: 'M', label: 'Malam (20-08)' },
                    { code: 'L', label: 'Libur' },
                  ].map(opt => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setSelectedShiftCode(opt.code)}
                      className={`p-2.5 rounded-[14px] border text-center transition ${
                        selectedShiftCode === opt.code
                          ? 'border-[#1479BD] bg-[#1479BD] text-white shadow-sm font-extrabold'
                          : 'border-[#BFE0F5] bg-[#DCEDF8]/50 text-[#0F2E4C] font-bold'
                      }`}
                    >
                      <span className="text-base block">{opt.code}</span>
                      <span className="text-[9px] block opacity-90">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-[44px] px-5 rounded-full border border-gray-300 text-[#0F2E4C] text-xs font-bold hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-[44px] px-6 rounded-full bg-[#1479BD] text-white text-xs font-extrabold hover:bg-[#10659e] transition shadow-md"
                >
                  Terapkan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
