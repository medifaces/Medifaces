import { getDatabase, inMemoryDB } from './utils/db.js';
import { verifyToken } from './utils/auth.js';
import { calculateHaversineDistance } from './utils/geofence.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. GET STATUS ABSENSI HARI INI
    if (event.httpMethod === 'GET') {
      let record = null;
      let pengaturan = null;
      let shift = null;

      if (isPostgres) {
        const rows = await sql`
          SELECT a.*, s.nama_shift, s.jam_masuk as shift_masuk, s.jam_pulang as shift_pulang 
          FROM absensi a
          LEFT JOIN shifts s ON a.shift_id = s.id
          WHERE a.user_id = ${user.id} AND a.tanggal = ${todayStr}
          ORDER BY a.id DESC LIMIT 1
        `;
        record = rows[0] || null;

        const pRows = await sql`SELECT * FROM pengaturan ORDER BY id LIMIT 1`;
        pengaturan = pRows[0];

        const sRows = await sql`SELECT * FROM shifts WHERE id = 1 LIMIT 1`;
        shift = sRows[0];
      } else {
        record = inMemoryDB.absensi.find(a => a.user_id === user.id && a.tanggal === todayStr) || null;
        pengaturan = inMemoryDB.pengaturan;
        shift = inMemoryDB.shifts[0];
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          record,
          pengaturan,
          shift,
          serverTime: new Date().toISOString(),
        }),
      };
    }

    // 2. POST ABSEN (MASUK / PULANG)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        tipe, // 'masuk' | 'pulang'
        lat,
        lng,
        is_simulated_gps,
        skor_wajah = 0,
        liveness_passed = false,
        foto_base64,
        shift_id = 1,
      } = body;

      // Ambil pengaturan
      let settings = null;
      if (isPostgres) {
        const pRows = await sql`SELECT * FROM pengaturan ORDER BY id LIMIT 1`;
        settings = pRows[0];
      } else {
        settings = inMemoryDB.pengaturan;
      }

      const centerLat = Number(settings?.pusat_lat ?? -6.3642);
      const centerLng = Number(settings?.pusat_lng ?? 106.8285);
      const maxRadius = Number(settings?.radius_meter ?? 100);
      const faceThreshold = Number(settings?.ambang_wajah_persen ?? 85);
      const lateTolerance = Number(settings?.toleransi_telat_menit ?? 15);
      const allowSimulation = Boolean(settings?.allow_gps_simulation ?? true);

      // Cek Simulasi GPS
      if (is_simulated_gps && !allowSimulation) {
        const reason = 'Simulasi GPS tidak diizinkan oleh sistem rumah sakit.';
        await recordAuditLog({
          user_id: user.id,
          user_nama: user.nama,
          action: `Pindai Wajah (${tipe}) Ditolak`,
          status: 'REJECTED',
          alasan: reason,
          jarak_meter: 0,
          skor_wajah,
        });
        return { statusCode: 400, headers, body: JSON.stringify({ error: reason }) };
      }

      // 1. Verifikasi Geofence (Haversine)
      if (lat === undefined || lng === undefined) {
        const reason = 'Koordinat GPS tidak terdeteksi. Aktifkan GPS pada perangkat.';
        await recordAuditLog({
          user_id: user.id,
          user_nama: user.nama,
          action: `Absen ${tipe} Gagal`,
          status: 'REJECTED',
          alasan: reason,
          jarak_meter: null,
          skor_wajah,
        });
        return { statusCode: 400, headers, body: JSON.stringify({ error: reason }) };
      }

      const distance = calculateHaversineDistance(lat, lng, centerLat, centerLng);

      if (distance > maxRadius) {
        const reason = `Di luar radius geofencing (${Math.round(distance)} m > batas ${maxRadius} m). Anda harus berada di area RS / Vokasi UI.`;
        await recordAuditLog({
          user_id: user.id,
          user_nama: user.nama,
          action: `Absen ${tipe} Ditolak (Radius)`,
          status: 'REJECTED',
          alasan: reason,
          jarak_meter: distance,
          skor_wajah,
        });
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: reason,
            distance,
            maxRadius,
          }),
        };
      }

      // 2. Verifikasi Liveness
      if (!liveness_passed) {
        const reason = 'Verifikasi liveness gagal (tidak ada kedipan / gerakan terdeteksi).';
        await recordAuditLog({
          user_id: user.id,
          user_nama: user.nama,
          action: `Absen ${tipe} Ditolak (Liveness)`,
          status: 'REJECTED',
          alasan: reason,
          jarak_meter: distance,
          skor_wajah,
        });
        return { statusCode: 400, headers, body: JSON.stringify({ error: reason }) };
      }

      // 3. Verifikasi Skor Wajah
      if (skor_wajah < faceThreshold) {
        const reason = `Kemiripan wajah tidak mencukupi (${Math.round(skor_wajah)}% < ambang ${faceThreshold}%).`;
        await recordAuditLog({
          user_id: user.id,
          user_nama: user.nama,
          action: `Absen ${tipe} Ditolak (Wajah)`,
          status: 'REJECTED',
          alasan: reason,
          jarak_meter: distance,
          skor_wajah,
        });
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: reason,
            skor_wajah,
            faceThreshold,
          }),
        };
      }

      // Cek Shift & Status Keterlambatan
      let shiftObj = inMemoryDB.shifts.find(s => s.id === Number(shift_id)) || inMemoryDB.shifts[0];
      const now = new Date();
      const [shiftHour, shiftMin] = (shiftObj?.jam_masuk || '08:00').split(':').map(Number);
      const shiftStartTime = new Date();
      shiftStartTime.setHours(shiftHour, shiftMin, 0, 0);

      // Hitung toleransi
      const lateThresholdTime = new Date(shiftStartTime.getTime() + lateTolerance * 60 * 1000);
      const isLate = now > lateThresholdTime;
      const statusAbsen = isLate ? 'Telat' : 'Hadir';

      // Simpan data absensi
      let resultRecord = null;
      if (tipe === 'masuk') {
        if (isPostgres) {
          const inserted = await sql`
            INSERT INTO absensi (
              user_id, shift_id, tanggal, jam_masuk, status, jarak_meter, skor_wajah, 
              foto_masuk, lat, lng, is_simulated_gps, keterangan
            ) VALUES (
              ${user.id}, ${shift_id}, ${todayStr}, NOW(), ${statusAbsen}, ${distance}, 
              ${skor_wajah}, ${foto_base64 || ''}, ${lat}, ${lng}, ${!!is_simulated_gps}, 
              ${isLate ? `Terlambat ${Math.round((now - shiftStartTime) / 60000)} menit` : 'Tepat waktu'}
            )
            RETURNING *
          `;
          resultRecord = inserted[0];
        } else {
          // Cari record hari ini atau buat baru
          let existing = inMemoryDB.absensi.find(a => a.user_id === user.id && a.tanggal === todayStr);
          if (existing) {
            existing.jam_masuk = now.toISOString();
            existing.status = statusAbsen;
            existing.jarak_meter = distance;
            existing.skor_wajah = skor_wajah;
            existing.foto_masuk = foto_base64 || existing.foto_masuk;
            existing.lat = lat;
            existing.lng = lng;
            existing.is_simulated_gps = !!is_simulated_gps;
            resultRecord = existing;
          } else {
            resultRecord = {
              id: inMemoryDB.absensi.length + 1,
              user_id: user.id,
              shift_id: Number(shift_id),
              tanggal: todayStr,
              jam_masuk: now.toISOString(),
              jam_pulang: null,
              status: statusAbsen,
              jarak_meter: distance,
              skor_wajah: skor_wajah,
              foto_masuk: foto_base64 || '',
              foto_pulang: null,
              lat,
              lng,
              is_simulated_gps: !!is_simulated_gps,
              keterangan: isLate ? `Terlambat ${Math.round((now - shiftStartTime) / 60000)} menit` : 'Tepat waktu',
              created_at: now.toISOString(),
            };
            inMemoryDB.absensi.push(resultRecord);
          }
        }
      } else {
        // Pulang
        if (isPostgres) {
          const updated = await sql`
            UPDATE absensi 
            SET jam_pulang = NOW(), foto_pulang = ${foto_base64 || ''}
            WHERE user_id = ${user.id} AND tanggal = ${todayStr}
            RETURNING *
          `;
          resultRecord = updated[0];
        } else {
          let existing = inMemoryDB.absensi.find(a => a.user_id === user.id && a.tanggal === todayStr);
          if (!existing) {
            existing = {
              id: inMemoryDB.absensi.length + 1,
              user_id: user.id,
              shift_id: Number(shift_id),
              tanggal: todayStr,
              jam_masuk: now.toISOString(),
              jam_pulang: now.toISOString(),
              status: 'Hadir',
              jarak_meter: distance,
              skor_wajah: skor_wajah,
              foto_masuk: '',
              foto_pulang: foto_base64 || '',
              lat,
              lng,
              is_simulated_gps: !!is_simulated_gps,
              keterangan: 'Absen pulang selesai',
              created_at: now.toISOString(),
            };
            inMemoryDB.absensi.push(existing);
          } else {
            existing.jam_pulang = now.toISOString();
            existing.foto_pulang = foto_base64 || existing.foto_pulang;
          }
          resultRecord = existing;
        }
      }

      // Catat audit log sukses
      await recordAuditLog({
        user_id: user.id,
        user_nama: user.nama,
        action: `Absen ${tipe === 'masuk' ? 'Masuk' : 'Pulang'}`,
        status: 'SUCCESS',
        alasan: `Verifikasi wajah ${Math.round(skor_wajah)}% & Geofencing ${Math.round(distance)}m valid (${statusAbsen})`,
        jarak_meter: distance,
        skor_wajah,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Absen ${tipe} berhasil!`,
          record: resultRecord,
        }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Absen function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Terjadi kesalahan sistem: ' + err.message }),
    };
  }

  async function recordAuditLog(logData) {
    try {
      if (isPostgres) {
        await sql`
          INSERT INTO audit_log (user_id, action, status, alasan, jarak_meter, skor_wajah)
          VALUES (${logData.user_id}, ${logData.action}, ${logData.status}, ${logData.alasan}, ${logData.jarak_meter || null}, ${logData.skor_wajah || null})
        `;
      } else {
        inMemoryDB.audit_log.unshift({
          id: inMemoryDB.audit_log.length + 1,
          ...logData,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Failed recording audit log:', e);
    }
  }
};
