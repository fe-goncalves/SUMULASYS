import { supabase } from '../supabase';
import { compressBase64Image, compressImage } from './imageCompressor';

export const LOGOS_BUCKET = 'logos';

export function isRemoteUrl(value?: string | null): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function isDataUrl(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith('data:');
}

function sanitizePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'logo';
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let bucketReady: Promise<void> | null = null;

async function ensureLogosBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = supabase.storage
      .createBucket(LOGOS_BUCKET, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      })
      .then(({ error }) => {
        if (!error) return;
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('exists')) {
          return;
        }
        // Anon key usually cannot create buckets; SQL migration covers that.
        console.warn('Could not create logos bucket:', error.message);
      });
  }
  await bucketReady;
}

async function sourceToPngBlob(source: File | string): Promise<Blob> {
  if (source instanceof File) {
    const dataUrl = await compressImage(source, 300, 300);
    return dataUrlToBlob(dataUrl);
  }
  const compressed = await compressBase64Image(source, 300, 300);
  return dataUrlToBlob(compressed);
}

export async function persistLogotype(
  userId: string,
  folder: 'teams' | 'tournaments',
  entityId: string,
  source: File | string | null | undefined,
): Promise<string | null> {
  if (!source) return null;
  if (typeof source === 'string' && isRemoteUrl(source)) return source;
  if (typeof source === 'string' && source.startsWith('blob:')) return null;
  if (typeof source === 'string' && !isDataUrl(source)) return source;

  const blob = await sourceToPngBlob(source);
  await ensureLogosBucket();

  const path = `${userId}/${folder}/${sanitizePathPart(String(entityId))}.png`;
  const { error } = await supabase.storage.from(LOGOS_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/png',
    cacheControl: '31536000',
  });

  if (error) {
    console.warn('Logo upload failed, keeping compressed image in the row:', error.message);
    return blobToDataUrl(blob);
  }

  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function expectedLogoUrl(
  userId: string,
  folder: 'teams' | 'tournaments',
  entityId: string,
): string {
  const path = `${userId}/${folder}/${sanitizePathPart(String(entityId))}.png`;
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function imageSrcForPdf(src?: string | null): Promise<string | null> {
  if (!src) return null;
  if (isDataUrl(src)) return src;
  if (!isRemoteUrl(src)) return src;

  try {
    const response = await fetch(src);
    if (!response.ok) return src;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (err) {
    console.warn('Could not inline logo for PDF', err);
    return src;
  }
}
