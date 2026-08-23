import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxatofdeazpmhixewspi.supabase.co';
const supabaseAnonKey = 'sb_publishable_1kILJ00E2hnnd1WXGEfMxQ_EiC1qcIw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `http://localhost:3000/auth/callback`,
    },
  });
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
