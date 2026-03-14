// web-client/src/lib/shipping.ts
// Shipping rate calculator — no external API needed.
// Rates are structured as: base fee + per-item surcharge.
// All values in USD.
//
// Zones map exactly to the country <select> in checkout:
//   Ghana | United Kingdom | United States | Canada | Germany | Netherlands | Other

export interface ShippingRate {
  zone:        string;    // display label
  countries:   string[];  // must match the <select> option values exactly
  base:        number;    // base shipping fee in USD
  perItem:     number;    // additional cost per unique cart item
  eta:         string;    // estimated delivery time shown to customer
  emoji:       string;    // flag / icon for display
}

export interface ShippingQuote {
  country:     string;
  zone:        string;
  cost:        number;    // total shipping cost in USD
  eta:         string;
  emoji:       string;
  isFree:      boolean;
}

// ─── Rate table ───────────────────────────────────────────────────────────────
// Adjust these values freely — they are the single source of truth.

export const SHIPPING_RATES: ShippingRate[] = [
  {
    zone:      'Local Ghana',
    countries: ['Ghana'],
    base:      0,
    perItem:   0,
    eta:       '1–3 business days',
    emoji:     '🇬🇭',
  },
  {
    zone:      'United Kingdom',
    countries: ['United Kingdom'],
    base:      12.99,
    perItem:   1.50,
    eta:       '7–14 business days',
    emoji:     '🇬🇧',
  },
  {
    zone:      'United States',
    countries: ['United States'],
    base:      15.99,
    perItem:   2.00,
    eta:       '10–18 business days',
    emoji:     '🇺🇸',
  },
  {
    zone:      'Canada',
    countries: ['Canada'],
    base:      14.99,
    perItem:   2.00,
    eta:       '10–18 business days',
    emoji:     '🇨🇦',
  },
  {
    zone:      'Germany',
    countries: ['Germany'],
    base:      13.99,
    perItem:   1.50,
    eta:       '7–14 business days',
    emoji:     '🇩🇪',
  },
  {
    zone:      'Netherlands',
    countries: ['Netherlands'],
    base:      13.99,
    perItem:   1.50,
    eta:       '7–14 business days',
    emoji:     '🇳🇱',
  },
  {
    zone:      'International',
    countries: ['Other'],
    base:      19.99,
    perItem:   3.00,
    eta:       '14–28 business days',
    emoji:     '🌍',
  },
];

// ─── Calculator ───────────────────────────────────────────────────────────────

export function calculateShipping(country: string, itemCount: number): ShippingQuote {
  const rate = SHIPPING_RATES.find(r => r.countries.includes(country))
    ?? SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback → International

  const cost = rate.base + rate.perItem * itemCount;

  return {
    country,
    zone:   rate.zone,
    cost:   parseFloat(cost.toFixed(2)),
    eta:    rate.eta,
    emoji:  rate.emoji,
    isFree: cost === 0,
  };
}