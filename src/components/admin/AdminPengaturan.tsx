import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MapPin, ShieldCheck, Lock, Sliders, CheckCircle2 } from 'lucide-react';

export const AdminPengaturan: React.FC = () => {
  const [instansi, setInstansi] = useState('Fakultas Vokasi UI, Depok');
  const [lat, setLat] = useState(-6.3642);
  const [lng, setLng] = useState(106.8285);
  const [radius, setRadius] = useState(100);
  const [toleransi, setToleransi] = useState(15);
  const [ambangWajah, setAmbangWajah] = useState(85);
  const [allowSimulation, setAllowSimulation] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPengaturan().then(res => {
      if (res?.pengaturan) {
        setInstansi(res.pengaturan.nama_instansi || 'Fakultas Vokasi UI, Depok');
        setLat(res.pengaturan.pusat_lat || -6.3642);
        setLng(res.pengaturan.pusat_lng || 106.8285);
        setRadius(res.pengaturan.radius_meter || 100);
        setToleransi(res.pengaturan.toleransi_telat_menit || 15);
        setAmbangWajah(res.pengaturan.ambang_wajah_persen || 85);
        setAllowSimulation(Boolean(res.pengaturan.allow_gps_simulation));
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updatePengaturan({
        nama_instansi: instansi,
        pusat_lat: lat,
        pusat_lng: lng,
        radius_meter: radius,
        toleransi_telat_menit: toleransi,
        ambang_wajah_persen: ambangWajah,
        allow_gps_simulation: allowSimulation,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {savedMsg && (
        <div className="bg-[#1479BD] text-white p-4 rounded-[20px] text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Pengaturan sistem berhasil disimpan dan langsung diterapkan ke seluruh perangkat staf!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Kartu Lokasi & Jam Kerja */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCEDF8]">
            <MapPin className="w-5 h-5 text-[#1479BD]" />
            <div>
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Lokasi & Radius Geofencing</h3>
              <p className="text-xs text-[#2F6A94]">Koordinat acuan presensi rumus Haversine</p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
              Nama Instansi / Rumah Sakit
            </label>
            <input
              type="text"
              value={instansi}
              onChange={e => setInstansi(e.target.value)}
              className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Latitude Pusat
              </label>
              <input
                type="number"
                step="0.0000001"
                value={lat}
                onChange={e => setLat(Number(e.target.value))}
                className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Longitude Pusat
              </label>
              <input
                type="number"
                step="0.0000001"
                value={lng}
                onChange={e => setLng(Number(e.target.value))}
                className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Radius Geofencing (Meter)
              </label>
              <input
                type="number"
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                Toleransi Telat (Menit)
              </label>
              <input
                type="number"
                value={toleransi}
                onChange={e => setToleransi(Number(e.target.value))}
                className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
              />
            </div>
          </div>
        </div>

        {/* 2. Kartu Verifikasi Wajah */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCEDF8]">
            <ShieldCheck className="w-5 h-5 text-[#1479BD]" />
            <div>
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Verifikasi Biometrik Wajah</h3>
              <p className="text-xs text-[#2F6A94]">Ambang kecocokan minimum dan deteksi liveness</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider">
                Ambang Batas Kecocokan Wajah
              </label>
              <span className="text-sm font-extrabold text-[#1479BD] tabular-nums">
                {ambangWajah}%
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="99"
              value={ambangWajah}
              onChange={e => setAmbangWajah(Number(e.target.value))}
              className="w-full accent-[#1479BD] h-2 bg-[#DCEDF8] rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-[#2F6A94] mt-2">
              Default standar medis: 85%. Nilai lebih tinggi meningkatkan keamanan terhadap foto spoofing.
            </p>
          </div>

          <div className="p-3.5 rounded-[14px] bg-[#DCEDF8]/60 border border-[#BFE0F5] text-xs">
            <span className="font-bold text-[#0F2E4C] block mb-1">Fitur Liveness Check:</span>
            <span className="text-[#2F6A94]">
              Mewajibkan gerakan berkedip alami saat di depan kamera untuk mencegah spoofing foto atau layar cetak.
            </span>
          </div>
        </div>

        {/* 3. Kartu Akun & Keamanan */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#DCEDF8]">
            <Lock className="w-5 h-5 text-[#1479BD]" />
            <div>
              <h3 className="text-base font-extrabold text-[#0F2E4C]">Akun & Keamanan Sistem</h3>
              <p className="text-xs text-[#2F6A94]">Standar enkripsi password dan sesi JWT</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-[14px] bg-[#DCEDF8]/50 flex items-center justify-between">
              <span className="font-bold text-[#0F2E4C]">Hashing Password:</span>
              <span className="font-extrabold text-[#1479BD]">bcrypt (10 rounds)</span>
            </div>
            <div className="p-3 rounded-[14px] bg-[#DCEDF8]/50 flex items-center justify-between">
              <span className="font-bold text-[#0F2E4C]">Masa Berlaku Token JWT:</span>
              <span className="font-extrabold text-[#1479BD]">7 Hari (Auto-expire)</span>
            </div>
            <div className="p-3 rounded-[14px] bg-[#DCEDF8]/50 flex items-center justify-between">
              <span className="font-bold text-[#0F2E4C]">Aktivasi Staf Baru:</span>
              <span className="font-extrabold text-[#D14343]">Wajib Ganti Password</span>
            </div>
          </div>
        </div>

        {/* 4. Kartu Mode Uji Coba */}
        <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#DCEDF8]">
              <Sliders className="w-5 h-5 text-[#F2A65A]" />
              <div>
                <h3 className="text-base font-extrabold text-[#0F2E4C]">Mode Uji Coba & Simulasi</h3>
                <p className="text-xs text-[#2F6A94]">Konfigurasi tombol toggle uji coba di aplikasi pegawai</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-3.5 rounded-[16px] bg-amber-50 border border-amber-200">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#0F2E4C]">Izinkan Simulasi GPS</span>
                  <span className="text-[10px] uppercase font-extrabold bg-[#F2A65A] text-[#0F2E4C] px-2 py-0.5 rounded-full">
                    Demo Mode
                  </span>
                </div>
                <p className="text-[11px] text-[#2F6A94] mt-1">
                  Menampilkan toggle 'Simulasi GPS (mode uji coba)' pada layar kamera pegawai untuk simulasi radius Vokasi UI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAllowSimulation(!allowSimulation)}
                className={`w-12 h-6 rounded-full transition p-1 flex items-center flex-shrink-0 ${
                  allowSimulation ? 'bg-[#1479BD] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#DCEDF8] flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="h-[46px] px-8 rounded-full bg-[#1479BD] text-white font-extrabold text-xs tracking-wide shadow-md hover:bg-[#10659e] transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
