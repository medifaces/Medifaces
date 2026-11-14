import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { EmployeeLayout, EmployeeTab } from './components/employee/EmployeeLayout';
import { HomeScreen } from './components/employee/HomeScreen';
import { CameraScreen } from './components/employee/CameraScreen';
import { HistoryScreen } from './components/employee/HistoryScreen';
import { LeaveScreen } from './components/employee/LeaveScreen';
import { ProfileScreen } from './components/employee/ProfileScreen';

import { AdminLayout, AdminMenu } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLive } from './components/admin/AdminLive';
import { AdminPegawai } from './components/admin/AdminPegawai';
import { AdminShift } from './components/admin/AdminShift';
import { AdminRiwayat } from './components/admin/AdminRiwayat';
import { AdminLaporan } from './components/admin/AdminLaporan';
import { AdminIzin } from './components/admin/AdminIzin';
import { AdminPengaturan } from './components/admin/AdminPengaturan';

export const App: React.FC = () => {
  const { user, isLoading, mustChangePassword, setMustChangePassword } = useAuth();

  // Employee State
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>('home');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isHistoryActive, setIsHistoryActive] = useState<boolean>(false);

  // Admin State
  const [adminMenu, setAdminMenu] = useState<AdminMenu>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DCEDF8] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1479BD] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      {/* Mandatory Change Password Modal on First Login */}
      {mustChangePassword && (
        <ChangePasswordModal onSuccess={() => setMustChangePassword(false)} />
      )}

      {/* Role: SDM (Admin Portal MSDM) */}
      {user.role === 'sdm' ? (
        <AdminLayout activeMenu={adminMenu} onMenuChange={setAdminMenu}>
          {adminMenu === 'dashboard' && <AdminDashboard />}
          {adminMenu === 'live' && <AdminLive />}
          {adminMenu === 'pegawai' && <AdminPegawai />}
          {adminMenu === 'shift' && <AdminShift />}
          {adminMenu === 'riwayat' && <AdminRiwayat />}
          {adminMenu === 'laporan' && <AdminLaporan />}
          {adminMenu === 'izin' && <AdminIzin />}
          {adminMenu === 'pengaturan' && <AdminPengaturan />}
        </AdminLayout>
      ) : (
        /* Role: Karyawan (Pegawai Mobile View 390px) */
        <>
          {isCameraActive ? (
            <CameraScreen
              onBack={() => setIsCameraActive(false)}
              onSuccess={() => {
                setIsCameraActive(false);
                setEmployeeTab('home');
              }}
            />
          ) : isHistoryActive ? (
            <EmployeeLayout activeTab="home" onTabChange={t => { setIsHistoryActive(false); setEmployeeTab(t); }}>
              <HistoryScreen onBack={() => setIsHistoryActive(false)} />
            </EmployeeLayout>
          ) : (
            <EmployeeLayout
              activeTab={employeeTab}
              onTabChange={tab => {
                if (tab === 'absen') {
                  setIsCameraActive(true);
                } else {
                  setEmployeeTab(tab);
                }
              }}
            >
              {employeeTab === 'home' && (
                <HomeScreen
                  onGoToAbsen={() => setIsCameraActive(true)}
                  onGoToRiwayat={() => setIsHistoryActive(true)}
                />
              )}
              {employeeTab === 'cuti' && <LeaveScreen />}
              {employeeTab === 'profil' && <ProfileScreen />}
            </EmployeeLayout>
          )}
        </>
      )}
    </>
  );
};

export default App;

