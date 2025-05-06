import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://famimvrmecojfybznmdm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbWltdnJtZWNvamZ5YnpubWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1Njc5NzEsImV4cCI6MjA2MjE0Mzk3MX0.ZtiQVx1LOWRJkTqxL0Edi_baIW_hkDRbZ6KQEKbELck'
);