#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const CONFIG = require('./config.js');

const CATEGORY_MAP = {
  'Comics': 'Comics & Storyboards',
  'Character design': 'Character Design',
  'portrait': 'Portrait Illustration',
  'book cover': 'Book Covers',
  'manga': 'Manga Art',
  'fan art': 'Fan Art',
  'Children book illustration': "Children's Books",
  'NSFW': 'NSFW Artwork',
  'Logos': 'Logos & Branding',
  'images': 'images',
};

const normalize = (value) => (value || '')
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const canonicalCategory = (value) => CATEGORY_MAP[value] || value || '';

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?<key>[A-Z0-9_]+)=(?<value>.*)$/);
    if (!match || !match.groups) continue;
    let value = match.groups.value.trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!process.env[match.groups.key]) {
      process.env[match.groups.key] = value;
    }
  }
}

function loadLocalManifest() {
  const manifestPath = path.join(__dirname, 'public_images.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing local manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return Array.isArray(manifest) ? manifest : [];
}

async function fetchDatabaseRows() {
  loadDotEnv();
  const supabase = createClient(CONFIG.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('artworks').select('id,title,category,image_path,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function main() {
  const mode = process.argv.includes('--delete-orphans') ? 'delete-orphans' : 'dry-run';
  const local = loadLocalManifest();
  const dbRows = await fetchDatabaseRows();

  const localKeys = new Set(local.map((item) => `${normalize(canonicalCategory(item.category))}||${normalize(item.title)}`));
  const dbKeys = new Set(dbRows.map((row) => `${normalize(row.category)}||${normalize(row.title)}`));

  const matched = dbRows.filter((row) => localKeys.has(`${normalize(row.category)}||${normalize(row.title)}`));
  const orphans = dbRows.filter((row) => !localKeys.has(`${normalize(row.category)}||${normalize(row.title)}`));
  const localOnly = local.filter((item) => !dbKeys.has(`${normalize(canonicalCategory(item.category))}||${normalize(item.title)}`));

  console.log(JSON.stringify({
    mode,
    dbCount: dbRows.length,
    localCount: local.length,
    matchedCount: matched.length,
    orphanCount: orphans.length,
    localOnlyCount: localOnly.length,
    sampleOrphans: orphans.slice(0, 25).map((row) => ({ id: row.id, category: row.category, title: row.title, image_path: row.image_path })),
    sampleLocalOnly: localOnly.slice(0, 25).map((item) => ({ category: item.category, title: item.title, image_path: item.image_path })),
  }, null, 2));

  if (mode === 'delete-orphans') {
    if (!orphans.length) {
      console.log('No orphaned rows to delete.');
      return;
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env before running --delete-orphans.');
    }

    const supabase = createClient(CONFIG.SUPABASE_URL, serviceRoleKey);
    const ids = orphans.map((row) => row.id);
    const storagePaths = orphans.map((row) => row.image_path);

    const { error: storageError } = await supabase.storage.from('artworks').remove(storagePaths);
    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('artworks').delete().in('id', ids);
    if (dbError) throw dbError;

    console.log(`Deleted ${ids.length} orphaned records and their storage objects.`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});