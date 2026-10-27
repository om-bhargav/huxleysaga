import type { NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { failure, success } from '@/lib/api/response';

/* TODO: auth. Like every admin route here, this is open for now. */

/** Where each admin page's uploads go on Cloudinary, under huxleysaga/ */
const FOLDERS = ['comics', 'characters', 'campaigns', 'testimonials'];

/** Cloudinary's limit for an image on the free plan */
const MAX_BYTES = 10 * 1024 * 1024;

/** POST /api/uploads with form data { file, folder }. Answers with the Cloudinary URL. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get('file');
  const folder = form.get('folder');

  if (!(file instanceof File)) return failure('No file sent', 400);
  if (!file.type.startsWith('image/')) return failure(`${file.name} isn't an image`, 422);
  if (file.size > MAX_BYTES) return failure(`${file.name} is over 10 MB`, 422);
  if (typeof folder !== 'string' || !FOLDERS.includes(folder)) return failure('Unknown upload folder', 422);

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const result = await cloudinary.uploader.upload(`data:${file.type};base64,${base64}`, {
      folder: `huxleysaga/${folder}`,
      resource_type: 'image',
    });
    return success({ url: result.secure_url }, 'Image uploaded', 201);
  } catch (error) {
    console.error(error);
    return failure(error instanceof Error ? error.message : 'Upload failed', 502);
  }
}
