#!/usr/bin/env node

/**
 * Quick Image Upload CLI
 * Fast batch upload images from local folders
 * 
 * Usage:
 *   node upload-images.js              # Interactive mode
 *   node upload-images.js Comics       # Upload specific category folder
 */

const imageManager = require('./image-manager.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
});

async function main() {
    console.log('\n🚀 Portfolio Image Upload Tool\n');

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Interactive mode
        await interactiveMode();
    } else if (args[0] === '--help') {
        showHelp();
    } else {
        // Specific category
        const category = args[0];
        if (!imageManager.CATEGORIES[category]) {
            console.error(`❌ Unknown category: ${category}`);
            console.log('\nAvailable categories:');
            Object.keys(imageManager.CATEGORIES).forEach(cat => {
                console.log(`  - ${cat}`);
            });
            process.exit(1);
        }
        
        const folderPath = path.join(__dirname, category);
        if (fs.existsSync(folderPath)) {
            await uploadFolder(folderPath, category);
        } else {
            console.error(`❌ Folder not found: ${folderPath}`);
            process.exit(1);
        }
    }
    
    rl.close();
}

async function interactiveMode() {
    console.log('📁 Available Categories:\n');
    
    const categories = Object.keys(imageManager.CATEGORIES);
    categories.forEach((cat, i) => {
        const folderPath = path.join(__dirname, cat);
        const exists = fs.existsSync(folderPath);
        const files = exists ? fs.readdirSync(folderPath).filter(f => 
            /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
        ).length : 0;
        
        console.log(`${i + 1}. ${cat} (${exists ? files + ' images' : 'folder not found'})`);
    });
    
    const choice = await question('\nEnter category number (or "all" to upload all, "exit" to quit): ');
    
    if (choice.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        return;
    }
    
    if (choice.toLowerCase() === 'all') {
        await uploadAllCategories();
    } else {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < categories.length) {
            const category = categories[index];
            const folderPath = path.join(__dirname, category);
            
            if (fs.existsSync(folderPath)) {
                await uploadFolder(folderPath, category);
            } else {
                console.log(`\n❌ Folder not found: ${folderPath}`);
            }
        } else {
            console.log('\n❌ Invalid selection');
        }
    }
}

async function uploadFolder(folderPath, category) {
    console.log(`\n✨ Starting upload for category: ${category}`);
    console.log(`📍 Folder: ${folderPath}\n`);
    
    try {
        const result = await imageManager.batchUploadFromFolder(folderPath, category);
        
        console.log(`\n✅ Complete!`);
        console.log(`   Uploaded: ${result.uploaded}`);
        console.log(`   Failed: ${result.failed}`);
        
        if (result.errors.length > 0) {
            console.log('\n❌ Errors:');
            result.errors.forEach(err => {
                console.log(`   - ${err.file}: ${err.error}`);
            });
        }
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

async function uploadAllCategories() {
    console.log('\n📦 Uploading all categories...\n');
    
    const categories = Object.keys(imageManager.CATEGORIES);
    let totalUploaded = 0;
    let totalFailed = 0;
    
    for (const category of categories) {
        const folderPath = path.join(__dirname, category);
        
        if (!fs.existsSync(folderPath)) {
            console.log(`⏭️  Skipping ${category} (folder not found)`);
            continue;
        }
        
        console.log(`\n📂 Processing: ${category}`);
        
        try {
            const result = await imageManager.batchUploadFromFolder(folderPath, category);
            totalUploaded += result.uploaded;
            totalFailed += result.failed;
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    console.log(`\n\n📊 All Categories Summary:`);
    console.log(`   ✅ Total Uploaded: ${totalUploaded}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
}

function showHelp() {
    console.log(`
Usage: node upload-images.js [options]

Options:
  <category>    Upload specific category (e.g., Comics, portrait)
  all           Upload all categories
  --help        Show this help message

Examples:
  node upload-images.js              # Interactive mode
  node upload-images.js Comics       # Upload Comics folder
  node upload-images.js portrait     # Upload portrait folder
  node upload-images.js --help       # Show help

Available categories:
  ${Object.keys(imageManager.CATEGORIES).join(', ')}
    `);
}

main().catch(console.error);
