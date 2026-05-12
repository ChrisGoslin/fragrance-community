const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwysupjxhsuvzxgqvxdh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wYGaQcvLJA2bS2XDNr7-cg_ykfdpTu_';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
  try {
    // Count fragrances
    const { count, error } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error querying fragrances:', error);
      return;
    }
    
    console.log(`✅ Fragrance count: ${count}`);
    
    // Get sample fragrances
    const { data, error: dataError } = await supabase
      .from('fragrances')
      .select('brand, name, gender_profile')
      .limit(5);
    
    if (dataError) {
      console.error('Error fetching samples:', dataError);
      return;
    }
    
    console.log('\nSample fragrances:');
    data.forEach(f => {
      console.log(`  - ${f.brand} ${f.name} (${f.gender_profile})`);
    });
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verify();
