import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ChevronLeft, ChevronRight, Plus, Calendar, Filter, X } from 'lucide-react';
import { HOSPITAL_UNIT_CATEGORIES } from '../../constants/hospitalData';

export const AdminShift: React.FC = () => {
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);

  // Shift assignment state
  const [selectedPegawai, setSelectedPegawai] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [selectedShiftCode, setSelectedShiftCode] = useState<string>('P');

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Initial Matrix Schedule
  const [scheduleMatrix, setScheduleMatrix] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    api.getPegawai().then(res => {
      if (res?.pegawai) {
        const staff = res.pegawai.filter((p: any) => p.role === 'karyawan');
        setPegawaiList(staff);
        if (staff.length > 0 && selectedPegawai === 0) {
          setSelectedPegawai(staff[0].id);
        }
      }
    });
  }, []);

  const getShiftBadge = (code: string) => {
    switch (code) {
      case 'P':
        return <span className="w-8 h-8 rounded-[10px] bg-[#1479BD] text-white font-extrabold text-xs flex items-center justify-center shadow-xs" title="Shift Pagi (08.00 - 14.00)">P</span>;
      case 'S':
        return <span className="w-8 h-8 rounded-[10px] bg-[#F2A65A] text-[#0F2E4C] font-extrabold text-xs flex items-center justify-center shadow-xs" title="Shift Siang (14.00 - 20.00)">S</span>;
      case 'M':
        return <span className="w-8 h-8 rounded-[10px] bg-[#0F2E4C] text-white font-extrabold text-xs flex items-center justify-center shadow-xs" title="Shift Malam (20.00 - 08.00)">M</span>;
      case 'DP':
        return <span className="w-8 h-8 rounded-[10px] bg-[#2F6A94] text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs" title="Driver Pagi (06.00 - 14.00)">DP</span>;
      case 'DS':
        return <span className="w-8 h-8 rounded-[10px] bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs" title="Driver Siang (14.00 - 22.00)">DS</span>;
      case 'DB':
        return <span className="w-8 h-8 rounded-[10px] bg-indigo-900 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs" title="Driver Subuh (03.00 - 11.00)">DB</span>;
      case 'L':
      default:
        return <span className="w-8 h-8 rounded-[10px] bg-[#DCEDF8] text-[#2F6A94] font-extrabold text-xs flex items-center justify-center" title="Libur">L</span>;
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPegawai) return;
    setScheduleMatrix(prev => ({
      ...prev,
      [selectedPegawai]: {
        ...(prev[selectedPegawai] || {}),
        [selectedDay]: selectedShiftCode,
      },
    }));
    setShowModal(false);
  };

  const filteredPegawai = unitFilter === 'Semua Unit'
    ? pegawaiList
    : pegawaiList.filter(p => p.unit === unitFilter);

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Navigasi Minggu, Filter Unit, Tombol + Atur Shift */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-wrap items-center justify-between gap-4">
        {/* Navigasi Minggu & Filter Unit */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#DCEDF8] p-1 rounded-[14px]">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-[10px] bg-white text-[#0F2E4C] flex items-center justify-center shadow-xs hover:bg-[#BFE0F5] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-[#0F2E4C] px-3">
              Minggu {weekOffset === 0 ? 'Ini' : `${weekOffset > 0 ? '+' : ''}${weekOffset}`}
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

        {/* Legenda & Tombol + Atur Shift */}
        <div className="flex items-center gap-5 flex-wrap">
          {/* Legenda Shift */}
          <div className="flex items-center gap-3 text-xs font-bold text-[#0F2E4C] flex-wrap">
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
              <span className="w-3.5 h-3.5 rounded-sm bg-[#2F6A94]" /> Driver (DP/DS/DB)
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

      {/* Matriks Pegawai x Sen-Min */}
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
            {filteredPegawai.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-[#2F6A94]">
                  Tidak ada pegawai pada unit ini.
                </td>
              </tr>
            ) : (
              filteredPegawai.map(staf => {
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
                        NIP {staf.nip} · {staf.unit} · {staf.jabatan}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Atur Shift Pegawai */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-[#BFE0F5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEDF8] mb-4">
              <h3 className="text-lg font-extrabold text-[#0F2E4C]">Penugasan Shift Pegawai</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5">
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
                    <option key={p.id} value={p.id}>
                      {p.nama} · {p.unit} ({p.jabatan})
                    </option>
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
                  Pilihan Shift Kerja
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'P', label: 'Pagi (08-14)' },
                    { code: 'S', label: 'Siang (14-20)' },
                    { code: 'M', label: 'Malam (20-08)' },
                    { code: 'DP', label: 'Driver Pagi (06-14)' },
                    { code: 'DS', label: 'Driver Siang (14-22)' },
                    { code: 'DB', label: 'Driver Subuh (03-11)' },
                    { code: 'L', label: 'Libur Staf' },
                  ].map(opt => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setSelectedShiftCode(opt.code)}
                      className={`p-2 rounded-[12px] border text-center transition ${
                        selectedShiftCode === opt.code
                          ? 'border-[#1479BD] bg-[#1479BD] text-white shadow-sm font-extrabold'
                          : 'border-[#BFE0F5] bg-[#DCEDF8]/50 text-[#0F2E4C] font-bold'
                      }`}
                    >
                      <span className="text-xs block font-extrabold">{opt.code}</span>
                      <span className="text-[9px] block opacity-90 truncate">{opt.label}</span>
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
