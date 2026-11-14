import { getDatabase, inMemoryDB } from './utils/db.js';
import { signToken, verifyToken, hashPassword, comparePassword } from './utils/auth.js';

// Rate Limiting in-memory map: ip -> { count, resetAt }
const ipAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 menit
  const maxAttempts = 10;

  const current = ipAttempts.get(ip);
  if (!current || now > current.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= maxAttempts) {
    return { allowed: false };
  }

  current.count += 1;
  return { allowed: true };
}

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
        const rows = await sql`
          SELECT id, nip, nama, email, no_hp, role, jabatan, unit, lokasi_penempatan, jam_kerja, 
                 foto_url, face_descriptor, is_active, must_change_password, is_auto_registered, is_profile_completed 
          FROM users WHERE id = ${decoded.id}
        `;
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

    // 2. POST (LOGIN, CHANGE PASSWORD, ENROL FACE, UPDATE PROFILE, COMPLETE PROFILE)
    if (event.httpMethod === 'POST') {
      const { action } = body;

      // ── ACTION: COMPLETE PROFILE (Layar "Lengkapi profil" auto-daftar) ──
      if (action === 'complete_profile') {
        const decoded = verifyToken(authHeader);
        if (!decoded) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Otorisasi diperlukan.' }) };
        }

        const { nama, nip, unit, jabatan, new_password } = body;
        if (!nama || !nama.trim()) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nama lengkap wajib diisi.' }) };
        }
        if (!nip || !nip.trim()) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'NIP wajib diisi.' }) };
        }
        if (!new_password || new_password.length < 8) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi baru minimal 8 karakter.' }) };
        }

        const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
        if (new_password === seedPass) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi awal.' }) };
        }

        const cleanNip = nip.trim();

        // Cek keunikan NIP
        let nipTaken = false;
        if (isPostgres) {
          const check = await sql`SELECT id FROM users WHERE nip = ${cleanNip} AND id != ${decoded.id}`;
          nipTaken = check.length > 0;
        } else {
          nipTaken = inMemoryDB.users.some(u => u.nip === cleanNip && u.id !== decoded.id);
        }

        if (nipTaken) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'NIP sudah digunakan oleh staf lain. Silakan periksa kembali NIP Anda.' }) };
        }

        const newHash = await hashPassword(new_password);
        let currentUser = null;

        if (isPostgres) {
          const updated = await sql`
            UPDATE users 
            SET nama = ${nama.trim()},
                nip = ${cleanNip},
                unit = ${unit || 'Instalasi Rawat Inap'},
                jabatan = ${jabatan || 'Staf Medis'},
                password_hash = ${newHash},
                must_change_password = FALSE,
                is_profile_completed = TRUE,
                updated_at = NOW()
            WHERE id = ${decoded.id}
            RETURNING id, nip, nama, email, no_hp, role, jabatan, unit, lokasi_penempatan, jam_kerja, foto_url, face_descriptor, is_active, must_change_password, is_auto_registered, is_profile_completed
          `;
          currentUser = updated[0];

          await sql`
            INSERT INTO audit_log (user_id, action, status, alasan)
            VALUES (${decoded.id}, 'Lengkapi Profil & Ganti Kata Sandi', 'SUCCESS', ${'Pegawai melengkapi profil (NIP: ' + cleanNip + ', Unit: ' + (unit || '-') + ') dan memperbarui kata sandi.'})
          `;
        } else {
          currentUser = inMemoryDB.users.find(u => u.id === decoded.id);
          if (currentUser) {
            currentUser.nama = nama.trim();
            currentUser.nip = cleanNip;
            currentUser.unit = unit || 'Instalasi Rawat Inap';
            currentUser.jabatan = jabatan || 'Staf Medis';
            currentUser.password_hash = newHash;
            currentUser.must_change_password = false;
            currentUser.is_profile_completed = true;

            inMemoryDB.audit_log.unshift({
              id: inMemoryDB.audit_log.length + 1,
              user_id: decoded.id,
              user_nama: currentUser.nama,
              action: 'Lengkapi Profil & Ganti Kata Sandi',
              status: 'SUCCESS',
              alasan: `Pegawai melengkapi profil (NIP: ${cleanNip}, Unit: ${unit || '-'}) dan memperbarui kata sandi.`,
              created_at: new Date().toISOString(),
            });
          }
        }

        if (!currentUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pengguna tidak ditemukan.' }) };
        }

        const { password_hash, ...safeUser } = currentUser;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Profil berhasil dilengkapi dan kata sandi baru aktif.',
            user: safeUser,
          }),
        };
      }

      // ── ACTION: CHANGE PASSWORD ──
      if (action === 'change_password') {
        const decoded = verifyToken(authHeader);
        if (!decoded) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Otorisasi diperlukan.' }) };
        }
        const { old_password, new_password } = body;
        if (!new_password || new_password.length < 8) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi baru minimal 8 karakter.' }) };
        }

        const seedPass = process.env.SEED_PASSWORD || 'vokasi123';
        if (new_password === seedPass) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi awal.' }) };
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
        const isSeedMatch = user.must_change_password && (old_password === seedPass);

        if (!isMatch && !isSeedMatch) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kata sandi saat ini tidak sesuai.' }) };
        }

        const newHash = await hashPassword(new_password);
        if (isPostgres) {
          await sql`UPDATE users SET password_hash = ${newHash}, must_change_password = FALSE, updated_at = NOW() WHERE id = ${user.id}`;
          await sql`
            INSERT INTO audit_log (user_id, action, status, alasan)
            VALUES (${user.id}, 'Ubah Kata Sandi', 'SUCCESS', 'Kata sandi berhasil diperbarui oleh pengguna.')
          `;
        } else {
          user.password_hash = newHash;
          user.must_change_password = false;
          inMemoryDB.audit_log.unshift({
            id: inMemoryDB.audit_log.length + 1,
            user_id: user.id,
            user_nama: user.nama,
            action: 'Ubah Kata Sandi',
            status: 'SUCCESS',
            alasan: 'Kata sandi berhasil diperbarui oleh pengguna.',
            created_at: new Date().toISOString(),
          });
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Kata sandi berhasil diperbarui.' }) };
      }

      // ── ACTION: ENROL FACE ──
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

      // ── ACTION: UPDATE PROFILE (Self) ──
      if (action === 'update_profile') {
        const decoded = verifyToken(authHeader);
        if (!decoded) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Otorisasi diperlukan.' }) };
        }

        const { nama, email, no_hp, foto_url } = body;
        if (!nama || !nama.trim()) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nama lengkap wajib diisi.' }) };
        }
        if (!email || !email.trim() || !email.includes('@')) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Format email tidak valid.' }) };
        }

        const cleanEmail = email.trim().toLowerCase();

        let emailTaken = false;
        if (isPostgres) {
          const check = await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} AND id != ${decoded.id}`;
          emailTaken = check.length > 0;
        } else {
          emailTaken = inMemoryDB.users.some(u => u.email.toLowerCase() === cleanEmail && u.id !== decoded.id);
        }

        if (emailTaken) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email sudah digunakan oleh akun lain. Gunakan email berbeda.' }) };
        }

        let currentUser = null;
        if (isPostgres) {
          const rows = await sql`SELECT * FROM users WHERE id = ${decoded.id}`;
          currentUser = rows[0];
        } else {
          currentUser = inMemoryDB.users.find(u => u.id === decoded.id);
        }

        if (!currentUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pengguna tidak ditemukan.' }) };
        }

        const oldEmail = currentUser.email;
        const emailChanged = oldEmail.toLowerCase() !== cleanEmail;

        if (isPostgres) {
          const updated = await sql`
            UPDATE users 
            SET nama = ${nama.trim()},
                email = ${cleanEmail},
                no_hp = ${no_hp || null},
                foto_url = COALESCE(${foto_url}, foto_url),
                updated_at = NOW()
            WHERE id = ${decoded.id}
            RETURNING id, nip, nama, email, no_hp, role, jabatan, unit, lokasi_penempatan, jam_kerja, foto_url, face_descriptor, is_active, must_change_password, is_auto_registered, is_profile_completed
          `;
          currentUser = updated[0];

          if (emailChanged) {
            await sql`
              INSERT INTO audit_log (user_id, action, status, alasan)
              VALUES (${decoded.id}, 'Ubah Email Akun', 'SUCCESS', ${'Email diubah dari ' + oldEmail + ' menjadi ' + cleanEmail})
            `;
          }
        } else {
          currentUser.nama = nama.trim();
          currentUser.email = cleanEmail;
          if (no_hp !== undefined) currentUser.no_hp = no_hp;
          if (foto_url) currentUser.foto_url = foto_url;

          if (emailChanged) {
            inMemoryDB.audit_log.unshift({
              id: inMemoryDB.audit_log.length + 1,
              user_id: decoded.id,
              user_nama: currentUser.nama,
              action: 'Ubah Email Akun',
              status: 'SUCCESS',
              alasan: `Email diubah dari ${oldEmail} menjadi ${cleanEmail}`,
              created_at: new Date().toISOString(),
            });
          }
        }

        const { password_hash, ...safeUser } = currentUser;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Profil berhasil diperbarui.',
            user: safeUser,
          }),
        };
      }

      // ── STANDARD LOGIN & AUTO-DAFTAR ──
      const clientIp = (event.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                       event.headers['client-ip'] ||
                       event.headers['x-real-ip'] ||
                       '127.0.0.1';

      const rateCheck = checkRateLimit(clientIp);
      if (!rateCheck.allowed) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Terlalu banyak percobaan masuk/daftar. Silakan tunggu 15 menit demi keamanan.' }),
        };
      }

      const { email, password, role_target } = body;
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email/NIP dan kata sandi wajib diisi.' }) };
      }

      const cleanIdentifier = email.trim().toLowerCase();
      const seedPass = process.env.SEED_PASSWORD || 'vokasi123';

      // 1. TAB MSDM (Hanya akun seed sdm@vokasi.ui.ac.id, tidak ada auto-daftar)
      if (role_target === 'sdm') {
        if (cleanIdentifier !== 'sdm@vokasi.ui.ac.id') {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
        }

        let sdmUser = null;
        if (isPostgres) {
          const rows = await sql`SELECT * FROM users WHERE LOWER(email) = ${cleanIdentifier} AND role = 'sdm'`;
          sdmUser = rows[0];
        } else {
          sdmUser = inMemoryDB.users.find(u => u.email.toLowerCase() === cleanIdentifier && u.role === 'sdm');
        }

        if (!sdmUser) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
        }

        if (!sdmUser.is_active) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Akun Anda telah dinonaktifkan oleh Administrator.' }) };
        }

        let isPassValid = false;
        if (sdmUser.must_change_password) {
          isPassValid = (password === seedPass) || (await comparePassword(password, sdmUser.password_hash));
        } else {
          isPassValid = await comparePassword(password, sdmUser.password_hash);
        }

        if (!isPassValid) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
        }

        const token = signToken({
          id: sdmUser.id,
          email: sdmUser.email,
          nip: sdmUser.nip,
          role: 'sdm',
          nama: sdmUser.nama,
        });

        const { password_hash, ...safeUser } = sdmUser;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            token,
            user: safeUser,
            must_change_password: !!sdmUser.must_change_password,
            is_profile_completed: true,
          }),
        };
      }

      // 2. TAB PEGAWAI (role_target === 'karyawan' atau tidak spesifik)
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

      // 2A. AKUN SUDAH TERDAFTAR
      if (user) {
        if (user.role === 'sdm') {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
        }

        if (!user.is_active) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Akun Anda telah dinonaktifkan oleh Admin MSDM.' }) };
        }

        let isPassValid = false;
        if (user.must_change_password) {
          isPassValid = (password === seedPass) || (await comparePassword(password, user.password_hash));
        } else {
          // Password sudah diganti -> vokasi123 TIDAK BERLAKU LAGI
          isPassValid = await comparePassword(password, user.password_hash);
        }

        if (!isPassValid) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
        }

        const token = signToken({
          id: user.id,
          email: user.email,
          nip: user.nip,
          role: 'karyawan',
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
            is_profile_completed: user.is_profile_completed !== false,
          }),
        };
      }

      // 2B. AKUN BELUM TERDAFTAR -> AUTO-DAFTAR JIKA PASSWORD === SEED_PASSWORD
      if (password !== seedPass) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Email atau kata sandi tidak valid.' }) };
      }

      // Format email harus valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanIdentifier)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Format email tidak valid.' }) };
      }

      const passwordHash = await hashPassword(seedPass);
      const tempNip = 'PEG-' + Math.floor(100000 + Math.random() * 900000);
      let newUser = null;

      if (isPostgres) {
        const inserted = await sql`
          INSERT INTO users (
            nip, nama, email, password_hash, role, jabatan, unit, lokasi_penempatan, jam_kerja,
            is_active, must_change_password, is_auto_registered, is_profile_completed
          ) VALUES (
            ${tempNip}, 'Pegawai Baru', ${cleanIdentifier}, ${passwordHash}, 'karyawan', 'Staf Medis', 'Instalasi Rawat Inap',
            'Fakultas Vokasi UI', '08.00 - 14.00 WIB', TRUE, TRUE, TRUE, FALSE
          )
          RETURNING id, nip, nama, email, role, jabatan, unit, lokasi_penempatan, jam_kerja, is_active, must_change_password, is_auto_registered, is_profile_completed, created_at
        `;
        newUser = inserted[0];

        await sql`
          INSERT INTO audit_log (user_id, action, status, alasan)
          VALUES (${newUser.id}, 'Pendaftaran Akun Otomatis', 'SUCCESS', ${'Akun pegawai otomatis didaftarkan untuk email ' + cleanIdentifier})
        `;
      } else {
        newUser = {
          id: inMemoryDB.users.length + 1,
          nip: tempNip,
          nama: 'Pegawai Baru',
          email: cleanIdentifier,
          password_hash: passwordHash,
          role: 'karyawan',
          jabatan: 'Staf Medis',
          unit: 'Instalasi Rawat Inap',
          lokasi_penempatan: 'Fakultas Vokasi UI',
          jam_kerja: '08.00 - 14.00 WIB',
          foto_url: '',
          face_descriptor: null,
          face_photo_ref: null,
          is_active: true,
          must_change_password: true,
          is_auto_registered: true,
          is_profile_completed: false,
          created_at: new Date().toISOString(),
        };
        inMemoryDB.users.push(newUser);

        inMemoryDB.audit_log.unshift({
          id: inMemoryDB.audit_log.length + 1,
          user_id: newUser.id,
          user_nama: newUser.nama,
          action: 'Pendaftaran Akun Otomatis',
          status: 'SUCCESS',
          alasan: `Akun pegawai otomatis didaftarkan untuk email ${cleanIdentifier}`,
          created_at: new Date().toISOString(),
        });
      }

      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        nip: newUser.nip,
        role: 'karyawan',
        nama: newUser.nama,
      });

      const { password_hash: _ph, ...safeNewUser } = newUser;
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token,
          user: safeNewUser,
          must_change_password: true,
          is_profile_completed: false,
          is_new_registration: true,
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
