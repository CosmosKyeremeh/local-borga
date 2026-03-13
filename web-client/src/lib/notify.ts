// web-client/src/lib/notify.ts
// Reusable notification utility — sends SMS and/or WhatsApp via Twilio.
// Server-side only. Never import this in client components.

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifyOptions {
  to:         string;       // E.164 format: +233XXXXXXXXX
  sms?:       string;       // SMS message body (160 char limit for 1 segment)
  whatsapp?:  string;       // WhatsApp message body (can be longer)
}

interface NotifyResult {
  sms?:      { sid: string } | { error: string };
  whatsapp?: { sid: string } | { error: string };
}

// ─── Core send function ───────────────────────────────────────────────────────

async function twilioSend(to: string, from: string, body: string): Promise<{ sid: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method:  'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Twilio send failed');
  return { sid: data.sid };
}

// ─── Public notify function ───────────────────────────────────────────────────

export async function notify({ to, sms, whatsapp }: NotifyOptions): Promise<NotifyResult> {
  // Silently skip if Twilio is not configured — avoids breaking the app
  // in environments where keys haven't been set yet
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[notify] Twilio env vars not set — skipping notification');
    return {};
  }

  const result: NotifyResult = {};

  // ── SMS ──────────────────────────────────────────────────────────────────
  if (sms && process.env.TWILIO_PHONE_NUMBER) {
    try {
      result.sms = await twilioSend(to, process.env.TWILIO_PHONE_NUMBER, sms);
    } catch (err) {
      console.error('[notify] SMS failed:', err);
      result.sms = { error: err instanceof Error ? err.message : 'SMS failed' };
    }
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  if (whatsapp && process.env.TWILIO_WHATSAPP_NUMBER) {
    try {
      const waTo   = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const waFrom = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
      result.whatsapp = await twilioSend(waTo, waFrom, whatsapp);
    } catch (err) {
      console.error('[notify] WhatsApp failed:', err);
      result.whatsapp = { error: err instanceof Error ? err.message : 'WhatsApp failed' };
    }
  }

  return result;
}

// ─── Pre-built message templates ─────────────────────────────────────────────

export const messages = {

  orderPlaced: (orderId: number, itemName: string, total: number) => ({
    sms: `Local Borga ✅ Order #${orderId} confirmed! Item: ${itemName}. Total: $${total.toFixed(2)}. Track at: local-borga.vercel.app`,
    whatsapp: [
      `🇬🇭 *Local Borga — Order Confirmed!*`,
      ``,
      `Hi! Your order has been placed successfully.`,
      ``,
      `📦 *Order ID:* #${orderId}`,
      `🛒 *Item:* ${itemName}`,
      `💵 *Total:* $${total.toFixed(2)}`,
      ``,
      `Track your order anytime at:`,
      `👉 local-borga.vercel.app`,
      ``,
      `Thank you for choosing Local Borga! 🌍`,
    ].join('\n'),
  }),

  statusUpdated: (orderId: number, itemName: string, status: string) => {
    const emoji: Record<string, string> = {
      pending:    '⏳',
      milling:    '⚙️',
      processing: '⚙️',
      completed:  '✅',
      shipped:    '🚚',
      delivered:  '🎉',
    };
    const icon = emoji[status.toLowerCase()] ?? '📦';
    return {
      sms: `Local Borga ${icon} Order #${orderId} (${itemName}) is now ${status.toUpperCase()}. Track: local-borga.vercel.app`,
      whatsapp: [
        `🇬🇭 *Local Borga — Order Update*`,
        ``,
        `${icon} Your order status has changed!`,
        ``,
        `📦 *Order ID:* #${orderId}`,
        `🛒 *Item:* ${itemName}`,
        `🔄 *New Status:* ${status.toUpperCase()}`,
        ``,
        `Track your order at:`,
        `👉 local-borga.vercel.app`,
      ].join('\n'),
    };
  },

  adminAlert: (orderId: number, itemName: string, total: number, customerName: string, country: string) => ({
    sms: `[LB Admin] New order #${orderId} from ${customerName} (${country}): ${itemName} — $${total.toFixed(2)}. Check dashboard.`,
  }),
};