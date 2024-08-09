const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();

const supabase = createClient("https://xjmbjuqypyphckrgpeib.supabase.co", process.env.SUPABASE_KEY);

module.exports = { supabase };
