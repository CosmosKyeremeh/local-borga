import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: 'Order Not Found' }, { status: 404 });
    }

    // Return camelCase so the tracking UI in page.tsx works without changes
    return NextResponse.json({
      id:           data.id,
      itemName:     data.item_name,
      millingStyle: data.milling_style,
      weightKg:     data.weight_kg,
      totalPrice:   data.total_price,
      status:       data.status,
      createdAt:    data.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Supabase Realtime automatically broadcasts this row update to all
    // subscribed clients — no io.emit() or pusher.trigger() needed.
    return NextResponse.json({
      message: 'Status updated',
      order: {
        id:       data.id,
        itemName: data.item_name,
        status:   data.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}