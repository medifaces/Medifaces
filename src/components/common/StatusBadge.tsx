import React from 'react';

export type StatusType = 'Hadir' | 'Tepat waktu' | 'Telat' | 'Sakit' | 'Izin' | 'Cuti' | 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Aktif' | 'Nonaktif';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const normalized = status.toLowerCase();

  let bgClass = 'bg-[#1479BD] text-white';

  if (normalized.includes('hadir') || normalized.includes('tepat') || normalized.includes('aktif')) {
    bgClass = 'bg-[#1479BD] text-white';
  } else if (normalized.includes('telat') || normalized.includes('ditolak')) {
    bgClass = 'bg-[#D14343] text-white';
  } else if (normalized.includes('sakit') || normalized.includes('menunggu')) {
    bgClass = 'bg-[#F2A65A] text-[#0F2E4C] font-extrabold';
  } else if (normalized.includes('izin') || normalized.includes('disetujui') || normalized.includes('cuti')) {
    bgClass = 'bg-[#2F6A94] text-white';
  } else if (normalized.includes('nonaktif')) {
    bgClass = 'bg-gray-400 text-white';
  }

  const sizeClass = size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-4 py-1.5 text-[13px]';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-full tracking-wide shadow-sm whitespace-nowrap ${bgClass} ${sizeClass}`}
    >
      {status}
    </span>
  );
};
