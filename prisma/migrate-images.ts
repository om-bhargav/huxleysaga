/**
 * Moves every image the database points at onto Cloudinary, then points the database at Cloudinary.
 *
 *   pnpm db:images:dry    list what would move, change nothing
 *   pnpm db:images        upload and update
 *
 * Covers comic posters, story and collaborator images, gallery images, character images,
 * campaign images and backer testimonial images.
 *
 *   https://…           downloaded here (CDNs included), then uploaded
 *   /characters/…       read from /public
 *   res.cloudinary.com  already there, left alone
 *   picsum.photos       placeholder art, left alone
 *
 * Safe to run again: each source gets a fixed Cloudinary id (a hash of its URL), so a rerun
 * after a failure reuses what already went up instead of uploading copies. Images that can't
 * be uploaded keep their old URL and are listed at the end.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import path from 'node:path';
import cloudinary from '@/lib/cloudinary';
import type { ComicFace, ComicHero, ComicStory } from '@/lib/comics/types';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const DRY = process.argv.includes('--dry');

/* ---------- Uploading ---------- */

/** Same folders as the admin uploads (app/api/uploads), under huxleysaga/ */
type UploadFolder = 'comics' | 'characters' | 'campaigns' | 'testimonials';

const isCloudinaryUrl = (url: string) => url.startsWith('https://res.cloudinary.com/');

/** Placeholder art from picsum.photos: already hosted, and getting replaced anyway, so it stays put */
const isPicsum = (url: string) => /^https?:\/\/([a-z0-9-]+\.)*picsum\.photos\//i.test(url);

/** Source URL → Cloudinary URL, so an image used in several places goes up once */
const moved = new Map<string, string>();
const failed: { url: string; where: string; reason: string }[] = [];
let uploads = 0;

/* Some CDNs turn away requests that don't look like a browser, so downloads go out looking like one */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

