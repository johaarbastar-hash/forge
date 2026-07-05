const MAX_EDGE = 1280;
const QUALITY = 0.8;

/**
 * Compress an image File to a JPEG Blob with the longest edge ≤ 1280 px at
 * quality 0.8 (SPEC §5.6 / photos rule). Runs on a canvas; falls back to the
 * original file if the browser can't decode it.
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap) bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', QUALITY);
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> decode
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
