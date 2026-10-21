import { createClient } from "@supabase/supabase-js";

// Used by the /admin page to sign in. The public key comes from VITE_SUPABASE_KEY when the site is built;
// without it the admin page shows a setup notice instead of crashing.
export const supabaseConfigured = !!import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(
    "https://awqealatvcaezaddnten.supabase.co",
    import.meta.env.VITE_SUPABASE_KEY || "not-configured"
);