/** Downloads a remote image here (rather than leaving Cloudinary to fetch it) and returns it as a data URI */
async function download(url: string) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`);

  const type = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || 'application/octet-stream';
  /* A CDN that blocks hotlinking often answers with a web page instead of the image */
  if (type.startsWith('text/') || type.includes('html') || type.includes('json')) {
    throw new Error(`Download failed: got ${type}, not an image`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  if (!bytes.length) throw new Error('Download failed: empty response');
  return { dataUri: `data:${type};base64,${bytes.toString('base64')}`, size: bytes.length };
}

/** What the SDK uploads: a downloaded remote image, or the /public file a site path points at */
async function source(url: string) {
  if (/^https?:\/\//.test(url)) return (await download(url)).dataUri;

  const file = path.join(process.cwd(), 'public', decodeURIComponent(url.split(/[?#]/)[0]));
  await access(file); // a clearer error than the SDK's when the file isn't there
  return file;
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

/** Whether a stored value is an image this script should move */
const movable = (url: string | null | undefined): url is string =>
  !!url && !isCloudinaryUrl(url) && !isPicsum(url) && (/^https?:\/\//.test(url) || url.startsWith('/'));

/** The Cloudinary URL for an image, uploading it the first time it's seen. Unmovable images come back as they were. */
async function toCloudinary(url: string | null | undefined, folder: UploadFolder, where: string) {
  if (!movable(url)) return url;
  const known = moved.get(url);
  if (known) return known;

  if (DRY) {
    /* Nothing goes up, but remote images are still downloaded so CDN problems show now rather than mid-run */
    try {
      const check = /^https?:\/\//.test(url) ? `downloads OK, ${kb((await download(url)).size)}` : (await source(url), 'file found');
      console.log(`  would upload ${url}  (${where}; ${check})`);
      uploads++;
    } catch (error) {
      failed.push({ url, where, reason: error instanceof Error ? error.message : String(error) });
    }
    moved.set(url, url);
    return url;
  }

  try {
    /* Same source → same id → a rerun finds the copy from last time */
    const publicId = createHash('sha1').update(url).digest('hex').slice(0, 20);
    /* overwrite: false → if that id is already up, Cloudinary hands back the existing image */
    const { secure_url: next } = await cloudinary.uploader.upload(await source(url), {
      folder: `huxleysaga/${folder}`,
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
    });
    moved.set(url, next);
    uploads++;
    console.log(`  ${url}\n    → ${next}`);
    return next;
  } catch (error) {
    failed.push({ url, where, reason: error instanceof Error ? error.message : String(error) });
    return url;
  }
}

/* ---------- Each table ---------- */

async function comics() {
  const rows = await prisma.comic.findMany({ include: { galleryImages: true } });
  let changed = 0;

  for (const comic of rows) {
    const hero = comic.hero as ComicHero;
    const story = comic.story as ComicStory;
    const face = comic.face as ComicFace | null;

    const poster = await toCloudinary(hero.poster, 'comics', `${comic.slug} hero poster`);
    const storyImage = await toCloudinary(story.image, 'comics', `${comic.slug} story image`);
    const faceImage = face && (await toCloudinary(face.image, 'comics', `${comic.slug} collaborator`));

    const data: Prisma.ComicUpdateInput = {};
    if (poster !== hero.poster) data.hero = { ...hero, poster: poster! };
    if (storyImage !== story.image) data.story = { ...story, image: storyImage ?? undefined };
    if (face && faceImage !== face.image) data.face = { ...face, image: faceImage! };

    if (!DRY && Object.keys(data).length) {
      await prisma.comic.update({ where: { id: comic.id }, data });
      changed++;
    }

    for (const image of comic.galleryImages) {
      const src = await toCloudinary(image.src, 'comics', `${comic.slug} gallery`);
      if (!DRY && src && src !== image.src) {
        await prisma.comicGalleryImage.update({ where: { id: image.id }, data: { src } });
        changed++;
      }
    }
  }
  return changed;
}

async function characters() {
  const rows = await prisma.character.findMany({ select: { id: true, name: true, images: true } });
  let changed = 0;

  for (const character of rows) {
    const images: string[] = [];
    for (const [i, url] of character.images.entries()) {
      images.push((await toCloudinary(url, 'characters', `${character.name} image ${i + 1}`)) ?? url);
    }
    if (!DRY && images.some((url, i) => url !== character.images[i])) {
      await prisma.character.update({ where: { id: character.id }, data: { images } });
      changed++;
    }
  }
  return changed;
}

async function campaigns() {
  const rows = await prisma.campaign.findMany({ select: { id: true, title: true, image: true } });
  let changed = 0;

  for (const campaign of rows) {
    const image = await toCloudinary(campaign.image, 'campaigns', campaign.title);
    if (!DRY && image && image !== campaign.image) {
      await prisma.campaign.update({ where: { id: campaign.id }, data: { image } });
      changed++;
    }
  }
  return changed;
}

async function testimonials() {
  const rows = await prisma.backerTestimonial.findMany({ select: { id: true, name: true, image: true } });
  let changed = 0;

  for (const testimonial of rows) {
    const image = await toCloudinary(testimonial.image, 'testimonials', `${testimonial.name}'s testimonial`);
    if (!DRY && image !== testimonial.image) {
      await prisma.backerTestimonial.update({ where: { id: testimonial.id }, data: { image } });
      changed++;
    }
  }
  return changed;
}

/* ---------- Run ---------- */

async function main() {
  /* Open the connection up front: a hosted database can take a few seconds to wake up */
  await prisma.$connect();
  console.log(DRY ? 'Dry run: nothing is uploaded or changed.\n' : 'Moving images to Cloudinary…\n');

  const counts = {
    comics: await comics(),
    characters: await characters(),
    campaigns: await campaigns(),
    testimonials: await testimonials(),
  };

  console.log(`\n${DRY ? 'Would upload' : 'Uploaded'} ${uploads} image(s).`);
  if (!DRY) {
    console.log(
      `Updated ${counts.comics} comic/gallery row(s), ${counts.characters} character(s), ${counts.campaigns} campaign(s), ${counts.testimonials} testimonial(s).`,
    );
  }

  if (failed.length) {
    console.log(`\n${failed.length} image(s) couldn't be moved and still use their old URL:`);
    for (const f of failed) console.log(`  ${f.url}  (${f.where}): ${f.reason}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
