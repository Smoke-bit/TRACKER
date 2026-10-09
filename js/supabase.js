
const SUPABASE_URL = "https://eubexczofprctbrktepx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1QldCbOyHdXMB9SjPTdZ8g_CaHk6aN7";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);