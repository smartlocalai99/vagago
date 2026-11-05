const quality = 0.8;

function encode(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function render(bitmap: ImageBitmap, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  // Safari cannot encode WebP and silently returns PNG, so fall back to JPEG there.
  const webp = await encode(canvas, 'image/webp');
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await encode(canvas, 'image/jpeg');
  if (!jpeg) throw new Error('Couldn’t process this photo.');
  return jpeg;
}

// Phone photos are 3-8 MB. Each upload becomes a 1600px photo for full-screen galleries
// and a 480px thumbnail for lists (the storage plan has no on-the-fly resizing).
export async function compressPhoto(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const full = await render(bitmap, 1600);
    const thumb = await render(bitmap, 480);
    return { full, thumb, extension: full.type === 'image/webp' ? 'webp' : 'jpg' };
  } finally {
    bitmap.close();
  }
}

// Thumbnails sit next to the photo: <id>.webp -> <id>.thumb.webp
export const thumbPath = (path: string) => path.replace(/\.(\w+)$/, '.thumb.$1');
