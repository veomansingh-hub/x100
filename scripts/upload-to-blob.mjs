import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const photosDir = path.join(rootDir, 'public', 'photos');
const manifestPath = path.join(rootDir, 'src', 'data', 'photos.json');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

// Load existing manifest to avoid re-uploading
let existingManifest = {};
if (fs.existsSync(manifestPath)) {
  existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

// Check if a photo is already in blob (has a blob URL)
function isAlreadyUploaded(slug, filename) {
  const existing = existingManifest[slug] || [];
  const match = existing.find(p => p.src.includes(filename) && p.src.startsWith('https://'));
  return match ? match.src : null;
}

async function main() {
  const albums = fs.readdirSync(photosDir).filter(f => 
    !f.startsWith('.') && fs.statSync(path.join(photosDir, f)).isDirectory()
  );

  const manifest = {};
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const album of albums) {
    const albumPath = path.join(photosDir, album);
    const files = fs.readdirSync(albumPath)
      .filter(file => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    manifest[album] = [];
    console.log(`\n📁 Album: ${album} (${files.length} photos)`);

    for (const file of files) {
      const filePath = path.join(albumPath, file);
      const blobPathname = `photos/${album}/${file}`;
      
      // Check existing
      const existingUrl = isAlreadyUploaded(album, file);
      if (existingUrl) {
        // get dims from existing
        const existing = (existingManifest[album] || []).find(p => p.src.includes(file));
        manifest[album].push(existing || { src: existingUrl, width: 1000, height: 1000, alt: file.replace(path.extname(file), '') });
        skipped++;
        continue;
      }

      try {
        // Get dimensions
        let width = 1000, height = 1000;
        try {
          const dims = sizeOf(fs.readFileSync(filePath));
          if (dims.width && dims.height) { width = dims.width; height = dims.height; }
        } catch(e) {}

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(file).toLowerCase();
        const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                           ext === '.png' ? 'image/png' : 
                           ext === '.webp' ? 'image/webp' : 'image/jpeg';

        const result = await put(blobPathname, fileBuffer, {
          access: 'public',
          contentType,
          addRandomSuffix: false,
        });

        manifest[album].push({
          src: result.url,
          width,
          height,
          alt: file.replace(path.extname(file), '')
        });

        uploaded++;
        process.stdout.write(`  ✓ ${file}\n`);

        // Save manifest after every 10 uploads to preserve progress
        if (uploaded % 10 === 0) {
          fs.writeFileSync(manifestPath, JSON.stringify({ ...existingManifest, ...manifest }, null, 2));
        }

      } catch (err) {
        console.error(`  ✗ ${file}: ${err.message}`);
        // Fall back to local path
        manifest[album].push({
          src: `/photos/${album}/${file}`,
          width: 1000,
          height: 1000,
          alt: file.replace(path.extname(file), '')
        });
        errors++;
      }
    }
  }

  // Final manifest save
  const finalManifest = { ...existingManifest, ...manifest };
  fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2));

  console.log(`\n✅ Done! Uploaded: ${uploaded}, Skipped (already uploaded): ${skipped}, Errors: ${errors}`);
  console.log(`📄 Manifest saved to src/data/photos.json`);
}

main().catch(console.error);
