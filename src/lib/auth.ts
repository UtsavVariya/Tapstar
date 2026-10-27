import * as jose from 'jose';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-me'
);

// ─── Admin Auth ───────────────────────────────────────────────

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  return username === adminUser && password === adminPass;
}

export async function createAdminToken(): Promise<string> {
  return new jose.SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

// ─── Shopkeeper Auth ──────────────────────────────────────────

export async function verifyShopkeeperCredentials(
  inputUsername: string,
  inputPassword: string,
  storedUsername: string,
  storedPasswordHash: string
): Promise<boolean> {
  if (inputUsername !== storedUsername) return false;
  return bcrypt.compare(inputPassword, storedPasswordHash);
}

export async function createShopkeeperToken(cardCode: string): Promise<string> {
  return new jose.SignJWT({ role: 'shopkeeper', cardCode })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

export async function verifyShopkeeperToken(token: string): Promise<{ cardCode: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    if (payload.role === 'shopkeeper' && typeof payload.cardCode === 'string') {
      return { cardCode: payload.cardCode };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Password Hashing ────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
