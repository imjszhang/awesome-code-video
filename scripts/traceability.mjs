#!/usr/bin/env node
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runTraceabilityCheck } from 'js-traceability/validation';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceId = /^S-CV-\d{3}$/;

/** Check references without changing the catalog or keeping a generated index. */
export async function checkTraceability({ root = defaultRoot, temporaryParent = os.tmpdir() } = {}) {
  const [projects, resources, evidence] = await Promise.all(
    ['projects', 'resources', 'evidence'].map(async (name) => {
      const value = JSON.parse(await readFile(path.join(root, 'data', `${name}.json`), 'utf8'));
      if (!Array.isArray(value) || value.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
        throw new Error(`data/${name}.json must contain an array of objects.`);
      }
      return value;
    }),
  );
  const errors = [];
  const warnings = [];
  const projectIds = new Set(projects.map((project) => project.id));
  const byEvidence = new Map(evidence.map((item) => [item.id, item]));
  const addError = (file, index, message) => errors.push({ engine: 'catalog', file, index, message });

  for (const [index, item] of evidence.entries()) {
    if (!sourceId.test(item.id ?? '')) addError('data/evidence.json', index, `Invalid evidence ID: ${String(item.id)}; expected S-CV-NNN.`);
    if (!projectIds.has(item.project_id)) addError('data/evidence.json', index, `${item.id} refers to an unknown project: ${item.project_id}.`);
  }
  for (const [index, resource] of resources.entries()) {
    if (!projectIds.has(resource.project_id)) addError('data/resources.json', index, `${resource.id} refers to an unknown project: ${resource.project_id}.`);
    if (!Array.isArray(resource.evidence_ids)) {
      addError('data/resources.json', index, `${resource.id} evidence_ids must be an array.`);
      continue;
    }
    if (new Set(resource.evidence_ids).size !== resource.evidence_ids.length) addError('data/resources.json', index, `${resource.id} repeats an evidence ID.`);
    for (const id of resource.evidence_ids) {
      if (typeof id !== 'string' || !sourceId.test(id)) {
        addError('data/resources.json', index, `${resource.id} has an invalid evidence reference: ${String(id)}.`);
        continue;
      }
      const item = byEvidence.get(id);
      // Undefined IDs and empty references are checked by js-traceability below.
      if (!item) continue;
      if (item.project_id !== resource.project_id) addError('data/resources.json', index, `${resource.id} references ${id} from another project (${item.project_id}).`);
      // The package's CSV audit checks ID integrity, not source verification state.
      if (item.status !== 'reviewed') addError('data/resources.json', index, `${resource.id} references ${id}, whose status is ${item.status}; reviewed evidence is required.`);
      if (item.reliability === 'low') warnings.push({ engine: 'catalog', file: 'data/resources.json', index, message: `${resource.id} references low-reliability evidence ${id}; review whether it supports the description.` });
    }
  }

  const temporaryRoot = await mkdtemp(path.join(temporaryParent, 'awesome-code-video-trace-'));
  try {
    await mkdir(path.join(temporaryRoot, 'audit'));
    const sourceRows = [
      '| Source ID | Source title | Type | URL | Reliability | Verification status | Notes |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...evidence.map((item) => `| ${[item.id, item.title, item.type, item.url, item.reliability, item.status, item.notes].map(markdownCell).join(' | ')} |`),
    ];
    const referenceRows = [
      ['Resource', 'Source IDs', 'Status'],
      ...resources.map((resource) => [resource.id, Array.isArray(resource.evidence_ids) ? resource.evidence_ids.join(' ') : '', resource.review?.level ?? 'source-reviewed']),
    ];
    await Promise.all([
      writeFile(path.join(temporaryRoot, 'source-index.md'), `${sourceRows.join('\n')}\n`),
      writeFile(path.join(temporaryRoot, 'audit/resources.csv'), `${referenceRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`),
    ]);
    const audit = await runTraceabilityCheck({
      root: temporaryRoot,
      config: {
        sourceIndexFiles: ['source-index.md'],
        policy: {
          sourceIdPattern: /\bS-CV-\d{3}\b/g,
          sourceRangePattern: /\b(S-CV)-(\d{3})\s+to\s+\1-(\d{3})\b/g,
          lowReliabilityPattern: /^low$/i,
          unverifiedStatusPattern: /^(?!reviewed$).*/i,
          sourceColumnAliases: ['Source IDs'],
          statusColumnAliases: ['Status'],
          labelColumnAliases: ['Resource'],
          sourceIndexColumns: {
            id: ['Source ID'], title: ['Source title'], type: ['Type'], url: ['URL'],
            reliability: ['Reliability'], status: ['Verification status'], notes: ['Notes'],
          },
          // Every catalog resource requires references; finance-oriented numeric
          // heuristics would add noise without increasing that coverage.
          numericClaimDetector: () => false,
          assumptionDetector: () => false,
        },
        paths: {
          traceabilityScanDirs: ['audit'],
          auditCsvFiles: resources.length ? ['audit/resources.csv'] : [],
          deliverableDirs: [],
          workingNumericClaimFiles: [],
        },
      },
    });
    errors.push(...audit.errors.map(remapIssue));
    warnings.push(...audit.warnings.map(remapIssue));
    return {
      ok: errors.length === 0,
      engine: 'js-traceability',
      summary: { projects: projects.length, resources: resources.length, evidence: evidence.length },
      errors,
      warnings,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function remapIssue(issue) {
  const sourceIndex = issue.file === 'source-index.md';
  return {
    engine: 'js-traceability',
    file: sourceIndex ? 'data/evidence.json' : 'data/resources.json',
    index: Number.isInteger(issue.line) ? Math.max(0, issue.line - (sourceIndex ? 3 : 2)) : null,
    message: issue.message,
  };
}

function markdownCell(value) {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function main() {
  const { values } = parseArgs({ options: { root: { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) {
    console.log('Usage: node scripts/traceability.mjs [--root <catalog directory>] [--json]');
    return;
  }
  const audit = await checkTraceability({ root: values.root ? path.resolve(values.root) : defaultRoot });
  if (values.json) console.log(JSON.stringify(audit, null, 2));
  else {
    for (const item of audit.errors) console.error(`ERROR ${item.file}${item.index === null ? '' : `[${item.index}]`}: ${item.message}`);
    for (const item of audit.warnings) console.warn(`WARNING ${item.file}${item.index === null ? '' : `[${item.index}]`}: ${item.message}`);
    console.log(`Reference check ${audit.ok ? 'passed' : 'failed'}: ${audit.summary.resources} resources, ${audit.summary.evidence} evidence records (${audit.errors.length} errors, ${audit.warnings.length} warnings).`);
  }
  process.exitCode = audit.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`Reference check failed: ${error.message}`); process.exitCode = 1; });
}
