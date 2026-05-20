/**
 * Michelle Artistry - Portfolio Asset Migration Script
 * 
 * This script scans your local folders, uploads all existing portfolio images 
 * to your Supabase Storage bucket, and inserts metadata records into the database.
 * 
 * Instructions:
 * 1. Install required dependency:
 *    npm install @supabase/supabase-js
 * 
 * 2. Ensure your credentials in config.js are filled out.
 * 
 * 3. IMPORTANT: For local terminal uploads to bypass Row Level Security (RLS) policies,
 *    replace the Anon Key with your Supabase "Service Role Key" (secret key starting with eyJ...) 
 *    in the command line, OR disable RLS temporarily while migrating.
 * 
 * 4. Run the script:
 *    node migrate_artworks.js "YOUR_SERVICE_ROLE_KEY"
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const CONFIG = require('./config.js');

// Get service role key from command arguments
const serviceRoleKey = process.argv[2] || CONFIG.SUPABASE_ANON_KEY;

if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('your-project-id')) {
    console.error('Error: Please configure your actual SUPABASE_URL in config.js first.');
    process.exit(1);
}

console.log('Initializing Supabase Admin Client...');
const supabase = createClient(CONFIG.SUPABASE_URL, serviceRoleKey);

const folders = [
    { dir: 'Comics', category: 'Comics & Storyboards' },
    { dir: 'Character design', category: 'Character Design' },
    { dir: 'portrait', category: 'Portrait Illustration' },
    { dir: 'book cover', category: 'Book Covers' },
    { dir: 'manga', category: 'Manga Art' },
    { dir: 'fan art', category: 'Fan Art' },
    { dir: 'Children book illustration', category: 'Children\'s Books' },
    { dir: 'NSFW', category: 'NSFW Artwork' },
    { dir: 'Logos', category: 'Logos & Branding' }
];

const getContentType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'webp': return 'image/webp';
        case 'gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
};

const sanitizeTitle = (filename) => {
    const basename = path.parse(filename).name;
    // Replace dashes and underscores with spaces, capitalize first letters
    return basename
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

async function startMigration() {
    console.log('\n=========================================');
    console.log('Starting Portfolio Asset Migration');
    console.log('=========================================\n');
    
    let totalUploaded = 0;
    
    for (const folder of folders) {
        const fullDirPath = path.join(__dirname, folder.dir);
        
        if (!fs.existsSync(fullDirPath)) {
            console.log(`[Skipping] Folder does not exist: ${folder.dir}`);
            continue;
        }
        
        console.log(`[Scanning] Scanning folder: ${folder.dir}...`);
        
        const files = fs.readdirSync(fullDirPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });
        
        if (files.length === 0) {
            console.log(` -> No images found in ${folder.dir}`);
            continue;
        }
        
        console.log(` -> Found ${files.length} images to migrate.`);
        
        for (const file of files) {
            const filePath = path.join(fullDirPath, file);
            const fileBuffer = fs.readFileSync(filePath);
            const contentType = getContentType(file);
            const title = sanitizeTitle(file);
            
            // Format destination storage path
            const uniqueFileName = `${path.parse(file).name}-${Date.now()}${path.extname(file)}`;
            const storagePath = `${folder.dir}/${uniqueFileName}`;
            
            console.log(`    Uploading: ${file} -> artworks/${storagePath}...`);
            
            try {
                // 1. Upload to Supabase Storage
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('artworks')
                    .upload(storagePath, fileBuffer, {
                        contentType: contentType,
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (storageError) {
                    console.error(`      Failed Storage Upload for ${file}:`, storageError.message);
                    continue;
                }
                
                // 2. Insert DB Record
                const { data: dbData, error: dbError } = await supabase
                    .from('artworks')
                    .insert([
                        {
                            title: title,
                            category: folder.category,
                            image_path: storagePath
                        }
                    ]);
                
                if (dbError) {
                    console.error(`      Failed Database Sync for ${file}:`, dbError.message);
                    // Attempt cleanup of storage file to keep it clean
                    await supabase.storage.from('artworks').remove([storagePath]);
                    continue;
                }
                
                console.log(`      Success: "${title}" is synchronized.`);
                totalUploaded++;
                
            } catch (err) {
                console.error(`      Exception processing ${file}:`, err.message);
            }
        }
    }
    
    console.log('\n=========================================');
    console.log(`Migration Complete. Total Uploaded: ${totalUploaded} artworks.`);
    console.log('=========================================\n');
}

startMigration();
