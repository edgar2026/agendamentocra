import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqiborukkuvvlypxgcac.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWJvcnVra3V2dmx5cHhnY2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzAxNDgsImV4cCI6MjA3NTUwNjE0OH0.eB-4aOkKfy5gcjBKeo3lr6b3f45IzTOBav1886kJl4E";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);