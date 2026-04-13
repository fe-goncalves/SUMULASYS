import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://felxkqyxrtygrkfyywhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbHhrcXl4cnR5Z3JrZnl5d2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODg1MjcsImV4cCI6MjA5MTQ2NDUyN30.eXnib48cUYi2D1AVz26SZG-8mrPLf4eBSlh2IO5VnO8';

export const supabase = createClient(supabaseUrl, supabaseKey);
