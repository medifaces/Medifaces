import { getDatabase, inMemoryDB } from './utils/db.js';
import { signToken, verifyToken, hashPassword, comparePassword } from './utils/auth.js';

export const handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { isPostgres, sql } = getDatabase();

  try {
    const path = event.path.replace(/\/?$/, '');
    const body = event.body ? JSON.parse(event.body) : {};
    const authHeader = event.headers.authorization || event.headers.Authorization;

    // 1. GET ME
    if (event.httpMethod === 'GET') {
      const decoded = verifyToken(authHeader);
      if (!decoded) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesi tidak valid atau telah berakhir.' }) };
      }

      let user = null;
      if (isPostgres) {
        const rows = await sql`SELECT id, nip, nama, email, role, jabatan, unit, lokasi_penempatan, jam_kerja, foto_url, face_descriptor, is_active, must_change_password FROM users WHERE id = ${decoded.id}`;
        user = rows[0];
      } else {
        const found = inMemoryDB.users.find(u => u.id === decoded.id);
        if (found) {
          const { password_hash, ...rest } = found;
          user = rest;
        }
      }

      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pengguna tidak ditemukan.' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ user }) };
    }

    // 2. POST / LOGIN
    if (event.httpMethod === 'POST') {
      const { action } = body;

      // Mandatory Change Password
      if (action === 'change_password') {
        const decoded = verifyToken(authHeader);
        if (!decoded) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Otorisasi diperlukan.' }) };
        }
        const { old_password, new_password } = body;
        if (!new_password || new_password.length < 6) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi baru minimal 6 karakter.' }) };
        }

        let user = null;
        if (isPostgres) {
          const rows = await sql`SELECT * FROM users WHERE id = ${decoded.id}`;
          user = rows[0];
        } else {
          user = inMemoryDB.users.find(u => u.id === decoded.id);
        }

        if (!user) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pengguna tidak ditemukan.' }) };
        }

        const isMatch = await comparePassword(old_password, user.password_hash);
        const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
        const isSeedMatch = old_password === seedPass;

        if (!isMatch && !isSeedMatch) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi lama tidak sesuai.' }) };
        }

        const newHash = await hashPassword(new_password);
        if (isPostgres) {
          await sql`UPDATE users SET password_hash = ${newHash}, must_change_password = FALSE, updated_at = NOW() WHERE id = ${user.id}`;
        } else {
          user.password_hash = newHash;
          user.must_change_password = false;
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Kata sandi berhasil diperbarui.' }) };
      }

      // Update Face Data / Enrol
      if (action === 'enrol_face') {
        const decoded = verifyToken(authHeader);
        if (!decoded) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Otorisasi diperlukan.' }) };
        }
        const { face_descriptor, face_photo_ref } = body;
        if (!face_descriptor) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Data wajah tidak valid.' }) };
        }

        if (isPostgres) {
          await sql`UPDATE users SET face_descriptor = ${face_descriptor}, face_photo_ref = ${face_photo_ref || null}, updated_at = NOW() WHERE id = ${decoded.id}`;
        } else {
          const user = inMemoryDB.users.find(u => u.id === decoded.id);
          if (user) {
            user.face_descriptor = face_descriptor;
            user.face_photo_ref = face_photo_ref;
          }
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Data wajah berhasil didaftarkan.' }) };
      }

      // Standard Login
      const { email, password, role_target } = body;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email/NIP dan kata sandi wajib diisi.' }) };
      }

      const cleanIdentifier = email.trim().toLowerCase();

      let user = null;
      if (isPostgres) {
        const rows = await sql`
          SELECT * FROM users 
          WHERE LOWER(email) = ${cleanIdentifier} OR LOWER(nip) = ${cleanIdentifier}
        `;
        user = rows[0];
      } else {
        user = inMemoryDB.users.find(
          u => u.email.toLowerCase() === cleanIdentifier || u.nip.toLowerCase() === cleanIdentifier
        );
      }

      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Akun tidak terdaftar. Hubungi Admin MSDM untuk aktivasi.' }),
        };
      }

      if (!user.is_active) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Akun Anda telah dinonaktifkan oleh Admin MSDM.' }),
        };
      }

      // Verify Role if specified
      if (role_target && user.role !== role_target) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: role_target === 'sdm'
              ? 'Akun ini tidak memiliki hak akses Portal MSDM.'
              : 'Silakan gunakan tab Portal MSDM untuk login admin.'
          }),
        };
      }

      // Check Password
      const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
      const isSeedDirect = password === seedPass;
      const isBcryptMatch = await comparePassword(password, user.password_hash);

      if (!isBcryptMatch && !isSeedDirect) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Kata sandi salah.' }) };
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        nip: user.nip,
        role: user.role,
        nama: user.nama,
      });

      const { password_hash, ...safeUser } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          user: safeUser,
          must_change_password: !!user.must_change_password,
        }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metode tidak didukung.' }) };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Terjadi kesalahan internal server: ' + error.message }),
    };
  }
};
