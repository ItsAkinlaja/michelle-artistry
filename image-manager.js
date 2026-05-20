/**
 * Image Manager - Fast Upload & Delete with Auto Cleanup
 * Manages portfolio images with automatic storage & database synchronization
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const CONFIG = require('./config.js');

// Initialize Supabase clients
const getSupabaseClient = (useServiceRole = false) => {
    const key = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_SERVICE_ROLE_KEY : CONFIG.SUPABASE_ANON_KEY;
    return createClient(CONFIG.SUPABASE_URL, key);
};

const CATEGORIES = {
    'Comics': 'Comics & Storyboards',
    'Character design': 'Character Design',
    'portrait': 'Portrait Illustration',
    'book cover': 'Book Covers',
    'manga': 'Manga Art',
    'fan art': 'Fan Art',
    'Children book illustration': 'Children\'s Books',
    'NSFW': 'NSFW Artwork',
    'Logos': 'Logos & Branding'
};

// Content type mapping
const getContentType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'svg': 'image/svg+xml'
    };
    return types[ext] || 'application/octet-stream';
};

// Sanitize filename for storage
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
};

// Generate unique filename to prevent conflicts
const generateUniqueFilename = (originalFilename) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const name = path.parse(originalFilename).name;
    const ext = path.extname(originalFilename);
    return `${sanitizeFilename(name)}_${timestamp}_${random}${ext}`;
};

/**
 * Upload image to Supabase Storage and database
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} filename - Original filename
 * @param {string} category - Portfolio category (e.g., 'Comics', 'portrait')
 * @param {string} title - Display title for image
 * @returns {Promise<Object>} Upload result with image metadata
 */
async function uploadImage(fileBuffer, filename, category, title = null) {
    const supabase = getSupabaseClient(true);
    
    if (!CATEGORIES[category]) {
        throw new Error(`Invalid category: ${category}. Valid categories: ${Object.keys(CATEGORIES).join(', ')}`);
    }
    
    const displayTitle = title || path.parse(filename).name.replace(/[-_]/g, ' ');
    const categoryDisplay = CATEGORIES[category];
    const uniqueFilename = generateUniqueFilename(filename);
    const storagePath = `${category}/${uniqueFilename}`;
    const contentType = getContentType(filename);
    
    console.log(`\n📤 Uploading: ${displayTitle}`);
    console.log(`   Storage: artworks/${storagePath}`);
    console.log(`   Category: ${categoryDisplay}`);
    
    try {
        // Step 1: Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
            .from('artworks')
            .upload(storagePath, fileBuffer, {
                contentType: contentType,
                cacheControl: '3600',
                upsert: false
            });
        
        if (storageError) {
            throw new Error(`Storage upload failed: ${storageError.message}`);
        }
        
        // Step 2: Insert record in database
        const { data: dbData, error: dbError } = await supabase
            .from('artworks')
            .insert([
                {
                    title: displayTitle,
                    category: categoryDisplay,
                    image_path: storagePath,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (dbError) {
            // Rollback: Delete from storage if DB insert fails
            await supabase.storage.from('artworks').remove([storagePath]);
            throw new Error(`Database insert failed: ${dbError.message}`);
        }
        
        console.log(`✅ Upload successful! Image ID: ${dbData[0]?.id || 'unknown'}`);
        return {
            success: true,
            id: dbData[0]?.id,
            title: displayTitle,
            path: storagePath,
            category: categoryDisplay
        };
        
    } catch (error) {
        console.error(`❌ Upload failed: ${error.message}`);
        throw error;
    }
}

/**
 * Delete image from storage and database
 * @param {string} imageId - Database record ID
 * @param {string} storagePath - Path in storage (e.g., "Comics/image.jpg")
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImage(imageId, storagePath) {
    const supabase = getSupabaseClient(true);
    
    console.log(`\n🗑️  Deleting image ID: ${imageId}`);
    console.log(`   Storage path: ${storagePath}`);
    
    try {
        // Step 1: Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('artworks')
            .remove([storagePath]);
        
        if (storageError) {
            throw new Error(`Storage deletion failed: ${storageError.message}`);
        }
        
        // Step 2: Delete database record
        const { error: dbError } = await supabase
            .from('artworks')
            .delete()
            .eq('id', imageId);
        
        if (dbError) {
            throw new Error(`Database deletion failed: ${dbError.message}`);
        }
        
        console.log(`✅ Deletion successful! Freed storage and database space.`);
        return {
            success: true,
            imageId: imageId,
            path: storagePath
        };
        
    } catch (error) {
        console.error(`❌ Deletion failed: ${error.message}`);
        throw error;
    }
}

/**
 * Get all images for a category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of images
 */
async function getImagesByCategory(category) {
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const categoryDisplay = CATEGORIES[category] || category;
    
    const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('category', categoryDisplay)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

/**
 * Get all images
 * @returns {Promise<Array>} Array of all images
 */
async function getAllImages() {
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

/**
 * Upload image from local file path
 * @param {string} filePath - Full file path
 * @param {string} category - Portfolio category
 * @param {string} title - Display title
 * @returns {Promise<Object>} Upload result
 */
async function uploadFromFile(filePath, category, title = null) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    return uploadImage(fileBuffer, filename, category, title);
}

/**
 * Batch upload images from a folder
 * @param {string} folderPath - Full folder path
 * @param {string} category - Portfolio category
 * @returns {Promise<Object>} Batch upload result
 */
async function batchUploadFromFolder(folderPath, category) {
    if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
    }
    
    const files = fs.readdirSync(folderPath).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    if (files.length === 0) {
        console.log(`No images found in ${folderPath}`);
        return { success: false, uploaded: 0, failed: 0, errors: [] };
    }
    
    console.log(`\n📁 Batch Upload: ${folderPath}`);
    console.log(`   Found ${files.length} images\n`);
    
    const results = {
        success: true,
        category: category,
        uploaded: 0,
        failed: 0,
        errors: [],
        images: []
    };
    
    for (const file of files) {
        try {
            const filePath = path.join(folderPath, file);
            const result = await uploadFromFile(filePath, category);
            results.uploaded++;
            results.images.push(result);
        } catch (error) {
            results.failed++;
            results.errors.push({ file, error: error.message });
            console.error(`   ❌ Failed: ${file} - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Batch Upload Summary:`);
    console.log(`   ✅ Uploaded: ${results.uploaded}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    
    return results;
}

module.exports = {
    uploadImage,
    uploadFromFile,
    batchUploadFromFolder,
    deleteImage,
    getImagesByCategory,
    getAllImages,
    CATEGORIES,
    getContentType
};
