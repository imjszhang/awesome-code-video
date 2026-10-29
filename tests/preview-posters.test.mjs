import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const resources = JSON.parse(read('data/resources.json'));
const captures = JSON.parse(read('data/preview-posters.json'));
const bundledPoster = poster => typeof poster === 'string' && poster.startsWith('/previews/');

/** Batch L hotlinks upstream media and does not vendor a cover file. */
const HOTLINK_IDS = [
  'kinetic-tech',
  'kouboo-motion',
  'motiongit-deep-stage-host-stage',
  'motiongit-deep-stage-full-video',
  'motiongit-deep-stage-case-data',
  'motiongit-kit1-doc-shortfilm',
  'motiongit-kit2-koubo-wrap',
  'motiongit-volume-price-kline-charts',
  'motiongit-collage-wall',
  'motiongit-collage-views',
  'anatomy-ripple-tank',
  'map-motion-night-location',
];

test('every bundled MP4 has a real, traceable WebP poster', () => {
  const videos = resources.filter(r => r.preview?.kind === 'video' && new URL(r.preview.url).pathname.endsWith('.mp4'));
  const bundled = videos.filter(r => bundledPoster(r.preview.poster));
  assert.equal(captures.length, bundled.length);
  assert.equal(new Set(captures.map(c => c.resource_id)).size, captures.length);
  for (const resource of bundled) {
    const capture = captures.find(c => c.resource_id === resource.id);
    assert.ok(capture, resource.id);
    assert.equal(capture.source_url, resource.preview.url);
    assert.equal(capture.poster, `/previews/${resource.id}.webp`);
    assert.equal(resource.preview.poster, capture.poster);
    assert.equal(capture.license, resource.preview.license);
    assert.equal(capture.attribution, resource.preview.attribution);
    assert(capture.timestamp_seconds >= 0 && capture.timestamp_seconds < capture.duration_seconds);
    assert(capture.source_width > 0 && capture.source_height > 0);
    assert(capture.source_sha256 || capture.source_byte_ranges.length > 0);
    const bytes = read(`web/public${capture.poster}`);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), capture.poster_sha256);
  }
  for (const resource of videos.filter(r => !bundledPoster(r.preview.poster))) {
    assert.equal(resource.preview.poster.startsWith('https://'), true, resource.id);
    assert.equal(captures.some(c => c.resource_id === resource.id), false, resource.id);
  }
});

test('every gallery preview has a bundled cover or an explicit hotlink', () => {
  const images = JSON.parse(read('data/image-preview-posters.json'));
  const pages = JSON.parse(read('data/page-preview-posters.json'));
  const all = [...captures, ...images, ...pages];
  const previews = resources.filter(r => r.preview);
  const bundled = previews.filter(r => bundledPoster(r.preview.poster));
  assert.equal(all.length, bundled.length);
  assert.equal(new Set(all.map(c => c.resource_id)).size, all.length);
  for (const resource of bundled) {
    const record = all.find(c => c.resource_id === resource.id);
    assert.ok(record, resource.id);
    assert.equal(record.poster, resource.preview.poster);
    assert.equal(record.page_url || record.source_url, resource.preview.url);
    const bytes = read(`web/public${record.poster}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.poster_sha256);
    if (record.page_url?.includes('youtube.com/embed/')) {
      assert(record.source_url.includes(record.page_url.split('/').at(-1)));
      assert(record.upstream_title);
    }
  }
  const hotlinks = previews.filter(r => !bundledPoster(r.preview.poster));
  assert.deepEqual(hotlinks.map(r => r.id).sort(), [...HOTLINK_IDS].sort());
  for (const resource of hotlinks) {
    assert.equal(resource.review.render_tested, false, resource.id);
    assert.equal(all.some(c => c.resource_id === resource.id), false, resource.id);
    assert.equal(existsSync(new URL(`web/public/previews/${resource.id}.webp`, root)), false, resource.id);
    if (resource.preview.kind === 'video') assert.equal(resource.preview.poster.startsWith('https://'), true, resource.id);
    else assert.equal(Object.hasOwn(resource.preview, 'poster'), false, resource.id);
  }
  const night = resources.find(r => r.id === 'map-motion-night-location');
  assert.equal(night.preview.kind, 'thumb_link');
  assert.equal(night.preview.url, 'https://raw.githubusercontent.com/SpaceZephyr/map-motion/main/docs/media/vlog_locate_bund.webp');
  assert.equal(night.preview.redistributable, false);
  assert.doesNotMatch(night.editorial_note, /No matching export|Preview withheld/);
  const full = resources.find(r => r.id === 'motiongit-deep-stage-full-video');
  assert.equal(full.preview.kind, 'video');
  assert.equal(full.preview.poster, 'https://media.openaicut.com/covers/885/1.0.0-10251bc4895b.jpg');
  assert.equal(full.preview.redistributable, false);
  assert.equal(resources.find(r => r.id === 'amicro-line-reveal').preview, undefined);
  assert(resources.find(r => r.id === 'map-motion-radial-coverage').preview.url.endsWith('/radiate_dark.webp'));
});
