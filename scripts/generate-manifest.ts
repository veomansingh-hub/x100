import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

interface PhotoMeta {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

function main() {
  const photosDir = path.join(process.cwd(), 'public', 'photos');
  const manifestPath = path.join(process.cwd(), 'src', 'data', 'photos.json');
  
  if (!fs.existsSync(photosDir)) {
    console.error('No photos directory found.');
    return;
  }

  const albums = fs.readdirSync(photosDir).filter(f => !f.startsWith('.') && fs.statSync(path.join(photosDir, f)).isDirectory());
  
  const manifest: Record<string, PhotoMeta[]> = {};

  for (const album of albums) {
    const albumPath = path.join(photosDir, album);
    const files = fs.readdirSync(albumPath);
    
    const photos = files
      .filter(file => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(file => {
        const filePath = path.join(albumPath, file);
        let dimensions = { width: 1000, height: 1000 };
        try {
          const dims = sizeOf(fs.readFileSync(filePath));
          if (dims.width && dims.height) {
            dimensions = { width: dims.width, height: dims.height };
          }
        } catch (e) {}

        return {
          src: `/photos/${album}/${file}`,
          width: dimensions.width,
          height: dimensions.height,
          alt: file.replace(path.extname(file), '')
        };
      });
      
    manifest[album] = photos;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Generated src/data/photos.json');
}

main();
