import { getDatabase, inMemoryDB } from './utils/db.js';
import { verifyToken } from './utils/auth.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    // 1. GET ALL SHIFTS & JADWAL
    if (event.httpMethod === 'GET') {
      let shifts = [];
      let jadwal = [];

      if (isPostgres) {
        shifts = await sql`SELECT * FROM shifts ORDER BY id ASC`;
        jadwal = await sql`
          SELECT j.*, u.nama, u.nip, u.unit, s.nama_shift 
          FROM jadwal j
          JOIN users u ON j.user_id = u.id
          JOIN shifts s ON j.shift_id = s.id
        `;
      } else {
        shifts = inMemoryDB.shifts;
        jadwal = inMemoryDB.jadwal.map(j => {
          const u = inMemoryDB.users.find(usr => usr.id === j.user_id);
          const s = inMemoryDB.shifts.find(sh => sh.id === j.shift_id);
          return {
            ...j,
            nama: u?.nama,
            nip: u?.nip,
            unit: u?.unit,
            nama_shift: s?.nama_shift,
          };
        });
      }

      return { statusCode: 200, headers, body: JSON.stringify({ shifts, jadwal }) };
    }

    // 2. POST (UPDATE / ASSIGN SHIFT)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { user_id, shift_id, hari, kode } = body;

      // Pegawai hanya boleh ganti shift miliknya sendiri
      const targetUserId = user.role === 'sdm' ? (user_id || user.id) : user.id;

      if (!targetUserId || !shift_id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Data shift tidak lengkap.' }) };
      }

      if (isPostgres) {
        await sql`
          INSERT INTO jadwal (user_id, shift_id, hari, kode)
          VALUES (${targetUserId}, ${shift_id}, ${hari || 'Senin'}, ${kode || 'P'})
        `;
      } else {
        const existing = inMemoryDB.jadwal.find(j => j.user_id === targetUserId && j.hari === hari);
        if (existing) {
          existing.shift_id = Number(shift_id);
          if (kode) existing.kode = kode;
        } else {
          inMemoryDB.jadwal.push({
            id: inMemoryDB.jadwal.length + 1,
            user_id: targetUserId,
            shift_id: Number(shift_id),
            hari: hari || 'Senin',
            kode: kode || 'P',
          });
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Shift berhasil diperbarui.' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Shift error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
