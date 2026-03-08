// web-client/app/api/orders/route.ts

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Custom milling fields
      itemName, millingStyle, weightKg,
      // Shared
      totalPrice,
      // Customer info (guest or auth)
      customerName, customerEmail, customerPhone, shippingAddress,
      userId,
      // Cart order fields
      orderType = 'custom_milling',
      cartItems,
    } = body;

    if (!totalPrice) {
      return NextResponse.json({ error: 'totalPrice is required' }, { status: 400 });
    }

    // For shelf cart orders, use a summary name
    const resolvedItemName = itemName ?? (cartItems?.length > 0 ? `Cart Order (${cartItems.length} item${cartItems.length > 1 ? 's' : ''})` : 'Order');

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        item_name:        resolvedItemName,
        milling_style:    millingStyle    ?? null,
        weight_kg:        weightKg        ?? null,
        total_price:      totalPrice,
        status:           'pending',
        customer_name:    customerName    ?? null,
        customer_email:   customerEmail   ?? null,
        customer_phone:   customerPhone   ?? null,
        shipping_address: shippingAddress ?? null,
        user_id:          userId          ?? null,
        order_type:       orderType,
        cart_items:       cartItems       ?? null,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Order created', order: data },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}