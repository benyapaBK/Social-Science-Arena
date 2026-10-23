import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // source file limit
const MAX_DATAURL_CHARS = 850_000;               // Firestore doc limit is 1 MiB
const MAX_EDGE = 1280;

export const IMAGE_REF_PREFIX = 'img:';

export function isStoredImageRef(value: string): boolean {
  return value.startsWith(IMAGE_REF_PREFIX);
}

export function resolveStaticImageUrl(imageFileName: string): string {
  if (!imageFileName) return '';
  if (/^(https?:|data:|blob:|\/)/.test(imageFileName)) return imageFileName;
  return `/assets/${imageFileName}`;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'ไฟล์ไม่รองรับ กรุณาเลือก PNG, JPG, JPEG หรือ WebP';
  if (file.size > MAX_UPLOAD_BYTES) return `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`;
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });
}

/** Downscales and re-encodes as JPEG so the result fits in a Firestore document. */
export async function compressImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    let scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    for (let attempt = 0; attempt < 6; attempt++) {
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      for (const quality of [0.85, 0.72, 0.6]) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= MAX_DATAURL_CHARS) return { dataUrl, width, height };
      }
      scale *= 0.8;
    }
    throw new Error('too-large');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function saveQuestionImage(ownerUid: string, dataUrl: string, width: number, height: number): Promise<string> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(db, 'questionImages', id), { ownerUid, dataUrl, width, height, createdAt: Date.now() });
  return IMAGE_REF_PREFIX + id;
}

export async function deleteQuestionImage(ref: string): Promise<void> {
  if (!isStoredImageRef(ref)) return;
  await deleteDoc(doc(db, 'questionImages', ref.slice(IMAGE_REF_PREFIX.length)));
}

const cache = new Map<string, Promise<string>>();

export function loadImageUrl(imageFileName: string): Promise<string> {
  if (!isStoredImageRef(imageFileName)) return Promise.resolve(resolveStaticImageUrl(imageFileName));
  let hit = cache.get(imageFileName);
  if (!hit) {
    hit = getDoc(doc(db, 'questionImages', imageFileName.slice(IMAGE_REF_PREFIX.length))).then(snap => {
      if (!snap.exists()) throw new Error('missing');
      return snap.data().dataUrl as string;
    });
    hit.catch(() => cache.delete(imageFileName));
    cache.set(imageFileName, hit);
  }
  return hit;
}
