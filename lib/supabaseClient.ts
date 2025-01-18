import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qyxjpccyqysndrynjhfx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eGpwY2N5cXlzbmRyeW5qaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5ODI5NjksImV4cCI6MjA1MjU1ODk2OX0.L8S0zpQuV-AwPy41b98WR6pDreA3azBhoi4-arzg69A";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
