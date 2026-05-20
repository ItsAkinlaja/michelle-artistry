const { createClient } = require('@supabase/supabase-js');
const CONFIG = require('./config.js');

async function main() {
  const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  console.log('Fetching latest artworks from DB...');
  const { data, error } = await supabase.from('artworks').select('id,title,category,image_path,created_at').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.error('Error fetching artworks:', error.message || error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No artworks found in DB.');
    return;
  }

  for (const item of data) {
    const path = item.image_path;
    console.log(`\n- ID: ${item.id} | ${item.title} | path: ${path} | created: ${item.created_at}`);

    // Check storage object existence by listing the parent folder
    const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
    try {
      const listResult = await supabase.storage.from('artworks').list(folder || '', { limit: 1000 });
      if (listResult.error) {
        console.log('  Storage list error:', listResult.error.message || listResult.error);
      } else {
        const found = (listResult.data || []).some(o => o.name === (path.includes('/') ? path.substring(path.lastIndexOf('/')+1) : path));
        console.log('  Storage object exists:', found ? 'YES' : 'NO');
      }
    } catch (e) {
      console.log('  Storage check failed:', e.message || e);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
