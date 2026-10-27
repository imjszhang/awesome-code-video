import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  addCandidate, findMatches, loadCatalog, normalizeUrl,
  projectForUrl, updateCandidate, urlIdentity, validateCatalog,
} from '../scripts/lib/catalog.mjs';

const execute = promisify(execFile);
const cli = fileURLToPath(new URL('../scripts/catalog.mjs', import.meta.url));
const readCandidates = root => fs.readFile(path.join(root, 'research/candidates.json'), 'utf8');
function fixture() {
  return {
    projects: [{
      id: 'film-lab', name: 'Film Lab', aliases: ['FL'], url: 'https://github.com/Owner/Film-Lab',
      urls: ['https://github.com/old-owner/old-name', 'https://film.example'],
      github: { id: 123, full_name: 'Owner/Film-Lab', default_branch: 'main' }, identity_checked_at: '2026-10-27',
    }],
    resources: [{
      id: 'intro', project_id: 'film-lab', name: 'Intro', kind: 'scene', section: 'Film and Scene Templates',
      url: 'https://github.com/Owner/Film-Lab/blob/main/examples/Intro.js', description: 'Editable title sequence.',
      evidence_ids: ['S-CV-001'], review: { level: 'source-reviewed', reviewed_at: '2026-10-27', render_tested: false },
    }],
    evidence: [{
      id: 'S-CV-001', project_id: 'film-lab', title: 'Official example', type: 'official-source',
      url: 'https://github.com/Owner/Film-Lab/blob/main/examples/Intro.js', status: 'reviewed', reliability: 'high',
      checked_at: '2026-10-27', notes: 'Source inspected; no render performed.',
    }],
    candidates: [],
  };
}
async function workspace(t, catalog = fixture()) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'code-video-catalog-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'data'));
  await fs.mkdir(path.join(root, 'research'));
  await saveFixture(root, catalog);
  return root;
}
async function saveFixture(root, catalog) {
  for (const [key, value] of Object.entries(catalog)) {
    const target = key === 'candidates' ? 'research/candidates.json' : `data/${key}.json`;
    await fs.writeFile(path.join(root, target), `${JSON.stringify(value, null, 2)}\n`);
  }
}

// These cases deliberately include Git URLs and public article anchors, because they
// are the main difference between a project identity and one specific video resource.
test('URL normalization removes tracking but preserves semantic details', () => {
  assert.equal(normalizeUrl(' https://EXAMPLE.com/a/?utm_source=x&version=2&lang=en#shot-1 '), 'https://example.com/a?lang=en&version=2#shot-1');
  assert.equal(normalizeUrl('git@github.com:Owner/Film-Lab.git'), 'https://github.com/owner/film-lab');
  assert.equal(normalizeUrl('ssh://git@github.com/OWNER/Film-Lab.git'), 'https://github.com/owner/film-lab');
  assert.equal(normalizeUrl('http://www.github.com/Owner/Film-Lab/'), 'https://github.com/owner/film-lab');
  assert.equal(normalizeUrl('https://github.com/Owner/Film-Lab/blob/main/Intro.js'), 'https://github.com/owner/film-lab/blob/main/Intro.js');
  for (const url of ['file:///tmp/a', 'javascript:alert(1)', 'ftp://example.com/a', 'https://user:secret@example.com/a', 'invalid']) {
    assert.throws(() => normalizeUrl(url));
  }
});

test('known repository aliases and numeric IDs converge without a network call', () => {
  const { projects } = fixture();
  for (const url of ['https://github.com/OWNER/FILM-LAB', 'git@github.com:old-owner/old-name.git', 'https://film.example/', 'https://api.github.com/repositories/123']) assert.equal(urlIdentity(url, projects), 'github:123');
  assert.equal(projectForUrl('https://film.example/gallery/scene', projects).id, 'film-lab');
  assert.equal(projectForUrl('https://film.example.evil/gallery', projects), null);
  assert.equal(findMatches(fixture(), 'github:123').resources[0].id, 'intro');
  assert.equal(findMatches(fixture(), 'FL').projects[0].id, 'film-lab');
});

