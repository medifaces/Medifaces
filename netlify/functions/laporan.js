import { getDatabase, inMemoryDB } from './utils/db.js';
import { verifyToken } from './utils/auth.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = verifyToken(event);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesi tidak valid.' }) };
  }

  const { isPostgres, sql } = getDatabase();

  try {
    const params = event.queryStringParameters || {};
    const unitFilter = params.unit || '';
    const statusFilter = params.status || '';
    const startDate = params.start_date || '';
    const endDate = params.end_date || '';

    // 1. GET RIWAYAT & LAPORAN
    if (event.httpMethod === 'GET') {
      let records = [];

      if (isPostgres) {
        if (user.role === 'sdm') {
          records = await sql`
            SELECT a.*, u.nama as user_nama, u.nip as user_nip, u.unit as user_unit, s.nama_shift
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN shifts s ON a.shift_id = s.id
            ORDER BY a.tanggal DESC, a.id DESC
          `;
        } else {
          records = await sql`
            SELECT a.*, u.nama as user_nama, u.nip as user_nip, u.unit as user_unit, s.nama_shift
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN shifts s ON a.shift_id = s.id
            WHERE a.user_id = ${user.id}
            ORDER BY a.tanggal DESC, a.id DESC
          `;
        }
      } else {
        const source = user.role === 'sdm'
          ? inMemoryDB.absensi
          : inMemoryDB.absensi.filter(a => a.user_id === user.id);

        records = source.map(a => {
          const u = inMemoryDB.users.find(usr => usr.id === a.user_id);
          const s = inMemoryDB.shifts.find(sh => sh.id === a.shift_id);
          return {
            ...a,
            user_nama: u?.nama,
            user_nip: u?.nip,
            user_unit: u?.unit,
            nama_shift: s?.nama_shift,
          };
        }).reverse();
      }

      // Filter in memory if query parameters supplied
      if (unitFilter && unitFilter !== 'Semua Unit') {
        records = records.filter(r => r.user_unit === unitFilter);
      }
      if (statusFilter && statusFilter !== 'Semua Status') {
        records = records.filter(r => r.status === statusFilter);
      }
      if (startDate) {
        records = records.filter(r => r.tanggal >= startDate);
      }
      if (endDate) {
        records = records.filter(r => r.tanggal <= endDate);
      }

      // Hitung ringkasan
      const total = records.length || 1;
      const countHadir = records.filter(r => r.status === 'Hadir').length;
      const countTelat = records.filter(r => r.status === 'Telat').length;
      const countSakit = records.filter(r => r.status === 'Sakit').length;
      const countIzin = records.filter(r => r.status === 'Izin').length;

      // Hitung per unit
      const unitGroups = {};
      const allStaff = inMemoryDB.users.filter(u => u.role === 'karyawan');
      allStaff.forEach(staf => {
        if (!unitGroups[staf.unit]) {
          unitGroups[staf.unit] = { unit: staf.unit, totalPegawai: 0, hadir: 0, telat: 0 };
        }
        unitGroups[staf.unit].totalPegawai += 1;
      });

      records.forEach(r => {
        if (unitGroups[r.user_unit]) {
          if (r.status === 'Hadir') unitGroups[r.user_unit].hadir += 1;
          if (r.status === 'Telat') unitGroups[r.user_unit].telat += 1;
        }
      });

      const rekapUnit = Object.values(unitGroups).map(u => ({
        unit: u.unit,
        total: u.totalPegawai,
        hadir: u.hadir,
        telat: u.telat,
        persentase: u.totalPegawai > 0 ? Math.round(((u.hadir) / u.totalPegawai) * 100) : 0,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          records,
          summary: {
            total: records.length,
            hadir: countHadir,
            telat: countTelat,
            sakit: countSakit,
            izin: countIzin,
            hadir_pct: Math.round((countHadir / total) * 100),
            telat_pct: Math.round((countTelat / total) * 100),
            sakit_pct: Math.round((countSakit / total) * 100),
            izin_pct: Math.round((countIzin / total) * 100),
          },
          rekapUnit,
        }),
      };
    }

    // 2. PUT: KOREKSI MANUAL OLEH MSDM
    if (event.httpMethod === 'PUT') {
      if (user.role !== 'sdm') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Akses ditolak: Hanya MSDM yang dapat melakukan koreksi manual.' }) };
      }

      const body = JSON.parse(event.body || '{}');
      const { id, status, keterangan } = body;

      if (!id || !status) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID dan Status wajib diisi.' }) };
      }

      if (isPostgres) {
        await sql`
          UPDATE absensi 
          SET status = ${status}, keterangan = ${keterangan || 'Koreksi manual oleh MSDM'}
          WHERE id = ${id}
        `;
      } else {
        const item = inMemoryDB.absensi.find(a => a.id === Number(id));
        if (item) {
          item.status = status;
          item.keterangan = keterangan || 'Koreksi manual oleh MSDM';
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Data absensi berhasil dikoreksi.' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Laporan error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
