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

  const { isPostgres, sql } = getDatabase();

  try {
    // 1. GET PENGATURAN
    if (event.httpMethod === 'GET') {
      let pengaturan = null;
      if (isPostgres) {
        const rows = await sql`SELECT * FROM pengaturan ORDER BY id LIMIT 1`;
        pengaturan = rows[0];
      } else {
        pengaturan = inMemoryDB.pengaturan;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ pengaturan }) };
    }

    // 2. PUT PENGATURAN (ADMIN ONLY)
    if (event.httpMethod === 'PUT') {
      const user = verifyToken(event);
      if (!user || user.role !== 'sdm') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Akses ditolak: Hanya Admin MSDM yang dapat mengubah pengaturan sistem.' }) };
      }

      const body = JSON.parse(event.body || '{}');
      const {
        nama_instansi,
        pusat_lat,
        pusat_lng,
        radius_meter,
        toleransi_telat_menit,
        ambang_wajah_persen,
        allow_gps_simulation,
      } = body;

      if (isPostgres) {
        const updated = await sql`
          UPDATE pengaturan 
          SET nama_instansi = COALESCE(${nama_instansi}, nama_instansi),
              pusat_lat = COALESCE(${pusat_lat}, pusat_lat),
              pusat_lng = COALESCE(${pusat_lng}, pusat_lng),
              radius_meter = COALESCE(${radius_meter}, radius_meter),
              toleransi_telat_menit = COALESCE(${toleransi_telat_menit}, toleransi_telat_menit),
              ambang_wajah_persen = COALESCE(${ambang_wajah_persen}, ambang_wajah_persen),
              allow_gps_simulation = COALESCE(${allow_gps_simulation}, allow_gps_simulation),
              updated_at = NOW()
          WHERE id = 1
          RETURNING *
        `;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, pengaturan: updated[0] }) };
      } else {
        if (nama_instansi !== undefined) inMemoryDB.pengaturan.nama_instansi = nama_instansi;
        if (pusat_lat !== undefined) inMemoryDB.pengaturan.pusat_lat = Number(pusat_lat);
        if (pusat_lng !== undefined) inMemoryDB.pengaturan.pusat_lng = Number(pusat_lng);
        if (radius_meter !== undefined) inMemoryDB.pengaturan.radius_meter = Number(radius_meter);
        if (toleransi_telat_menit !== undefined) inMemoryDB.pengaturan.toleransi_telat_menit = Number(toleransi_telat_menit);
        if (ambang_wajah_persen !== undefined) inMemoryDB.pengaturan.ambang_wajah_persen = Number(ambang_wajah_persen);
        if (allow_gps_simulation !== undefined) inMemoryDB.pengaturan.allow_gps_simulation = Boolean(allow_gps_simulation);

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, pengaturan: inMemoryDB.pengaturan }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Pengaturan error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