test('raw and blob views converge while case, anchors, and distinct refs remain separate', () => {
  const { projects } = fixture();
  const a = urlIdentity('https://github.com/Owner/Film-Lab/blob/main/examples/Intro.js', projects);
  assert.equal(a, urlIdentity('https://raw.githubusercontent.com/old-owner/old-name/main/examples/Intro.js?utm_source=article', projects));
  assert.notEqual(a, urlIdentity('https://github.com/Owner/Film-Lab/blob/main/examples/intro.js', projects));
  assert.notEqual(a, urlIdentity('https://github.com/Owner/Film-Lab/blob/dev/examples/Intro.js', projects));
  assert.notEqual(a, urlIdentity('https://github.com/Owner/Film-Lab/blob/main/examples/Other.js', projects));
  assert.notEqual(urlIdentity('https://film.example/gallery#one', projects), urlIdentity('https://film.example/gallery#two', projects));
  assert.notEqual(urlIdentity('https://film.example/gallery?version=1', projects), urlIdentity('https://film.example/gallery?version=2', projects));
});

test('nested default branch names are matched as a whole', () => {
  const { projects } = fixture();
  projects[0].github.default_branch = 'release/current';
  assert.equal(urlIdentity('https://github.com/Owner/Film-Lab/blob/release/current/scene.js', projects), urlIdentity('https://raw.githubusercontent.com/Owner/Film-Lab/release/current/scene.js', projects));
  assert.notEqual(urlIdentity('https://github.com/Owner/Film-Lab/blob/release/current/scene.js', projects), urlIdentity('https://github.com/Owner/Film-Lab/blob/release/old/scene.js', projects));
});

test('integrity checks detect dangling references and duplicate resource identities', () => {
  const data = fixture();
  assert.equal(validateCatalog(data).ok, true);
  data.resources.push({ ...data.resources[0], id: 'intro-copy', url: 'https://raw.githubusercontent.com/Owner/Film-Lab/main/examples/Intro.js' });
  data.resources[0].evidence_ids = ['S-CV-999'];
  const audit = validateCatalog(data);
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.some(error => error.includes('duplicates intro')));
  assert.ok(audit.errors.some(error => error.includes('unknown evidence_id S-CV-999')));
});

test('review metadata, section, and unknown host associations are checked', () => {
  const data = fixture();
  data.resources[0].review.render_tested = true;
  data.resources[0].section = 'Visual Style Templates';
  data.resources[0].url = 'https://unrelated.example/intro';
  data.evidence[0].checked_at = '2026-02-30';
  const audit = validateCatalog(data);
  assert.ok(audit.errors.some(error => error.includes('render_tested disagree')));
  assert.ok(audit.errors.some(error => error.includes('section does not match')));
  assert.ok(audit.errors.some(error => error.includes('outside the project')));
  assert.ok(audit.errors.some(error => error.includes('checked_at')));
});

test('already-listed URLs do not create candidates; different shots in the same project do', async t => {
  const root = await workspace(t);
  const original = await readCandidates(root);
  const existing = await addCandidate(root, { url: 'https://raw.githubusercontent.com/Owner/Film-Lab/main/examples/Intro.js', name: 'Intro seen in an article' });
  assert.equal(existing.action, 'already-listed');
  assert.equal(existing.resource.id, 'intro');
  assert.equal(await readCandidates(root), original);
  const other = await addCandidate(root, { url: 'https://github.com/Owner/Film-Lab/blob/main/examples/Outro.js', name: 'Outro' });
  assert.equal(other.action, 'added');
  assert.equal(other.project.id, 'film-lab');
  assert.equal((await loadCatalog(root)).candidates.length, 1);
});

