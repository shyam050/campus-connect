import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfigured, env } from '../config/env';

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export interface StoredFile {
  url: string;
  provider: 'cloudinary' | 'local';
}

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a resume to Cloudinary (CDN delivery, raw resource type for documents).
 * Falls back to local disk under server/uploads (served at /uploads) when
 * Cloudinary credentials are not configured — keeps local dev zero-config.
 */
export async function uploadResume(buffer: Buffer, originalName: string): Promise<StoredFile> {
  if (cloudinaryConfigured) {
    return new Promise<StoredFile>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'campusconnect/resumes', resource_type: 'raw' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, provider: 'cloudinary' });
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  await ensureUploadDir();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const filename = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, provider: 'local' };
}

/** Used by tests to stream a file into a writable without keeping a buffer. */
export async function saveStream(readable: Readable, filename: string): Promise<void> {
  await ensureUploadDir();
  await pipeline(readable, createWriteStream(path.join(UPLOAD_DIR, filename)));
}
