import { getDatabase, inMemoryDB } from './utils/db.js';
import { verifyToken } from './utils/auth.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = verifyToken(event);
  if (!user || user.role !== 'sdm') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Akses ditolak: Hanya MSDM yang berwenang memantau siaran langsung absensi.' }) };
  }

  const { isPostgres, sql } = getDatabase();

  try {
    let logs = [];
    if (isPostgres) {
      logs = await sql`
        SELECT a.*, u.nama as user_nama, u.nip as user_nip, u.unit as user_unit
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.id DESC LIMIT 50
      `;
    } else {
      logs = inMemoryDB.audit_log.map(a => {
        const u = inMemoryDB.users.find(usr => usr.id === a.user_id);
        return {
          ...a,
          user_nama: a.user_nama || u?.nama,
          user_nip: u?.nip,
          user_unit: u?.unit,
        };
      });
    }

    const totalScans = logs.length;
    const successCount = logs.filter(l => l.status === 'SUCCESS').length;
    const rejectedCount = logs.filter(l => l.status === 'REJECTED').length;

    // Kategori alasan penolakan
    const rejectionReasons = [
      { name: 'Di Luar Radius Geofencing', count: logs.filter(l => (l.alasan || '').toLowerCase().includes('radius')).length },
      { name: 'Wajah Tidak Cocok (< Ambang)', count: logs.filter(l => (l.alasan || '').toLowerCase().includes('wajah') || (l.alasan || '').toLowerCase().includes('kemiripan')).length },
      { name: 'Liveness / Kedipan Gagal', count: logs.filter(l => (l.alasan || '').toLowerCase().includes('liveness') || (l.alasan || '').toLowerCase().includes('kedip')).length },
      { name: 'GPS Nonaktif / Palsu', count: logs.filter(l => (l.alasan || '').toLowerCase().includes('gps')).length },
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalScans,
        successCount,
        rejectedCount,
        logs: logs.slice(0, 30),
        rejectionReasons,
      }),
    };
  } catch (err) {
    console.error('Live error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
