import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemName, millingStyle, weightKg, totalPrice } = body;

    if (!itemName || !totalPrice) {
      return NextResponse.json(
        { error: 'itemName and totalPrice are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        item_name:     itemName,
        milling_style: millingStyle ?? null,
        weight_kg:     weightKg ?? null,
        total_price:   totalPrice,
        status:        'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Order created', order: data },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}