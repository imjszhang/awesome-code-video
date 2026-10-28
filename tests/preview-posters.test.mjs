import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const resources = JSON.parse(read('data/resources.json'));
const captures = JSON.parse(read('data/preview-posters.json'));

test('every MP4 has a real, traceable, bundled WebP poster', () => {
  const videos = resources.filter(r => r.preview?.kind === 'video' && new URL(r.preview.url).pathname.endsWith('.mp4'));
  assert.equal(captures.length, videos.length);
  assert.equal(new Set(captures.map(c => c.resource_id)).size, captures.length);
  for (const resource of videos) {
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
});

test('every gallery preview has a bundled cover with matching source provenance', () => {
  const images = JSON.parse(read('data/image-preview-posters.json'));
  const pages = JSON.parse(read('data/page-preview-posters.json'));
  const all = [...captures, ...images, ...pages];
  const previews = resources.filter(r => r.preview);
  assert.equal(all.length, previews.length);
  assert.equal(new Set(all.map(c => c.resource_id)).size, all.length);
  for (const resource of previews) {
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
  assert.equal(resources.find(r => r.id === 'map-motion-night-location').preview, undefined);
  assert(resources.find(r => r.id === 'map-motion-radial-coverage').preview.url.endsWith('/radiate_dark.webp'));
});
