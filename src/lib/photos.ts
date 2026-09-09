import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

function getPhotoDimensions(filePath: string) {
  try {
    const dimensions = sizeOf(fs.readFileSync(filePath));
    return dimensions;
  } catch (error) {
    console.error(`Failed to get dimensions for ${filePath}:`, error);
    return null;
  }
}

export function getAlbumPhotos(slug: string): Photo[] {
  const directoryPath = path.join(process.cwd(), 'public', 'photos', slug);
  
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(directoryPath);
    const photos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext) && !file.toLowerCase().startsWith('cover.');
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(file => {
        const filePath = path.join(directoryPath, file);
        const dimensions = getPhotoDimensions(filePath);
        
        return {
          src: `/photos/${slug}/${file}`,
          width: dimensions?.width || 1000,
          height: dimensions?.height || 1000,
          alt: file.replace(path.extname(file), '')
        };
      });

    return photos;
  } catch (err) {
    console.error(`Error reading directory ${directoryPath}:`, err);
    return [];
  }
}

export function getAlbumCover(slug: string): string | null {
  const directoryPath = path.join(process.cwd(), 'public', 'photos', slug);
  
  if (!fs.existsSync(directoryPath)) {
    return null;
  }

  try {
    const files = fs.readdirSync(directoryPath);
    const coverFile = files.find(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext) && file.toLowerCase().startsWith('cover.');
    });

    if (coverFile) {
      return `/photos/${slug}/${coverFile}`;
    }

    // Fallback to first image
    const validPhotos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (validPhotos.length > 0) {
      return `/photos/${slug}/${validPhotos[0]}`;
    }

  } catch (err) {
    console.error(`Error reading cover in ${directoryPath}:`, err);
  }

  return null;
}
