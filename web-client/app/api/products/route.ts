// web-client/app/api/products/route.ts
// GET  /api/products              → all staples (section=staples by default)
// GET  /api/products?section=farm_tools → farm tools only
// GET  /api/products?section=all  → everything
// POST /api/products              → create a product

import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

const toMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unexpected error occurred';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section'); // 'staples' | 'farm_tools' | 'all' | null

    const supabase = createServerClient();

    let query = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (!section || section === 'staples') {
      // Default — food catalog only
      query = query.eq('section', 'staples');
    } else if (section !== 'all') {
      // Specific section e.g. 'farm_tools'
      query = query.eq('section', section);
    }
    // section === 'all' → no filter, returns everything

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, category, description, image, is_premium, section } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'name, price, and category are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name,
        price,
        category,
        description,
        image,
        is_premium: is_premium ?? false,
        section:    section ?? 'staples',
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}