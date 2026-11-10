import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  filterCatalogModule, isIsolatedResource, isolatedPosterBasenames, isolationRule, publicCategoryCounts, publicResources,
} from '../scripts/lib/public-display.mjs';
import { assertPublicDist, stripIsolatedPosters } from '../scripts/lib/public-dist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

test('the isolation rule selects the retained freelancer-templates inventory', () => {
  const resources = readJson('data/resources.json');
  const projects = readJson('data/projects.json');
  const isolated = resources.filter(isIsolatedResource);
  const visible = publicResources(resources);
  assert.equal(isolationRule.purpose, 'public-display-isolation');
  assert.equal(isolationRule.resource_project_id, 'freelancer-templates');
  assert.equal(resources.length, 980);
  assert.equal(isolated.length, 688);
  assert.equal(visible.length, 292);
  assert.equal(projects.some((project) => project.id === 'freelancer-templates'), true);
  const licenses = {};
  for (const resource of isolated) {
    assert.equal(resource.project_id, 'freelancer-templates');
    assert.equal(resource.kind, 'film');
    assert.equal(Object.hasOwn(resource, 'license'), false);
    assert.equal(resource.preview.kind, 'video');
    assert.equal(resource.preview.redistributable, false);
    assert.equal(resource.preview.poster, `/previews/${resource.id}.webp`);
    licenses[resource.preview.license] = (licenses[resource.preview.license] ?? 0) + 1;
    assert.equal(existsSync(path.join(root, 'web/public/previews', `${resource.id}.webp`)), true, resource.id);
  }
  assert.deepEqual(licenses, { 'CC-BY-NC-SA': 680, 'CC-BY-NC-SA-4.0': 8 });
  const counts = { withPreview: 0, video: 0, thumb_link: 0, embed: 0 };
  for (const resource of visible) {
    if (!resource.preview) continue;
    counts.withPreview += 1;
    counts[resource.preview.kind] += 1;
  }
  assert.deepEqual(counts, { withPreview: 284, video: 213, thumb_link: 65, embed: 6 });
  assert.deepEqual(publicCategoryCounts(resources), { core: 267, filmAndScene: 142, maps: 6, shots: 73, styles: 46 });
  assert.equal(isolatedPosterBasenames(resources).length, 688);
});

test('catalog modules shipped to the site drop isolated rows and keep the repository file intact', () => {
  const resources = readJson('data/resources.json');
  const filtered = JSON.parse(filterCatalogModule('data/resources.json', JSON.stringify(resources)));
  assert.equal(filtered.length, 292);
  assert.equal(filtered.some(isIsolatedResource), false);
  assert.equal(resources.filter(isIsolatedResource).length, 688);
  const posters = readJson('data/preview-posters.json');
  const publicPosters = JSON.parse(filterCatalogModule('/repo/data/preview-posters.json', JSON.stringify(posters)));
  assert.equal(publicPosters.some((poster) => String(poster.resource_id).startsWith('freelancer-')), false);
  assert.equal(posters.filter((poster) => String(poster.resource_id).startsWith('freelancer-')).length, 688);
  const wrapped = filterCatalogModule('evidence.json', 'export default [{"id":"S-CV-074","project_id":"freelancer-templates"},{"id":"S-CV-001","project_id":"ink"}]\n');
  assert.match(wrapped, /^export default /);
  assert.deepEqual(JSON.parse(wrapped.replace(/^export default\s*/, '')), [{ id: 'S-CV-001', project_id: 'ink' }]);
  assert.equal(filterCatalogModule('notes.json', '[]'), null);
});

test('dist isolation removes copied posters and rejects leftover pages, search data, and sitemap entries', async () => {
  const dist = await mkdtemp(path.join(os.tmpdir(), 'acv-dist-'));
  const id = 'freelancer-testimonial-neon-split';
  try {
    await mkdir(path.join(dist, 'previews'), { recursive: true });
    await mkdir(path.join(dist, 'resources', id), { recursive: true });
    await mkdir(path.join(dist, 'resources', 'ink-press'), { recursive: true });
    await mkdir(path.join(dist, 'projects', 'freelancer-templates'), { recursive: true });
    await mkdir(path.join(dist, 'data'), { recursive: true });
    await mkdir(path.join(dist, 'assets'), { recursive: true });
    await writeFile(path.join(dist, 'previews', `${id}.webp`), 'RIFF');
    await writeFile(path.join(dist, 'previews', 'ink-press.webp'), 'RIFF');
    await writeFile(path.join(dist, 'resources', id, 'index.html'), `<a href="/resources/${id}/">hidden</a>`);
    await writeFile(path.join(dist, 'resources', 'ink-press', 'index.html'), '<h1>Ink Press</h1>');
    await writeFile(path.join(dist, 'projects', 'freelancer-templates', 'index.html'), '<h1>Freelancer Templates</h1>');
    await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0"?><urlset><url><loc>https://awesomecodevideo.com/resources/${id}/</loc></url></urlset>`);
    await writeFile(path.join(dist, 'assets', 'index.js'), `search(${JSON.stringify({ id, url: 'https://freelancer-templates.org/previews/hero/Testimonial-NeonSplit.mp4' })})`);
    await writeFile(path.join(dist, 'data', 'catalog.json'), JSON.stringify({ version: 1, resources: [{ id, project_id: 'freelancer-templates' }], projects: [{ id: 'freelancer-templates' }], collections: [] }));
    const spec = { resourceIds: [id], projectId: 'freelancer-templates', posterBasenames: [`${id}.webp`] };
    await assert.rejects(() => assertPublicDist(dist, spec), /Public dist isolation failed/);
    const stripped = await stripIsolatedPosters(dist, spec.posterBasenames);
    assert.deepEqual(stripped, { removed: 1, missing: [] });
    assert.equal(existsSync(path.join(dist, 'previews', 'ink-press.webp')), true);
    assert.equal(existsSync(path.join(dist, 'previews', `${id}.webp`)), false);
    await rm(path.join(dist, 'resources', id), { recursive: true });
    await rm(path.join(dist, 'projects', 'freelancer-templates'), { recursive: true });
    await writeFile(path.join(dist, 'sitemap.xml'), '<?xml version="1.0"?><urlset><url><loc>https://awesomecodevideo.com/resources/ink-press/</loc></url></urlset>');
    await writeFile(path.join(dist, 'assets', 'index.js'), 'search({"id":"ink-press"})');
    await writeFile(path.join(dist, 'data', 'catalog.json'), JSON.stringify({ version: 1, resources: [{ id: 'ink-press' }], projects: [{ id: 'ink' }], collections: [] }));
    await assertPublicDist(dist, spec);
    const absent = await stripIsolatedPosters(dist, spec.posterBasenames);
    assert.deepEqual(absent, { removed: 0, missing: [`${id}.webp`] });
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('public READMEs list the public index and leave the 688 records in data', async () => {
  const resources = readJson('data/resources.json');
  const isolatedUrls = new Set(resources.filter(isIsolatedResource).map((resource) => resource.url));
  const [english, chinese] = await Promise.all([
    readFile(path.join(root, 'README.md'), 'utf8'),
    readFile(path.join(root, 'README.zh-CN.md'), 'utf8'),
  ]);
  for (const url of isolatedUrls) {
    assert.equal(english.includes(url), false, url);
    assert.equal(chinese.includes(url), false, url);
  }
  assert.match(english, /contains 267 reusable/);
  assert.match(chinese, /首批 267 个可复用单元：142 个成片或场景工程、6 个地图镜头、73 个镜头配方、46 个风格文件/);
  assert.equal(resources.filter(isIsolatedResource).length, 688);
});
