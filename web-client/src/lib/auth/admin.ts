// web-client/src/lib/auth/admin.ts
// Server-side guard for admin-only API routes. Verifies the JWT issued by
// POST /api/admin/login — call at the top of any route that should only be
// reachable by a logged-in admin.

import jwt from 'jsonwebtoken';

type AdminAuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export function requireAdmin(request: Request): AdminAuthResult {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false, status: 401, message: 'Missing admin token' };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[Local Borga] JWT_SECRET env var is missing.');
    return { ok: false, status: 500, message: 'Server misconfiguration' };
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { role?: string };
    if (payload.role !== 'admin') {
      return { ok: false, status: 403, message: 'Forbidden' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired admin token' };
  }
}
