// web-client/app/api/orders/route.ts
// GET  /api/orders  → all orders (admin)
// POST /api/orders  → create order + deduct stock + send notifications

import { NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';
import { notify, messages } from '@/src/lib/notify';

const toMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unexpected error occurred';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemName, millingStyle, weightKg, totalPrice,
      orderType, cartItems, customerName, customerEmail,
      customerPhone, shippingAddress, userId, paystackReference,
    } = body;

    if (!itemName || !totalPrice) {
      return NextResponse.json(
        { error: 'itemName and totalPrice are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // ── 1. Insert the order ──────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        item_name:          itemName,
        milling_style:      millingStyle      ?? null,
        weight_kg:          weightKg          ?? null,
        total_price:        totalPrice,
        status:             'pending',
        order_type:         orderType         ?? 'shelf',
        cart_items:         cartItems         ?? null,
        customer_name:      customerName      ?? null,
        customer_email:     customerEmail     ?? null,
        customer_phone:     customerPhone     ?? null,
        shipping_address:   shippingAddress   ?? null,
        user_id:            userId            ?? null,
        paystack_reference: paystackReference ?? null,
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // ── 2. Deduct stock ──────────────────────────────────────────────────────
    const stockItems = (cartItems ?? []).filter(
      (i: { id: string; quantity: number }) => i.id !== order.id?.toString()
    );

    if (stockItems.length > 0) {
      const { error: stockError } = await supabase.rpc('deduct_stock', {
        items: stockItems.map((i: { id: string; quantity: number }) => ({
          id:       i.id,
          quantity: i.quantity,
        })),
      });

      if (stockError) {
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json({ error: stockError.message }, { status: 409 });
      }
    }

    // ── 3. Send notifications (non-blocking — don't fail the order if this errors) ──
    const phone   = customerPhone as string | null;
    const name    = customerName  as string ?? 'Customer';
    const country = (shippingAddress as { country?: string })?.country ?? 'Ghana';

    const notifyPromises: Promise<unknown>[] = [];

    // Customer SMS + WhatsApp (only if they provided a phone number)
    if (phone) {
      const tpl = messages.orderPlaced(order.id, itemName, totalPrice);
      notifyPromises.push(
        notify({ to: phone, sms: tpl.sms, whatsapp: tpl.whatsapp })
      );
    }

    // Admin SMS alert (always fires if ADMIN_PHONE_NUMBER is set)
    if (process.env.ADMIN_PHONE_NUMBER) {
      const tpl = messages.adminAlert(order.id, itemName, totalPrice, name, country);
      notifyPromises.push(
        notify({ to: process.env.ADMIN_PHONE_NUMBER, sms: tpl.sms })
      );
    }

    // Fire and forget — await in parallel, don't block the response
    await Promise.allSettled(notifyPromises);

    return NextResponse.json({ order }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: toMessage(err) }, { status: 500 });
  }
}