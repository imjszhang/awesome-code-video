import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkTraceability } from '../scripts/traceability.mjs';

async function fixture(t, edit = () => {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'catalog-trace-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = {
    projects: [{ id: 'example', name: 'Example' }],
    resources: [{ id: 'scene', project_id: 'example', evidence_ids: ['S-CV-001'], review: { level: 'source-reviewed' } }],
    evidence: [{ id: 'S-CV-001', project_id: 'example', title: 'Original "documentation" | with a pipe', url: 'https://example.com/docs', type: 'documentation', reliability: 'high', status: 'reviewed', notes: 'Source\nnotes.' }],
  };
  edit(data);
  await mkdir(path.join(root, 'data'));
  await mkdir(path.join(root, 'temp'));
  await Promise.all(Object.entries(data).map(([name, values]) => writeFile(path.join(root, 'data', `${name}.json`), JSON.stringify(values))));
  return { root, temporaryParent: path.join(root, 'temp') };
}

test('uses the actual reference checker and leaves source files and temp directory unchanged', async (t) => {
  const options = await fixture(t);
  const before = await readFile(path.join(options.root, 'data/evidence.json'), 'utf8');
  const audit = await checkTraceability(options);
  assert.equal(audit.ok, true);
  assert.equal(audit.engine, 'js-traceability');
  assert.deepEqual(audit.errors, []);
  assert.deepEqual(audit.warnings, []);
  assert.equal(await readFile(path.join(options.root, 'data/evidence.json'), 'utf8'), before);
  assert.deepEqual(await readdir(options.temporaryParent), []);
});

test('undefined evidence ID fails in js-traceability and cleans up temporary files', async (t) => {
  const options = await fixture(t, (data) => { data.resources[0].evidence_ids = ['S-CV-999']; });
  const audit = await checkTraceability(options);
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => issue.engine === 'js-traceability' && /S-CV-999/.test(issue.message)));
  assert.deepEqual(await readdir(options.temporaryParent), []);
});

test('unreviewed evidence cannot support a published resource', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => { data.evidence[0].status = 'unverified'; }));
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => /reviewed evidence is required/.test(issue.message)));
});

test('shared evidence can support several resources in the same project', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => { data.resources.push({ ...data.resources[0], id: 'another-scene' }); }));
  assert.equal(audit.ok, true);
  assert.equal(audit.summary.resources, 2);
});

test('blank evidence references fail in js-traceability', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => { data.resources[0].evidence_ids = []; }));
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => issue.engine === 'js-traceability' && /no concrete source ID/.test(issue.message)));
});

test('duplicate evidence definitions fail in js-traceability', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => { data.evidence.push({ ...data.evidence[0] }); }));
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => issue.engine === 'js-traceability' && /defined 2 times/.test(issue.message)));
});

test('cross-project evidence is rejected even when its ID exists', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => {
    data.projects.push({ id: 'other', name: 'Other' });
    data.evidence[0].project_id = 'other';
  }));
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => /another project/.test(issue.message)));
});

test('malformed IDs and missing reference arrays do not silently pass', async (t) => {
  const audit = await checkTraceability(await fixture(t, (data) => {
    data.evidence[0].id = 'source-one';
    delete data.resources[0].evidence_ids;
  }));
  assert.equal(audit.ok, false);
  assert(audit.errors.some((issue) => /Invalid evidence ID/.test(issue.message)));
  assert(audit.errors.some((issue) => /must be an array/.test(issue.message)));
});