test('rejected candidates stay discoverable and are not silently re-added', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://film.example/gallery#other', name: 'Other scene' });
  await updateCandidate(root, { id: added.candidate.id, status: 'rejected', reason: 'Only a preview; no reusable source.' });
  const original = await readCandidates(root);
  const duplicate = await addCandidate(root, { url: 'https://film.example/gallery?utm_medium=feed#other', name: 'Another article name' });
  assert.equal(duplicate.action, 'already-candidate');
  assert.equal(duplicate.candidate.status, 'rejected');
  assert.equal(await readCandidates(root), original);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'researching' }), /Reopening/);
  await updateCandidate(root, { id: added.candidate.id, status: 'researching', reason: 'Author has now linked source.' });
  const candidate = (await loadCatalog(root)).candidates[0];
  assert.deepEqual(candidate.history.map(event => event.to), ['pending', 'rejected', 'researching']);
  assert.equal(validateCatalog(await loadCatalog(root)).ok, true);
});

test('invalid changes leave candidate bytes unchanged and release their write lock', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://film.example/gallery#new', name: 'New' });
  const before = await readCandidates(root);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'rejected' }), /requires --reason/);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'accepted', resource_id: 'intro' }), /does not match candidate URL/);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'duplicate', reason: 'Same animation.' }), /requires --resource/);
  await assert.rejects(addCandidate(root, { url: 'javascript:alert(1)', name: 'Unsafe' }));
  assert.equal(await readCandidates(root), before);
  assert.deepEqual(await fs.readdir(path.join(root, 'research')), ['candidates.json']);
});

test('acceptance links reviewed source and preserves history without creating resources', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://github.com/Owner/Film-Lab/blob/main/examples/Outro.js', name: 'Outro' });
  await updateCandidate(root, { id: added.candidate.id, status: 'researching', reason: 'Inspecting implementation.' });
  const data = await loadCatalog(root);
  data.resources.push({ ...data.resources[0], id: 'outro', name: 'Outro', url: added.candidate.url });
  await saveFixture(root, data);
  assert.ok(validateCatalog(data).warnings.some(warning => warning.includes('resolve the candidate')));
  const beforeResources = await fs.readFile(path.join(root, 'data/resources.json'), 'utf8');
  const result = await updateCandidate(root, { id: added.candidate.id, status: 'accepted', resource_id: 'outro', reason: 'Reviewed source and added the catalog entry.' });
  assert.equal(result.candidate.resource_id, 'outro');
  assert.deepEqual(result.candidate.evidence_ids, ['S-CV-001']);
  assert.deepEqual(result.candidate.history.map(event => event.to), ['pending', 'researching', 'accepted']);
  assert.equal(await fs.readFile(path.join(root, 'data/resources.json'), 'utf8'), beforeResources);
  assert.equal(validateCatalog(await loadCatalog(root)).ok, true);
});

test('duplicate resolution records an explicit target and reason', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://film.example/gallery/intro-preview', name: 'Intro preview' });
  const resolved = await updateCandidate(root, { id: added.candidate.id, status: 'duplicate', resource_id: 'intro', reason: 'Alternative preview page for the existing intro.' });
  assert.equal(resolved.candidate.resource_id, 'intro');
  assert.equal(resolved.candidate.status, 'duplicate');
  assert.equal(validateCatalog(await loadCatalog(root)).ok, true);
});

test('unreviewed and cross-project evidence cannot support accepted resources', async () => {
  const data = fixture();
  data.evidence[0].status = 'unverified';
  assert.ok(validateCatalog(data).errors.some(error => error.includes('has not been reviewed')));
  data.evidence[0].status = 'reviewed';
  data.evidence[0].project_id = 'elsewhere';
  const audit = validateCatalog(data);
  assert.ok(audit.errors.some(error => error.includes('different project')));
});

test('an existing writer lock prevents overwrites', async t => {
  const root = await workspace(t);
  const before = await readCandidates(root);
  await fs.writeFile(path.join(root, 'research/.candidates.lock'), 'owned by a different process');
  await assert.rejects(addCandidate(root, { url: 'https://film.example/new', name: 'New' }), /locked by another writer/);
  assert.equal(await readCandidates(root), before);
  assert.equal(await fs.readFile(path.join(root, 'research/.candidates.lock'), 'utf8'), 'owned by a different process');
});

