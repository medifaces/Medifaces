import React from 'react';
import { Home, Camera, FileText, User as UserIcon } from 'lucide-react';

export type EmployeeTab = 'home' | 'absen' | 'cuti' | 'profil';

interface Props {
  activeTab: EmployeeTab;
  onTabChange: (tab: EmployeeTab) => void;
  children: React.ReactNode;
}

export const EmployeeLayout: React.FC<Props> = ({ activeTab, onTabChange, children }) => {
  return (
    <div className="min-h-screen bg-[#DCEDF8] flex justify-center selection:bg-[#BFE0F5]">
      {/* Container Mobile Lebar Acuan 390px */}
      <div className="w-full max-w-[390px] min-h-screen flex flex-col justify-between relative bg-[#DCEDF8] shadow-xl pb-[90px]">
        {/* Main Content Area with 20px padding */}
        <main className="p-[20px] flex-1 flex flex-col gap-[12px] overflow-y-auto">
          {children}
        </main>

        {/* Bottom Nav: tinggi 76px, putih, sudut atas radius 24px, 4 item */}
        <nav
          aria-label="Navigasi Utama Pegawai"
          className="fixed bottom-0 w-full max-w-[390px] h-[76px] bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgba(15,46,76,0.08)] flex items-center justify-around px-2 z-40 border-t border-[#BFE0F5]/50"
        >
          <button
            type="button"
            onClick={() => onTabChange('home')}
            aria-label="Beranda"
            className={`flex flex-col items-center justify-center flex-1 h-full transition min-h-[44px] ${
              activeTab === 'home' ? 'text-[#0F2E4C]' : 'text-[#2F6A94]/60 hover:text-[#2F6A94]'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'home' ? 'bg-[#DCEDF8]' : ''}`}>
              <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className={`text-[12px] mt-0.5 ${activeTab === 'home' ? 'font-extrabold text-[#0F2E4C]' : 'font-medium'}`}>
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('absen')}
            aria-label="Kamera Absen"
            className={`flex flex-col items-center justify-center flex-1 h-full transition min-h-[44px] ${
              activeTab === 'absen' ? 'text-[#0F2E4C]' : 'text-[#2F6A94]/60 hover:text-[#2F6A94]'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'absen' ? 'bg-[#DCEDF8]' : ''}`}>
              <Camera className={`w-5 h-5 ${activeTab === 'absen' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className={`text-[12px] mt-0.5 ${activeTab === 'absen' ? 'font-extrabold text-[#0F2E4C]' : 'font-medium'}`}>
              Absen
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('cuti')}
            aria-label="Izin dan Cuti"
            className={`flex flex-col items-center justify-center flex-1 h-full transition min-h-[44px] ${
              activeTab === 'cuti' ? 'text-[#0F2E4C]' : 'text-[#2F6A94]/60 hover:text-[#2F6A94]'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'cuti' ? 'bg-[#DCEDF8]' : ''}`}>
              <FileText className={`w-5 h-5 ${activeTab === 'cuti' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className={`text-[12px] mt-0.5 ${activeTab === 'cuti' ? 'font-extrabold text-[#0F2E4C]' : 'font-medium'}`}>
              Cuti
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('profil')}
            aria-label="Profil Pegawai"
            className={`flex flex-col items-center justify-center flex-1 h-full transition min-h-[44px] ${
              activeTab === 'profil' ? 'text-[#0F2E4C]' : 'text-[#2F6A94]/60 hover:text-[#2F6A94]'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'profil' ? 'bg-[#DCEDF8]' : ''}`}>
              <UserIcon className={`w-5 h-5 ${activeTab === 'profil' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className={`text-[12px] mt-0.5 ${activeTab === 'profil' ? 'font-extrabold text-[#0F2E4C]' : 'font-medium'}`}>
              Profil
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};
