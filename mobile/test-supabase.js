require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('favorites').upsert({ user_id: 'test-sync-123', films: ['test'] }, { onConflict: 'user_id' });
  console.log('Error:', error);
}
test();
