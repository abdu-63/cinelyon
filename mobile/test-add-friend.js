require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('friend_follows').upsert({
    follower_id: 'non-existent-user-123',
    followed_id: 'some-other-id',
    nickname: 'test',
    created_at: new Date().toISOString(),
  });
  console.log('Error:', error);
}
test();
