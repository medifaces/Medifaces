import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  whiteSubtitle?: boolean;
}

export const MedicalLogo: React.FC<Props> = ({ size = 'md', whiteSubtitle = false }) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-[10px]',
    md: 'w-11 h-11 rounded-[14px]',
    lg: 'w-14 h-14 rounded-[18px]',
  };

  const textSizes = {
    sm: 'text-lg tracking-tight',
    md: 'text-2xl tracking-tight',
    lg: 'text-3xl tracking-tight',
  };

  return (
    <div className="flex items-center gap-3">
      {/* Kotak biru berisi palang medis putih */}
      <div className={`${iconSizes[size]} bg-[#1479BD] flex items-center justify-center shadow-sm flex-shrink-0 relative`}>
        <div className="w-[38%] h-[75%] bg-white rounded-[2px] absolute"></div>
        <div className="h-[38%] w-[75%] bg-white rounded-[2px] absolute"></div>
      </div>
      <div>
        <div className={`font-extrabold ${textSizes[size]} text-[#0F2E4C] leading-none tracking-tight flex items-center`}>
          <span>MEDI</span><span className="text-[#1479BD]">FACES</span>
        </div>
        <div className={`text-[11px] font-semibold tracking-wider uppercase mt-1 ${whiteSubtitle ? 'text-[#BFE0F5]' : 'text-[#2F6A94]'}`}>
          Hospital Attendance System
        </div>
      </div>
    </div>
  );
};