test('CLI emits JSON and fails invalid writes with a nonzero status', async t => {
  const root = await workspace(t);
  const { stdout } = await execute(process.execPath, [cli, 'find', 'https://raw.githubusercontent.com/Owner/Film-Lab/main/examples/Intro.js', '--root', root, '--json']);
  assert.equal(JSON.parse(stdout).resources[0].id, 'intro');
  const before = await readCandidates(root);
  await assert.rejects(execute(process.execPath, [cli, 'candidate', 'add', 'ftp://example.com/a', '--name', 'Bad', '--root', root, '--json']), error => error.code === 1 && JSON.parse(error.stderr).error.includes('HTTP(S)'));
  assert.equal(await readCandidates(root), before);
});

test('project URL lookup returns related resources and their evidence without calling them duplicates', () => {
  const root = findMatches(fixture(), 'https://github.com/Owner/Film-Lab');
  assert.deepEqual(root.resources, []);
  assert.equal(root.related_resources[0].id, 'intro');
  assert.equal(root.evidence[0].id, 'S-CV-001');
  const exact = findMatches(fixture(), 'https://github.com/Owner/Film-Lab/blob/main/examples/Intro.js');
  assert.equal(exact.resources[0].id, 'intro');
  assert.deepEqual(exact.related_resources, []);
  assert.equal(exact.evidence[0].id, 'S-CV-001');
});

test('an article candidate can resolve to a reviewed resource without losing discovery provenance', async t => {
  const root = await workspace(t);
  const article = 'https://article.example/a?utm_source=feed';
  const added = await addCandidate(root, { url: article, name: 'Article about the intro' });
  const canonical = fixture().resources[0].url;
  const result = await updateCandidate(root, {
    id: added.candidate.id, status: 'accepted', resource_id: 'intro', resolved_url: canonical,
    reason: 'The author links this exact source file as the example.',
  });
  assert.equal(result.candidate.url, 'https://article.example/a');
  assert.equal(result.candidate.resolved_url, normalizeUrl(canonical));
  assert.equal(result.candidate.history.at(-1).resolution.to, normalizeUrl(canonical));
  assert.equal(result.candidate.history.at(-1).resolution.from, null);
  assert.equal(validateCatalog(await loadCatalog(root)).ok, true);
  const found = findMatches(await loadCatalog(root), canonical);
  assert.equal(found.candidates[0].id, added.candidate.id);
  assert.equal(findMatches(await loadCatalog(root), article).projects[0].id, 'film-lab');
  const repeat = await addCandidate(root, { url: article, name: 'Seen again' });
  assert.equal(repeat.action, 'already-candidate');
  assert.equal(repeat.candidate.status, 'accepted');
  assert.equal((await loadCatalog(root)).candidates.length, 1);
});

test('resolved URL updates need reasons and cannot bypass resource identity checks', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://article.example/a', name: 'Article' });
  const before = await readCandidates(root);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'researching', resolved_url: fixture().resources[0].url }), /requires --reason/);
  await assert.rejects(updateCandidate(root, { id: added.candidate.id, status: 'accepted', resource_id: 'intro', resolved_url: 'https://github.com/Owner/Film-Lab/blob/main/examples/Other.js', reason: 'Claims same source.' }), /does not match candidate URL/);
  assert.equal(await readCandidates(root), before);
});

