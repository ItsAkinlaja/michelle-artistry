#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputDir = path.join(rootDir, 'dist');
const excludedNames = new Set(['.git', '.github', 'node_modules', 'dist', '.vercel', '.vscode', '.env']);

async function copyEntry(sourcePath, targetPath) {
  const stats = await fs.promises.lstat(sourcePath);

  if (stats.isDirectory()) {
    await fs.promises.mkdir(targetPath, { recursive: true });
    const entries = await fs.promises.readdir(sourcePath, { withFileTypes: true });
    for (const entry of entries) {
      if (excludedNames.has(entry.name)) continue;
      await copyEntry(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
    }
    return;
  }

  if (stats.isFile()) {
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.copyFile(sourcePath, targetPath);
  }
}

async function main() {
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  await fs.promises.mkdir(outputDir, { recursive: true });

  const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludedNames.has(entry.name)) continue;
    await copyEntry(path.join(rootDir, entry.name), path.join(outputDir, entry.name));
  }

  console.log(`Static build complete: ${outputDir}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});