import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Plus, Edit, Power, ShieldAlert, CheckCircle, X, User as UserIcon, RotateCcw, UserCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { HOSPITAL_UNIT_CATEGORIES, ALL_HOSPITAL_UNITS, HOSPITAL_ROLES, OTHER_OPTION } from '../../constants/hospitalData';

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
  const [formJabatan, setFormJabatan] = useState(HOSPITAL_ROLES[0]);
  const [formCustomJabatan, setFormCustomJabatan] = useState('');
  const [formUnit, setFormUnit] = useState(ALL_HOSPITAL_UNITS[0]);
  const [formCustomUnit, setFormCustomUnit] = useState('');
  const [formLokasi, setFormLokasi] = useState('Gedung A Lt. 2 - Vokasi UI');
  const [formJam, setFormJam] = useState('08.00 - 14.00 WIB');
  const [formError, setFormError] = useState('');

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
    setFormJabatan(HOSPITAL_ROLES[0]);
    setFormCustomJabatan('');
    setFormUnit(ALL_HOSPITAL_UNITS[0]);
    setFormCustomUnit('');
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

    if (HOSPITAL_ROLES.includes(p.jabatan)) {
      setFormJabatan(p.jabatan);
      setFormCustomJabatan('');
    } else {
      setFormJabatan(OTHER_OPTION);
      setFormCustomJabatan(p.jabatan || '');
    }

    if (ALL_HOSPITAL_UNITS.includes(p.unit)) {
      setFormUnit(p.unit);
      setFormCustomUnit('');
    } else {
      setFormUnit(OTHER_OPTION);
      setFormCustomUnit(p.unit || '');
    }

    setFormLokasi(p.lokasi_penempatan || 'Gedung A Lt. 2');
    setFormJam(p.jam_kerja || '08.00 - 14.00 WIB');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalUnit = formUnit === OTHER_OPTION ? formCustomUnit.trim() : formUnit;
    if (!finalUnit) {
      setFormError('Unit kerja wajib diisi.');
      return;
    }

    const finalJabatan = formJabatan === OTHER_OPTION ? formCustomJabatan.trim() : formJabatan;
    if (!finalJabatan) {
      setFormError('Jabatan pegawai wajib diisi.');
      return;
    }

    try {
      if (editingPegawai) {
        // Edit existing
        await api.updatePegawai(editingPegawai.id, {
          nip: formNip,
          nama: formNama,
          email: formEmail,
          jabatan: finalJabatan,
          unit: finalUnit,
          lokasi_penempatan: formLokasi,
          jam_kerja: formJam,
        });
      } else {
        // Add new
        await api.tambahPegawai({
          nip: formNip,
          nama: formNama,
          email: formEmail,
          jabatan: finalJabatan,
          unit: finalUnit,
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

      {/* Tabel Data Pegawai */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#BFE0F5]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#0F2E4C]">Direktori Pegawai Rumah Sakit</h3>
            <p className="text-xs text-[#2F6A94]">Total {pegawaiList.length} staf medis & operasional terdaftar</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#1479BD] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#DCEDF8] text-[#0F2E4C] font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 rounded-l-[14px]">Pegawai</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Jabatan & Unit</th>
                  <th className="py-3 px-4">Penempatan & Jam Kerja</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 rounded-r-[14px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCEDF8]">
                {pegawaiList.map(staf => (
                  <tr key={staf.id} className="hover:bg-[#DCEDF8]/30 transition">
                    {/* Pegawai */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1479BD] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {staf.foto_url ? (
                            <img src={staf.foto_url} alt={staf.nama} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            staf.nama?.slice(0, 2).toUpperCase() || 'ST'
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#0F2E4C] text-[13px]">{staf.nama}</div>
                          <div className="text-[11px] text-[#2F6A94] font-semibold">NIP {staf.nip}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-3.5 px-4 font-semibold text-[#0F2E4C]">
                      <div>{staf.email}</div>
                      <div className="text-[11px] text-[#2F6A94]">{staf.no_hp || '-'}</div>
                    </td>

                    {/* Jabatan & Unit */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F2E4C]">{staf.jabatan}</div>
                      <span className="inline-block text-[10px] font-extrabold text-[#1479BD] bg-[#DCEDF8] px-2 py-0.5 rounded-full mt-0.5">
                        {staf.unit}
                      </span>
                    </td>

                    {/* Penempatan */}
                    <td className="py-3.5 px-4 text-[#0F2E4C]">
                      <div className="font-semibold">{staf.lokasi_penempatan || '-'}</div>
                      <div className="text-[11px] text-[#2F6A94]">{staf.jam_kerja || '-'}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={staf.is_active ? 'Hadir' : 'Absen'} label={staf.is_active ? 'Aktif' : 'Non-aktif'} size="sm" />
                        {staf.must_change_password && (
                          <span className="text-[10px] bg-[#F2A65A]/20 text-[#0F2E4C] font-bold px-2 py-0.5 rounded-full" title="Wajib ganti password pada login berikutnya">
                            Perlu Reset Sandi
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(staf)}
                          className="w-8 h-8 rounded-[10px] bg-[#DCEDF8] text-[#1479BD] hover:bg-[#BFE0F5] flex items-center justify-center transition"
                          title="Edit Pegawai"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(staf.id)}
                          className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition ${
                            staf.is_active ? 'bg-red-50 text-[#D14343] hover:bg-red-100' : 'bg-green-50 text-emerald-600 hover:bg-green-100'
                          }`}
                          title={staf.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Reset kata sandi akun ${staf.nama} ke seed password default (vokasi123)?`)) {
                              await api.resetPasswordPegawai(staf.id);
                              alert('Kata sandi berhasil di-reset ke vokasi123. Pegawai akan diminta membuat password baru saat login berikutnya.');
                              loadPegawai();
                            }
                          }}
                          className="w-8 h-8 rounded-[10px] bg-[#DCEDF8] text-[#0F2E4C] hover:bg-[#BFE0F5] flex items-center justify-center transition"
                          title="Reset Kata Sandi"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Pegawai */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-lg w-full shadow-2xl border border-[#BFE0F5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEDF8] mb-4">
              <h3 className="text-lg font-extrabold text-[#0F2E4C]">
                {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#DCEDF8] text-[#0F2E4C] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-[#D14343]/30 text-[#D14343] p-3 rounded-[14px] text-xs font-semibold mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    NIP Pegawai *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={e => setFormNip(e.target.value)}
                    placeholder="Contoh: 198501102008"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                    Email Resmi Rumah Sakit *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="staf@rumahsakit.com"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar *
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

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Instalasi / Unit Kerja *
                </label>
                <select
                  value={formUnit}
                  onChange={e => setFormUnit(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                >
                  {HOSPITAL_UNIT_CATEGORIES.map(cat => (
                    <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                      {cat.units.map(u => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </select>

                {formUnit === OTHER_OPTION && (
                  <input
                    type="text"
                    required
                    value={formCustomUnit}
                    onChange={e => setFormCustomUnit(e.target.value)}
                    placeholder="Tuliskan nama unit kerja"
                    className="w-full h-[44px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD] mt-2 border border-[#1479BD]/30"
                  />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#2F6A94] uppercase tracking-wider mb-1">
                  Jabatan / Peran Staf *
                </label>
                <select
                  value={formJabatan}
                  onChange={e => setFormJabatan(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD]"
                >
                  {HOSPITAL_ROLES.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </select>

                {formJabatan === OTHER_OPTION && (
                  <input
                    type="text"
                    required
                    value={formCustomJabatan}
                    onChange={e => setFormCustomJabatan(e.target.value)}
                    placeholder="Tuliskan nama jabatan staf"
                    className="w-full h-[44px] px-3.5 rounded-[14px] bg-[#DCEDF8] text-[#0F2E4C] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1479BD] mt-2 border border-[#1479BD]/30"
                  />
                )}
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

              <div className="p-3 bg-[#DCEDF8]/60 rounded-[14px] border border-[#BFE0F5] text-[11px] text-[#2F6A94]">
                <p>
                  <strong>Catatan Sandi Awal:</strong> Pegawai baru dibuat dengan kata sandi awal default (vokasi123) dan diwajibkan membuat kata sandi baru pada saat aktivasi akun pertama kali.
                </p>
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
                  {editingPegawai ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
