import { getDatabase, inMemoryDB } from './utils/db.js';
import { verifyToken, hashPassword } from './utils/auth.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const user = verifyToken(event);
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesi tidak valid.' }) };
  }

  // Cek Role: Hanya SDM
  if (user.role !== 'sdm') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Akses ditolak: Pegawai tidak memiliki wewenang mengelola data pegawai.' })
    };
  }

  const { isPostgres, sql } = getDatabase();

  try {
    // 1. GET LIST PEGAWAI
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const search = (params.search || '').toLowerCase().trim();
      const unit = params.unit || '';

      if (isPostgres) {
        let rows = await sql`
          SELECT id, nip, nama, email, role, jabatan, unit, lokasi_penempatan, jam_kerja, 
                 foto_url, face_descriptor IS NOT NULL as face_registered, is_active, 
                 must_change_password, is_auto_registered, created_at 
          FROM users 
          ORDER BY id ASC
        `;
        if (search) {
          rows = rows.filter(r => r.nama.toLowerCase().includes(search) || r.nip.toLowerCase().includes(search) || r.email.toLowerCase().includes(search));
        }
        if (unit && unit !== 'Semua Unit') {
          rows = rows.filter(r => r.unit === unit);
        }
        return { statusCode: 200, headers, body: JSON.stringify({ pegawai: rows }) };
      } else {
        let list = inMemoryDB.users.map(u => ({
          id: u.id,
          nip: u.nip,
          nama: u.nama,
          email: u.email,
          role: u.role,
          jabatan: u.jabatan,
          unit: u.unit,
          lokasi_penempatan: u.lokasi_penempatan,
          jam_kerja: u.jam_kerja,
          foto_url: u.foto_url,
          face_registered: !!u.face_descriptor,
          is_active: u.is_active,
          must_change_password: u.must_change_password,
          is_auto_registered: !!u.is_auto_registered,
          created_at: u.created_at,
        }));

        if (search) {
          list = list.filter(u => u.nama.toLowerCase().includes(search) || u.nip.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
        }
        if (unit && unit !== 'Semua Unit') {
          list = list.filter(u => u.unit === unit);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ pegawai: list }) };
      }
    }

    // 2. POST (TAMBAH PEGAWAI BARU)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { nip, nama, email, role = 'karyawan', jabatan, unit, lokasi_penempatan, jam_kerja } = body;

      if (!nip || !nama || !email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'NIP, Nama lengkap, dan Email wajib diisi.' }) };
      }

      const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
      const passwordHash = await hashPassword(seedPass);

      if (isPostgres) {
        // Cek duplikasi email / nip
        const existing = await sql`SELECT id FROM users WHERE LOWER(email) = ${email.toLowerCase()} OR nip = ${nip}`;
        if (existing.length > 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email atau NIP sudah digunakan oleh staf lain.' }) };
        }

        const inserted = await sql`
          INSERT INTO users (
            nip, nama, email, password_hash, role, jabatan, unit, lokasi_penempatan, jam_kerja, 
            is_active, must_change_password
          ) VALUES (
            ${nip}, ${nama}, ${email.toLowerCase()}, ${passwordHash}, ${role}, 
            ${jabatan || 'Staf Medis'}, ${unit || 'Instalasi Rawat Inap'}, 
            ${lokasi_penempatan || 'Gedung A Lt. 2'}, ${jam_kerja || '08.00 - 14.00 WIB'}, 
            TRUE, TRUE
          )
          RETURNING id, nip, nama, email, role, jabatan, unit, is_active, must_change_password
        `;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true, user: inserted[0] }) };
      } else {
        const dup = inMemoryDB.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.nip === nip);
        if (dup) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email atau NIP sudah digunakan oleh staf lain.' }) };
        }

        const newUser = {
          id: inMemoryDB.users.length + 1,
          nip,
          nama,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
          jabatan: jabatan || 'Staf Medis',
          unit: unit || 'Instalasi Rawat Inap',
          lokasi_penempatan: lokasi_penempatan || 'Gedung A Lt. 2',
          jam_kerja: jam_kerja || '08.00 - 14.00 WIB',
          foto_url: '',
          face_descriptor: null,
          face_photo_ref: null,
          is_active: true,
          must_change_password: true,
          created_at: new Date().toISOString(),
        };

        inMemoryDB.users.push(newUser);
        const { password_hash, ...safeUser } = newUser;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true, user: safeUser }) };
      }
    }

    // 3. PUT (UPDATE PEGAWAI / TOGGLE AKTIF / RESET PASSWORD)
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { id, action, ...fields } = body;

      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID pegawai tidak valid.' }) };
      }

      if (action === 'toggle_active') {
        let targetUser = null;
        if (isPostgres) {
          const updated = await sql`
            UPDATE users SET is_active = NOT is_active, updated_at = NOW() 
            WHERE id = ${id}
            RETURNING id, nama, email, is_active
          `;
          targetUser = updated[0];
          if (targetUser) {
            await sql`
              INSERT INTO audit_log (user_id, action, status, alasan)
              VALUES (${user.id}, 'Ubah Status Pegawai', 'SUCCESS', ${'Status akun ' + targetUser.nama + ' diubah menjadi ' + (targetUser.is_active ? 'Aktif' : 'Nonaktif')})
            `;
          }
        } else {
          const u = inMemoryDB.users.find(u => u.id === Number(id));
          if (u) {
            u.is_active = !u.is_active;
            targetUser = u;
            inMemoryDB.audit_log.unshift({
              id: inMemoryDB.audit_log.length + 1,
              user_id: user.id,
              user_nama: user.nama,
              action: 'Ubah Status Pegawai',
              status: 'SUCCESS',
              alasan: `Status akun ${u.nama} diubah menjadi ${u.is_active ? 'Aktif' : 'Nonaktif'}`,
              created_at: new Date().toISOString(),
            });
          }
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Status pegawai berhasil diubah.' }) };
      }

      if (action === 'reset_password') {
        const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
        const passwordHash = await hashPassword(seedPass);
        if (isPostgres) {
          const updated = await sql`
            UPDATE users 
            SET password_hash = ${passwordHash}, must_change_password = TRUE, updated_at = NOW() 
            WHERE id = ${id}
            RETURNING id, nama, email
          `;
          if (updated[0]) {
            await sql`
              INSERT INTO audit_log (user_id, action, status, alasan)
              VALUES (${user.id}, 'Reset Kata Sandi Pegawai', 'SUCCESS', ${'Kata sandi akun ' + updated[0].nama + ' di-reset ke nilai awal oleh Admin MSDM'})
            `;
          }
        } else {
          const u = inMemoryDB.users.find(u => u.id === Number(id));
          if (u) {
            u.password_hash = passwordHash;
            u.must_change_password = true;
            inMemoryDB.audit_log.unshift({
              id: inMemoryDB.audit_log.length + 1,
              user_id: user.id,
              user_nama: user.nama,
              action: 'Reset Kata Sandi Pegawai',
              status: 'SUCCESS',
              alasan: `Kata sandi akun ${u.nama} di-reset ke nilai awal oleh Admin MSDM`,
              created_at: new Date().toISOString(),
            });
          }
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Kata sandi berhasil di-reset ke nilai seed.' }) };
      }

      // Update fields (Termasuk Email, NIP, Nama, Jabatan, Unit, dll)
      if (fields.email) {
        const cleanEmail = fields.email.trim().toLowerCase();
        let emailTaken = false;
        if (isPostgres) {
          const check = await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} AND id != ${id}`;
          emailTaken = check.length > 0;
        } else {
          emailTaken = inMemoryDB.users.some(u => u.email.toLowerCase() === cleanEmail && u.id !== Number(id));
        }
        if (emailTaken) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email sudah digunakan oleh akun lain.' }) };
        }
      }

      if (fields.nip) {
        const cleanNip = fields.nip.trim();
        let nipTaken = false;
        if (isPostgres) {
          const check = await sql`SELECT id FROM users WHERE nip = ${cleanNip} AND id != ${id}`;
          nipTaken = check.length > 0;
        } else {
          nipTaken = inMemoryDB.users.some(u => u.nip === cleanNip && u.id !== Number(id));
        }
        if (nipTaken) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'NIP sudah digunakan oleh staf lain.' }) };
        }
      }

      if (isPostgres) {
        await sql`
          UPDATE users 
          SET nama = COALESCE(${fields.nama}, nama),
              email = COALESCE(${fields.email ? fields.email.trim().toLowerCase() : null}, email),
              nip = COALESCE(${fields.nip ? fields.nip.trim() : null}, nip),
              no_hp = COALESCE(${fields.no_hp}, no_hp),
              jabatan = COALESCE(${fields.jabatan}, jabatan),
              unit = COALESCE(${fields.unit}, unit),
              jam_kerja = COALESCE(${fields.jam_kerja}, jam_kerja),
              lokasi_penempatan = COALESCE(${fields.lokasi_penempatan}, lokasi_penempatan),
              updated_at = NOW()
          WHERE id = ${id}
        `;
      } else {
        const u = inMemoryDB.users.find(u => u.id === Number(id));
        if (u) {
          if (fields.nama) u.nama = fields.nama.trim();
          if (fields.email) u.email = fields.email.trim().toLowerCase();
          if (fields.nip) u.nip = fields.nip.trim();
          if (fields.no_hp !== undefined) u.no_hp = fields.no_hp;
          if (fields.jabatan) u.jabatan = fields.jabatan;
          if (fields.unit) u.unit = fields.unit;
          if (fields.jam_kerja) u.jam_kerja = fields.jam_kerja;
          if (fields.lokasi_penempatan) u.lokasi_penempatan = fields.lokasi_penempatan;
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Data pegawai berhasil diperbarui.' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (err) {
    console.error('Pegawai error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
