import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Plus, Edit, Power, ShieldAlert, CheckCircle, X, User as UserIcon, RotateCcw } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const AdminPegawai: React.FC = () => {
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<any>(null);

  // Form State
  const [formNip, setFormNip] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJabatan, setFormJabatan] = useState('Staf Medis');
  const [formUnit, setFormUnit] = useState('Instalasi Rawat Inap');
  const [formLokasi, setFormLokasi] = useState('Gedung A Lt. 2');
  const [formJam, setFormJam] = useState('08.00 - 14.00 WIB');
  const [formError, setFormError] = useState('');

  const unitOptions = [
    'Semua Unit',
    'Instalasi Rawat Inap',
    'Instalasi Gawat Darurat (UGD)',
    'Poli Penyakit Dalam',
    'Instalasi Farmasi',
    'Manajemen SDM',
  ];

  useEffect(() => {
    loadPegawai();
  }, [search, unitFilter]);

  const loadPegawai = async () => {
    setLoading(true);
    try {
      const res = await api.getPegawai(search, unitFilter);
      if (res?.pegawai) {
        setPegawaiList(res.pegawai);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPegawai(null);
    setFormNip('');
    setFormNama('');
    setFormEmail('');
    setFormJabatan('Perawat Pelaksana');
    setFormUnit('Instalasi Rawat Inap');
    setFormLokasi('Gedung A Lt. 2 - Vokasi UI');
    setFormJam('08.00 - 14.00 WIB');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingPegawai(p);
    setFormNip(p.nip);
    setFormNama(p.nama);
    setFormEmail(p.email);
    setFormJabatan(p.jabatan || 'Staf Medis');
    setFormUnit(p.unit || 'Instalasi Rawat Inap');
    setFormLokasi(p.lokasi_penempatan || 'Gedung A Lt. 2');
    setFormJam(p.jam_kerja || '08.00 - 14.00 WIB');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingPegawai) {
        // Edit existing
        await api.updatePegawai(editingPegawai.id, {
          nip: formNip,
          nama: formNama,
          email: formEmail,
          jabatan: formJabatan,
          unit: formUnit,
          lokasi_penempatan: formLokasi,
          jam_kerja: formJam,
        });
      } else {
        // Add new
        await api.tambahPegawai({
          nip: formNip,
          nama: formNama,
          email: formEmail,
          jabatan: formJabatan,
          unit: formUnit,
          lokasi_penempatan: formLokasi,
          jam_kerja: formJam,
          role: 'karyawan',
        });
      }

      setShowModal(false);
      loadPegawai();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data pegawai.');
    }
  };

  const handleToggleActive = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin mengubah status keaktifan akun staf ini?')) {
      await api.toggleActivePegawai(id);
      loadPegawai();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls: Pencarian, Filter Unit, Tombol + Tambah Pegawai */}
      <div className="bg-white rounded-[22px] p-[20px] shadow-sm border border-[#BFE0F5] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          {/* Kolom Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#2F6A94] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, atau email..."
              className="w-full h-[46px] pl-10 pr-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
            />
          </div>

          {/* Filter Unit */}
          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="h-[46px] px-4 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
          >
            {unitOptions.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Tombol + Tambah Pegawai */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-[46px] px-5 rounded-full bg-[#1479BD] text-white font-extrabold text-xs tracking-wide shadow-md hover:bg-[#10659e] transition flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      {/* Grid Kartu Staf 4 Kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {pegawaiList.map(staf => {
          const initials = (staf.nama || 'SM')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase();

          const hasFace = staf.face_registered;

          return (
            <div
              key={staf.id}
              className={`bg-white rounded-[22px] p-[20px] shadow-sm border transition flex flex-col justify-between ${
                staf.is_active ? 'border-[#BFE0F5]' : 'border-gray-300 opacity-75'
              }`}
            >
              <div>
                {/* Header Kartu: Inisial/Foto & Badge Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-[46px] h-[46px] rounded-[16px] bg-[#1479BD] text-white font-extrabold text-[16px] flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={staf.is_active ? 'Aktif' : 'Nonaktif'} size="sm" />
                    {/* Badge Amber "Wajah belum terdaftar" / Biru "Wajah terdaftar" */}
                    {!hasFace ? (
                      <span className="bg-[#F2A65A] text-[#0F2E4C] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        Wajah belum terdaftar
                      </span>
                    ) : (
                      <span className="bg-[#1479BD] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Wajah terdaftar
                      </span>
                    )}
                  </div>
                </div>

                {/* Nama & NIP */}
                <h4 className="text-sm font-extrabold text-[#0F2E4C] leading-snug line-clamp-1">
                  {staf.nama}
                </h4>
                <span className="text-[11px] font-extrabold text-[#1479BD] mt-0.5 block">
                  NIP: {staf.nip}
                </span>

                {/* Jabatan & Unit */}
                <div className="mt-3 pt-3 border-t border-[#DCEDF8] text-[11px] space-y-1">
                  <div className="text-[#0F2E4C] font-bold truncate">
                    {staf.jabatan}
                  </div>
                  <div className="text-[#2F6A94] font-medium truncate">
                    {staf.unit}
                  </div>
                </div>
              </div>

              {/* Tombol Aksi: Edit & Nonaktifkan (Outline Merah) */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#DCEDF8]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(staf)}
                  className="h-[36px] rounded-[12px] bg-[#DCEDF8] text-[#1479BD] font-bold text-xs hover:bg-[#BFE0F5] transition flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(staf.id)}
                  className={`h-[36px] rounded-[12px] border font-bold text-xs transition flex items-center justify-center gap-1 ${
                    staf.is_active
                      ? 'border-[#D14343] text-[#D14343] hover:bg-red-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{staf.is_active ? 'Nonaktif' : 'Aktifkan'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Pegawai */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-lg w-full shadow-2xl border border-[#BFE0F5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCEDF8] mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F2E4C]">
                  {editingPegawai ? 'Edit Data Staf Medis' : 'Tambah Staf Medis Baru'}
                </h3>
                <p className="text-xs text-[#2F6A94]">Password awal otomatis menggunakan nilai SEED_PASSWORD</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={e => setFormNip(e.target.value)}
                    placeholder="Contoh: 101"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="email@rumahsakit.com"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={e => setFormNama(e.target.value)}
                  placeholder="Nama lengkap dan gelar staf"
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Jabatan Medis
                  </label>
                  <input
                    type="text"
                    required
                    value={formJabatan}
                    onChange={e => setFormJabatan(e.target.value)}
                    placeholder="Contoh: Perawat Pelaksana"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Instalasi / Unit
                  </label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  >
                    {unitOptions.filter(u => u !== 'Semua Unit').map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Lokasi Penempatan
                  </label>
                  <input
                    type="text"
                    value={formLokasi}
                    onChange={e => setFormLokasi(e.target.value)}
                    placeholder="Gedung A Lt. 2 - Vokasi UI"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Jam Kerja
                  </label>
                  <input
                    type="text"
                    value={formJam}
                    onChange={e => setFormJam(e.target.value)}
                    placeholder="08.00 - 14.00 WIB"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                {editingPegawai ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Reset kata sandi staf "${editingPegawai.nama}" ke nilai awal (vokasi123)? Staf wajib mengganti kata sandi saat login berikutnya.`)) {
                        try {
                          await api.resetPasswordPegawai(editingPegawai.id);
                          alert(`Kata sandi untuk ${editingPegawai.nama} berhasil direset ke nilai default.`);
                        } catch (e: any) {
                          setFormError(e.message || 'Gagal mereset kata sandi.');
                        }
                      }
                    }}
                    className="h-[44px] px-4 rounded-full border border-[#F2A65A] text-[#0F2E4C] hover:bg-[#F2A65A]/10 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#F2A65A]" />
                    <span>Reset Password</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
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
                    Simpan Staf
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
