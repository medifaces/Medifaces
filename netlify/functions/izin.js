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
    // 1. GET LIST IZIN / CUTI
    if (event.httpMethod === 'GET') {
      let list = [];
      if (isPostgres) {
        if (user.role === 'sdm') {
          list = await sql`
            SELECT p.*, u.nama as user_nama, u.nip as user_nip, u.unit as user_unit 
            FROM pengajuan_izin p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.id DESC
          `;
        } else {
          list = await sql`
            SELECT p.*, u.nama as user_nama, u.nip as user_nip, u.unit as user_unit 
            FROM pengajuan_izin p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ${user.id}
            ORDER BY p.id DESC
          `;
        }
      } else {
        const source = user.role === 'sdm'
          ? inMemoryDB.pengajuan_izin
          : inMemoryDB.pengajuan_izin.filter(p => p.user_id === user.id);

        list = source.map(p => {
          const u = inMemoryDB.users.find(usr => usr.id === p.user_id);
          return {
            ...p,
            user_nama: u?.nama,
            user_nip: u?.nip,
            user_unit: u?.unit,
          };
        }).reverse();
      }

      return { statusCode: 200, headers, body: JSON.stringify({ list }) };
    }

    // 2. POST (AJUKAN IZIN / CUTI / SAKIT)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { jenis, tanggal_mulai, tanggal_selesai, keterangan, dokumen_url } = body;

      if (!jenis || !tanggal_mulai || !tanggal_selesai || !keterangan) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mohon lengkapi jenis, rentang tanggal, dan keterangan.' }) };
      }

      if (isPostgres) {
        const inserted = await sql`
          INSERT INTO pengajuan_izin (
            user_id, jenis, tanggal_mulai, tanggal_selesai, keterangan, dokumen_url, status
          ) VALUES (
            ${user.id}, ${jenis}, ${tanggal_mulai}, ${tanggal_selesai}, ${keterangan}, ${dokumen_url || null}, 'Menunggu'
          )
          RETURNING *
        `;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true, item: inserted[0] }) };
      } else {
        const newItem = {
          id: inMemoryDB.pengajuan_izin.length + 1,
          user_id: user.id,
          user_nama: user.nama,
          user_nip: user.nip,
          jenis,
          tanggal_mulai,
          tanggal_selesai,
          keterangan,
          dokumen_url: dokumen_url || null,
          status: 'Menunggu',
          catatan_admin: null,
          approved_by: null,
          created_at: new Date().toISOString(),
        };
        inMemoryDB.pengajuan_izin.push(newItem);
        return { statusCode: 201, headers, body: JSON.stringify({ success: true, item: newItem }) };
      }
    }

    // 3. PUT (APPROVAL BY MSDM)
    if (event.httpMethod === 'PUT') {
      if (user.role !== 'sdm') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Hanya Admin MSDM yang berwenang memberikan persetujuan.' }) };
      }

      const body = JSON.parse(event.body || '{}');
      const { id, status, catatan_admin } = body;

      if (!id || !['Disetujui', 'Ditolak'].includes(status)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Status harus Disetujui atau Ditolak.' }) };
      }

      if (isPostgres) {
        await sql`
          UPDATE pengajuan_izin 
          SET status = ${status}, catatan_admin = ${catatan_admin || null}, approved_by = ${user.id}, updated_at = NOW()
          WHERE id = ${id}
        `;
      } else {
        const item = inMemoryDB.pengajuan_izin.find(p => p.id === Number(id));
        if (item) {
          item.status = status;
          item.catatan_admin = catatan_admin || null;
          item.approved_by = user.id;
          item.updated_at = new Date().toISOString();
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: `Pengajuan berhasil diubah menjadi ${status}.` }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Izin error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
