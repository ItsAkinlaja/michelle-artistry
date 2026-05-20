const fs = require('fs').promises;
const path = require('path');

// Folders to scan (relative to repo root)
const folders = [
  'images',
  'book cover',
  'Character design',
  'Children book illustration',
  'Comics',
  'fan art',
  'manga',
  'NSFW',
  'portrait',
  'Logos'
];

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

async function scanDir(dir, base) {
  let results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await scanDir(full, base));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (exts.has(ext)) {
          const stats = await fs.stat(full);
          const rel = path.relative(base, full).split(path.sep).join('/');
          const parts = rel.split('/');
          const category = parts.length > 1 ? parts[0] : 'Uncategorized';
          results.push({ image_path: rel, title: path.basename(entry.name, ext), category, created_at: stats.mtime.toISOString() });
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return results;
}

async function main() {
  const base = process.cwd();
  let all = [];
  for (const f of folders) {
    const dir = path.join(base, f);
    const found = await scanDir(dir, base);
    all = all.concat(found);
  }

  // Also scan root-level images folder as a fallback
  const rootFound = await scanDir(path.join(base, 'images'), base).catch(() => []);
  all = all.concat(rootFound);

  const outPath = path.join(base, 'public_images.json');
  await fs.writeFile(outPath, JSON.stringify(all, null, 2), 'utf8');
  console.log(`Wrote ${all.length} entries to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
