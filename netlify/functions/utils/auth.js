import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'medifaces_super_secure_jwt_secret_key_v1';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(reqOrHeader) {
  let token = '';
  if (typeof reqOrHeader === 'string') {
    token = reqOrHeader.replace('Bearer ', '').trim();
  } else if (reqOrHeader?.headers) {
    const authHeader = reqOrHeader.headers.authorization || reqOrHeader.headers.Authorization || '';
    token = authHeader.replace('Bearer ', '').trim();
  }

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}
