// web-client/app/api/products/[id]/route.ts
// GET    /api/products/[id]  → single product
// PATCH  /api/products/[id]  → update product (admin)
// DELETE /api/products/[id]  → delete product (admin)

import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

const toMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unexpected error occurred';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}