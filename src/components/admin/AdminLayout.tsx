import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MedicalLogo } from '../common/MedicalLogo';
import {
  LayoutDashboard,
  Radio,
  Users,
  CalendarDays,
  FileSpreadsheet,
  BarChart3,
  CheckSquare,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

export type AdminMenu =
  | 'dashboard'
  | 'live'
  | 'pegawai'
  | 'shift'
  | 'riwayat'
  | 'laporan'
  | 'izin'
  | 'pengaturan';

interface Props {
  activeMenu: AdminMenu;
  onMenuChange: (menu: AdminMenu) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<Props> = ({ activeMenu, onMenuChange, children }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard MSDM', icon: LayoutDashboard },
    { id: 'live', label: 'Absensi Live', icon: Radio },
    { id: 'pegawai', label: 'Data Pegawai', icon: Users },
    { id: 'shift', label: 'Jadwal & Shift', icon: CalendarDays },
    { id: 'riwayat', label: 'Riwayat Absensi', icon: FileSpreadsheet },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'izin', label: 'Izin & Cuti', icon: CheckSquare },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const getPageTitle = () => {
    switch (activeMenu) {
      case 'dashboard':
        return { title: 'Dashboard MSDM', subtitle: 'Ikhtisar kehadiran staf rumah sakit secara real-time.' };
      case 'live':
        return { title: 'Absensi Live & Deteksi', subtitle: 'Siaran langsung pemindaian biometrik dan audit penolakan.' };
      case 'pegawai':
        return { title: 'Data Pegawai', subtitle: 'Kelola data staf medis, pendaftaran wajah, dan status akun.' };
      case 'shift':
        return { title: 'Jadwal & Shift', subtitle: 'Matriks alokasi shift pelayanan dan giliran tugas mingguan.' };
      case 'riwayat':
        return { title: 'Riwayat Absensi', subtitle: 'Log presensi harian staf dan fasilitas koreksi manual.' };
      case 'laporan':
        return { title: 'Laporan Kehadiran', subtitle: 'Analisis persentase kehadiran dan ekspor laporan resmi.' };
      case 'izin':
        return { title: 'Persetujuan Izin & Cuti', subtitle: 'Verifikasi surat dokter dan persetujuan cuti tenaga medis.' };
      case 'pengaturan':
        return { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi geofencing, radius, toleransi, dan ambang wajah.' };
      default:
        return { title: 'Portal MSDM', subtitle: 'Hospital HR Management System' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="min-h-screen bg-[#DCEDF8] flex selection:bg-[#BFE0F5]">
      {/* Sidebar Kiri 248px Putih */}
      <aside className="w-[248px] bg-white border-r border-[#BFE0F5] flex flex-col justify-between p-5 fixed inset-y-0 left-0 z-30 shadow-sm overflow-y-auto">
        <div>
          {/* Logo + MEDIFACES */}
          <div className="pb-6 border-b border-[#DCEDF8]">
            <MedicalLogo size="sm" />
          </div>

          {/* 8 Menu Navigation */}
          {/* Tinggi menu 46px radius 14px, menu aktif latar #1479BD teks putih */}
          <nav aria-label="Navigasi Menu Admin MSDM" className="mt-5 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onMenuChange(item.id as AdminMenu)}
                  className={`w-full h-[46px] rounded-[14px] px-3.5 flex items-center gap-3 text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#1479BD] text-white shadow-md'
                      : 'text-[#2F6A94] hover:bg-[#DCEDF8]/60 hover:text-[#0F2E4C]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#1479BD]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#DCEDF8]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#1479BD] text-white font-extrabold text-xs flex items-center justify-center">
                SDM
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-extrabold text-[#0F2E4C] block truncate">
                  {user?.nama || 'Admin MSDM'}
                </span>
                <span className="text-[10px] text-[#2F6A94] font-semibold block truncate">
                  {user?.email || 'sdm@vokasi.ui.ac.id'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Keluar"
              aria-label="Logout"
              className="p-1.5 rounded-[10px] text-[#D14343] hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-[#2F6A94]/70 font-semibold text-center leading-tight">
            MEDIFACES © 2026<br />Hospital HR Management
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Konten padding 24px 32px */}
      <div className="flex-1 ml-[248px] flex flex-col min-w-0">
        {/* Header Halaman */}
        <header className="bg-white/80 backdrop-blur-md border-b border-[#BFE0F5] px-[32px] py-[20px] flex items-center justify-between sticky top-0 z-20">
          <div>
            {/* Judul 26px weight 800 + subjudul */}
            <h1 className="text-[26px] font-extrabold text-[#0F2E4C] tracking-tight leading-none">
              {title}
            </h1>
            <p className="text-xs font-medium text-[#2F6A94] mt-1.5">
              {subtitle}
            </p>
          </div>

          {/* Kanan: Pil "Admin MSDM" */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-[#DCEDF8] text-[#1479BD] border border-[#BFE0F5] px-4 py-1.5 rounded-full text-xs font-extrabold shadow-xs">
              <Shield className="w-3.5 h-3.5 text-[#1479BD]" />
              Admin MSDM
            </span>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <main className="p-[32px] flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