test('candidate dedup also uses resolved URLs and blocks conflicting resolution records', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://article.example/a', name: 'Article A' });
  const target = 'https://github.com/Owner/Film-Lab/blob/main/examples/New.js';
  await updateCandidate(root, { id: added.candidate.id, status: 'researching', resolved_url: target, reason: 'Linked source located.' });
  const repeated = await addCandidate(root, { url: 'https://raw.githubusercontent.com/Owner/Film-Lab/main/examples/New.js', name: 'Direct source' });
  assert.equal(repeated.action, 'already-candidate');
  assert.equal(repeated.candidate.id, added.candidate.id);
  const other = await addCandidate(root, { url: 'https://article.example/b', name: 'Article B' });
  const before = await readCandidates(root);
  await assert.rejects(updateCandidate(root, { id: other.candidate.id, status: 'researching', resolved_url: target, reason: 'Same source found again.' }), /Candidate URL.*duplicates/);
  assert.equal(await readCandidates(root), before);
});

test('manual resolution changes require matching resolution history', async t => {
  const root = await workspace(t);
  const added = await addCandidate(root, { url: 'https://article.example/a', name: 'Article' });
  const data = await loadCatalog(root);
  data.candidates[0].resolved_url = fixture().resources[0].url;
  assert.ok(validateCatalog(data).errors.some(error => error.includes('resolution history does not match')));
  assert.equal(added.candidate.status, 'pending');
});

test('optional preview objects keep the gallery field contract', () => {
  const catalog = fixture();
  assert.equal(validateCatalog(catalog).ok, true);
  catalog.resources[0].preview = {
    kind: 'video',
    url: 'https://github.com/Owner/Film-Lab/releases/download/demo/intro.mp4',
    license: 'MIT',
    attribution: 'Film Lab (https://github.com/Owner/Film-Lab)',
    redistributable: true,
    source: 'S-CV-001 https://github.com/Owner/Film-Lab/releases/download/demo/intro.mp4',
    checked_at: '2026-10-27',
  };
  assert.equal(validateCatalog(catalog).ok, true);
  catalog.resources[0].preview.poster = 'https://film.example/poster.jpg';
  assert.equal(validateCatalog(catalog).ok, true);
  catalog.resources[0].preview.kind = 'embed';
  assert.ok(validateCatalog(catalog).errors.some(error => error.includes('redistributable')));
  catalog.resources[0].preview.redistributable = false;
  catalog.resources[0].preview.notes = 'not a field';
  assert.ok(validateCatalog(catalog).errors.some(error => error.includes('preview.notes')));
  delete catalog.resources[0].preview;
  catalog.resources[0].preview = null;
  assert.ok(validateCatalog(catalog).errors.some(error => error.includes('preview must be an object')));
});

test('GitHub README and default-branch root links do not create duplicate projects', () => {
  const { projects } = fixture();
  const root = urlIdentity('https://github.com/Owner/Film-Lab', projects);
  for (const url of [
    'https://github.com/Owner/Film-Lab#readme',
    'https://github.com/Owner/Film-Lab/tree/main',
    'https://github.com/Owner/Film-Lab/tree/main/#readme',
  ]) assert.equal(urlIdentity(url, projects), root);
  assert.notEqual(urlIdentity('https://github.com/Owner/Film-Lab#examples', projects), root);
  assert.notEqual(urlIdentity('https://github.com/Owner/Film-Lab/tree/main#examples', projects), root);
  assert.notEqual(urlIdentity('https://github.com/Owner/Film-Lab/blob/main/README.md#readme', projects), root);
  assert.notEqual(urlIdentity('https://github.com/Owner/Film-Lab/tree/dev', projects), root);
});

test('GIF media must be image previews and retain redistribution metadata', () => {
  const catalog = fixture();
  for (const url of ['https://film.example/demo.gif', 'https://film.example/DEMO.GIF?raw=1#preview']) {
    catalog.resources[0].preview = {
      kind: 'video', url, license: 'MIT', attribution: 'Film Lab',
      redistributable: true, source: 'S-CV-001 https://film.example/demo.gif', checked_at: '2026-10-27',
    };
    assert.ok(validateCatalog(catalog).errors.some(error => error.includes('GIF previews must use kind thumb_link')));
    catalog.resources[0].preview.kind = 'thumb_link';
    assert.equal(validateCatalog(catalog).ok, true);
    assert.equal(catalog.resources[0].preview.redistributable, true);
  }
});
