import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { RefreshCw, MapPin, Check, Fingerprint, AlertCircle, Clock, ChevronRight, X, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface Props {
  onGoToAbsen: (type: 'masuk' | 'pulang') => void;
  onGoToRiwayat: () => void;
  lastRecordUpdate?: any;
}

export const HomeScreen: React.FC<Props> = ({ onGoToAbsen, onGoToRiwayat, lastRecordUpdate }) => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [currentShift, setCurrentShift] = useState({
    id: 1,
    nama: 'Shift Pagi',
    jam: '08.00-14.00',
  });
  const [showShiftSheet, setShowShiftSheet] = useState(false);
  const [gpsActive, setGpsActive] = useState(true);
  const [gpsDistance, setGpsDistance] = useState<number>(42); // default near Vokasi UI
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const shiftOptions = [
    { id: 1, nama: 'Shift Pagi', jam: '08.00-14.00' },
    { id: 2, nama: '5 Hari Kerja', jam: '07.30-16.00' },
    { id: 3, nama: 'Shift Siang', jam: '14.00-20.00' },
    { id: 4, nama: 'Shift Malam', jam: '20.00-08.00' },
    { id: 5, nama: '6 Hari Kerja', jam: '08.00-14.30' },
    { id: 6, nama: 'Koperasi - Sore', jam: '13.00-19.00' },
    { id: 7, nama: 'Driver Pagi', jam: '06.00-14.00' },
    { id: 8, nama: 'Driver Siang', jam: '14.00-22.00' },
    { id: 9, nama: 'Driver Subuh', jam: '03.00-11.00' },
  ];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getStatusHariIni();
      if (res?.record) {
        setTodayRecord(res.record);
      }
    } catch (e) {
      console.error('Load status error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Test geolocation availability
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsActive(true),
        () => setGpsActive(false),
        { timeout: 5000 }
      );
    }
  }, []);

  // Terima pembaruan rekam kehadiran dari CameraScreen langsung tanpa perlu refresh manual
  useEffect(() => {
    if (lastRecordUpdate) {
      setTodayRecord(lastRecordUpdate);
      const isPulang = !!lastRecordUpdate.jam_pulang;
      setToastMessage(isPulang ? 'Absen pulang berhasil dicatat.' : 'Absen masuk berhasil dicatat.');
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [lastRecordUpdate]);

  // Format greeting
  const hour = time.getHours();
  let greeting = 'Selamat pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat sore';
  else if (hour >= 18 || hour < 5) greeting = 'Selamat malam';

  // Format initials
  const initials = (user?.nama || 'Pegawai')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'P';

  // Clock string
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  // Date string in Indonesian
  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasCheckedIn = !!todayRecord?.jam_masuk;
  const hasCheckedOut = !!todayRecord?.jam_pulang;

  const handleAbsenClick = () => {
    const targetType = hasCheckedIn && !hasCheckedOut ? 'pulang' : 'masuk';
    onGoToAbsen(targetType);
  };

  return (
    <div className="flex flex-col gap-[12px] relative pb-6">
      {/* Toast Notifikasi Berhasil Absen */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-[16px] text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Pegawai */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Avatar Inisial */}
          <div className="w-[46px] h-[46px] rounded-[16px] bg-[#1479BD] text-white font-extrabold text-[17px] flex items-center justify-center shadow-sm">
            {initials}
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#2F6A94] block leading-none">
              {greeting},
            </span>
            <span className="text-[16px] font-extrabold text-[#0F2E4C] block leading-tight mt-1 truncate max-w-[210px]">
              {user?.nama || 'Pegawai'}
            </span>
          </div>
        </div>

        {/* Tombol Refresh */}
        <button
          type="button"
          onClick={loadData}
          aria-label="Refresh Data Absensi"
          className="w-[44px] h-[44px] rounded-[14px] bg-white border border-[#BFE0F5] text-[#1479BD] flex items-center justify-center shadow-sm hover:bg-[#DCEDF8] transition active:scale-95"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Kartu Hero Jam */}
      <div className="bg-[#1479BD] rounded-[28px] p-[22px] text-white shadow-lg relative overflow-hidden">
        {/* Label Shift & Tombol Ganti */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentShift.nama} · {currentShift.jam}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowShiftSheet(true)}
            className="text-[12px] font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition active:scale-95"
          >
            Ganti
          </button>
        </div>

        {/* Jam Besar 84px + Detik 28px #BFE0F5 */}
        <div className="flex items-baseline my-1">
          <div className="text-[84px] font-extrabold tabular-nums tracking-tighter leading-none">
            {hh}.{mm}
          </div>
          <div className="text-[28px] font-extrabold tabular-nums text-[#BFE0F5] ml-1.5 leading-none">
            .{ss}
          </div>
        </div>

        {/* Tanggal & Chip Status GPS */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 text-xs">
          <span className="font-semibold text-[#DCEDF8]">{dateStr}</span>
          {gpsActive ? (
            <span className="inline-flex items-center gap-1 bg-[#0F2E4C]/40 text-[#DCEDF8] px-2.5 py-1 rounded-full text-[11px] font-bold">
              <MapPin className="w-3 h-3 text-[#BFE0F5]" />
              GPS Aktif · {gpsDistance}m
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-[#D14343] text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
              <AlertCircle className="w-3 h-3" />
              GPS Tidak Aktif
            </span>
          )}
        </div>
      </div>

      {/* State GPS Tidak Aktif Notice */}
      {!gpsActive && (
        <div className="bg-red-50 border border-[#D14343] rounded-[22px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D14343] flex-shrink-0" />
            <span className="text-xs font-bold text-[#D14343]">
              Aktifkan GPS untuk bisa absen
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(() => setGpsActive(true));
              }
              setGpsActive(true);
            }}
            className="h-[36px] px-3.5 bg-[#D14343] text-white text-xs font-bold rounded-full hover:bg-red-700 transition"
          >
            Aktifkan
          </button>
        </div>
      )}

      {/* Dua Kartu Putih: Masuk / Pulang */}
      <div className="grid grid-cols-2 gap-[12px]">
        {/* Kartu Masuk */}
        <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#BFE0F5]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#2F6A94]">
              Masuk
            </span>
            {hasCheckedIn && <StatusBadge status={todayRecord?.status || 'Hadir'} size="sm" />}
          </div>
          <div className="text-[26px] font-extrabold text-[#0F2E4C] tabular-nums mt-1">
            {todayRecord?.jam_masuk
              ? (todayRecord.jam_masuk.includes('T')
                  ? new Date(todayRecord.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : todayRecord.jam_masuk.slice(0, 5))
              : '--:--'}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-0.5 block">
            {hasCheckedIn ? 'Hadir · Terverifikasi' : 'Jadwal: 08.00 WIB'}
          </span>
        </div>

        {/* Kartu Pulang */}
        <div className="bg-white rounded-[22px] p-4 shadow-sm border border-[#BFE0F5]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#2F6A94]">
              Pulang
            </span>
            {hasCheckedOut && <StatusBadge status="Hadir" size="sm" />}
          </div>
          <div className="text-[26px] font-extrabold text-[#0F2E4C] tabular-nums mt-1">
            {todayRecord?.jam_pulang
              ? (todayRecord.jam_pulang.includes('T')
                  ? new Date(todayRecord.jam_pulang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : todayRecord.jam_pulang.slice(0, 5))
              : '--:--'}
          </div>
          <span className="text-[11px] font-semibold text-[#2F6A94] mt-0.5 block">
            {hasCheckedOut ? 'Selesai bertugas' : (hasCheckedIn ? 'Siap absen pulang' : 'Jadwal: 14.00 WIB')}
          </span>
        </div>
      </div>

      {/* Kartu Biru Muda Ringkasan Bulan Ini */}
      <div className="bg-[#BFE0F5] rounded-[22px] p-4 shadow-sm flex items-center justify-between border border-[#1479BD]/20">
        <div>
          <span className="text-[12px] font-bold text-[#0F2E4C] uppercase tracking-wider block">
            Rekap Kehadiran Bulan Ini
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2E4C]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1479BD]" />
              Hadir: {todayRecord?.jam_masuk ? '23 hari' : '22 hari'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D14343]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D14343]" />
              Telat: 1 hari
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToRiwayat}
          className="text-[12px] font-bold text-[#1479BD] hover:underline flex items-center gap-0.5"
        >
          Riwayat
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tombol Pil Utama: "Absen Masuk" / "Absen Pulang" / "Absen Hari Ini Selesai" */}
      <div className="pt-2 mb-8">
        <button
          type="button"
          disabled={!gpsActive || (hasCheckedIn && hasCheckedOut)}
          onClick={handleAbsenClick}
          className={`w-full h-[68px] rounded-full p-2 pl-6 flex items-center justify-between shadow-lg transition active:scale-[0.98] ${
            !gpsActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : hasCheckedIn && !hasCheckedOut
              ? 'bg-[#0F2E4C] text-white hover:bg-[#17406A]'
              : hasCheckedIn && hasCheckedOut
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#1479BD] text-white hover:bg-[#10659e]'
          }`}
        >
          <div className="text-left">
            <span className="text-[17px] font-extrabold tracking-wide block leading-none">
              {!hasCheckedIn
                ? 'Absen Masuk'
                : !hasCheckedOut
                ? 'Absen Pulang'
                : 'Absen Hari Ini Selesai'}
            </span>
            <span className="text-[11px] text-white/80 font-medium mt-1 block">
              {!hasCheckedIn
                ? 'Pindai wajah & GPS Vokasi UI'
                : !hasCheckedOut
                ? 'Pindai wajah akhir shift'
                : 'Terima kasih atas dedikasi pelayanan Anda'}
            </span>
          </div>

          {/* Lingkaran Putih 50px Berisi Ikon Sidik Jari */}
          <div className="w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Fingerprint
              className={`w-7 h-7 ${
                !gpsActive
                  ? 'text-gray-400'
                  : hasCheckedIn && !hasCheckedOut
                  ? 'text-[#0F2E4C]'
                  : hasCheckedIn && hasCheckedOut
                  ? 'text-gray-400'
                  : 'text-[#1479BD]'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Bottom Sheet Ganti Shift */}
      {showShiftSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0">
          <div className="bg-white w-full max-w-[390px] rounded-t-[28px] p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEDF8]">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2E4C]">Pilih Shift Kerja</h3>
                <p className="text-xs text-[#2F6A94]">Daftar shift operasional RS Vokasi UI</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftSheet(false)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {shiftOptions.map((sh) => {
                const isSelected = currentShift.nama === sh.nama;
                return (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => {
                      setCurrentShift(sh);
                      setShowShiftSheet(false);
                    }}
                    className={`w-full p-3.5 rounded-[16px] text-left transition flex items-center justify-between border ${
                      isSelected
                        ? 'border-[#1479BD] bg-[#DCEDF8]/50 shadow-xs'
                        : 'border-[#BFE0F5] hover:bg-[#DCEDF8]/30'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-extrabold text-[#0F2E4C]">{sh.nama}</div>
                      <div className="text-xs text-[#2F6A94] font-medium mt-0.5">{sh.jam} WIB</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#1479BD] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
