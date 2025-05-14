import { createClient } from "@supabase/supabase-js";

export const supabase_widgie = createClient(
    "https://xjmbjuqypyphckrgpeib.supabase.co",
    import.meta.env.VITE_SUPABASE_WIDGIE_KEY
);
