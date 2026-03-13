// web-client/app/api/orders/[id]/route.ts
// GET   /api/orders/[id]  → single order (customer tracking)
// PATCH /api/orders/[id]  → update status (admin) + send status notification

import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';
import { notify, messages } from '@/src/lib/notify';

const toMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unexpected error occurred';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Normalise field names for the client-side tracking component
    return NextResponse.json({
      id:           data.id,
      itemName:     data.item_name,
      status:       data.status,
      weightKg:     data.weight_kg,
      millingStyle: data.milling_style,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id }   = await params;
    const body     = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // ── 1. Update status ─────────────────────────────────────────────────────
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('id, item_name, status, customer_phone, customer_name')
      .single();

    if (error) throw error;

    // ── 2. Notify customer of status change ──────────────────────────────────
    if (order.customer_phone) {
      const tpl = messages.statusUpdated(order.id, order.item_name, status);
      // Fire and forget
      notify({
        to:        order.customer_phone,
        sms:       tpl.sms,
        whatsapp:  tpl.whatsapp,
      }).catch(err => console.error('[notify] Status update notification failed:', err));
    }

    return NextResponse.json({ order });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}