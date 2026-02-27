import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret     = process.env.JWT_SECRET;

    if (!adminPassword || !jwtSecret) {
      console.error('[Local Borga] ADMIN_PASSWORD or JWT_SECRET env var is missing.');
      return NextResponse.json(
        { success: false, message: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized Access' },
        { status: 401 }
      );
    }

    const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '8h' });
    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}