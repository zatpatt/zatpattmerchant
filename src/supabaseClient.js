import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rkvvasabmogmkfnzheot.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdnZhc2FibW9nbWtmbnpoZW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzY1NDQsImV4cCI6MjA3OTY1MjU0NH0.oBbTf1Vu_YA0HocUlV_sCtm3YHXpTxKtryRq2KLb1zE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
