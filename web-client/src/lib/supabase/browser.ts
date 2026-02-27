import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient(url, anon);

// Client-side only. Uses ANON key — safe to expose to the browser.
// Singleton pattern: one shared instance for the whole app.