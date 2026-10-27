#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addCandidate, CANDIDATE_STATUSES, findMatches, loadCatalog, updateCandidate, validateCatalog } from './lib/catalog.mjs';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `Catalog maintenance

  node scripts/catalog.mjs check
  node scripts/catalog.mjs find <URL, name, alias, or github:repository-id>
  node scripts/catalog.mjs candidate add <URL> --name "Resource name"
  node scripts/catalog.mjs candidate list [--status pending]
  node scripts/catalog.mjs candidate status <ID> <status> --reason "Why" [--resource ID] [--resolved-url URL]

Statuses: ${CANDIDATE_STATUSES.join(', ')}.
Use --json for machine-readable output and --root <directory> for an isolated catalog.
Optional --evidence S-CV-001,S-CV-002 attaches existing evidence to a candidate.
Accepted candidates must refer to an already-reviewed catalog resource; accepting never publishes or creates one.
`;

function parse(argv) {
  const flags = {};
  const positional = [];
  const valued = new Set(['root', 'name', 'status', 'reason', 'resource', 'evidence', 'resolved-url']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json' || arg === '--help' || arg === '-h') flags[arg === '--json' ? 'json' : 'help'] = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!valued.has(key)) throw new Error(`Unknown option: ${arg}`);
      if (flags[key] !== undefined) throw new Error(`Repeated option: ${arg}`);
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
      flags[key] = argv[++i];
    } else positional.push(arg);
  }
  return { flags, positional };
}

function display(result) {
  if (result.counts) {
    console.log(`Catalog: ${Object.entries(result.counts).map(([key, value]) => `${value} ${key}`).join(', ')}.`);
    for (const error of result.errors) console.error(`ERROR ${error}`);
    for (const warning of result.warnings) console.warn(`WARNING ${warning}`);
    if (result.ok) console.log('Catalog integrity checks passed.');
  } else if (result.action) {
    console.log(result.action === 'already-listed' ? `Already listed: ${result.resource.id} — ${result.resource.name}. No candidate was added.` : `${result.action}: ${result.candidate.id} — ${result.candidate.name} [${result.candidate.status}].`);
    if (result.candidate?.reason) console.log(`Reason: ${result.candidate.reason}`);
    if (result.project) console.log(`Related project: ${result.project.id} — ${result.project.name}.`);
  } else {
    for (const key of ['projects', 'resources', 'related_resources', 'candidates', 'evidence']) {
      if (!result[key]) continue;
      console.log(`${key === 'related_resources' ? 'Other resources in this project (not exact URL matches)' : key}: ${result[key].length}`);
      for (const entry of result[key]) {
        console.log(`  ${entry.id} — ${entry.name ?? entry.title}${entry.status ? ` [${entry.status}]` : ''}${entry.reason ? ` — ${entry.reason}` : ''}`);
        console.log(`    ${entry.url}`);
        if (entry.resolved_url) console.log(`    Resolved to: ${entry.resolved_url}`);
        if (entry.review) console.log(`    ${entry.review.level} on ${entry.review.reviewed_at}; evidence: ${entry.evidence_ids.join(', ')}`);
      }
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  const { flags, positional } = parse(argv);
  if (flags.help || !positional.length) { console.log(HELP); return 0; }
  const root = flags.root ? path.resolve(flags.root) : DEFAULT_ROOT;
  const [command, subcommand, ...args] = positional;
  let result;
  if (command === 'check' && !subcommand) result = validateCatalog(await loadCatalog(root));
  else if (command === 'find' && subcommand) result = findMatches(await loadCatalog(root), [subcommand, ...args].join(' '));
  else if (command === 'candidate' && subcommand === 'add' && args.length === 1) result = await addCandidate(root, { url: args[0], name: flags.name, evidence_ids: flags.evidence?.split(',').map(value => value.trim()).filter(Boolean) ?? [] });
  else if (command === 'candidate' && subcommand === 'list' && args.length === 0) {
    if (flags.status && !CANDIDATE_STATUSES.includes(flags.status)) throw new Error(`Unsupported status: ${flags.status}`);
    const catalog = await loadCatalog(root);
    result = { candidates: catalog.candidates.filter(entry => !flags.status || entry.status === flags.status) };
  } else if (command === 'candidate' && subcommand === 'status' && args.length === 2) result = await updateCandidate(root, { id: args[0], status: args[1], reason: flags.reason, resource_id: flags.resource, resolved_url: flags['resolved-url'], evidence_ids: flags.evidence === undefined ? undefined : flags.evidence.split(',').map(value => value.trim()).filter(Boolean) });
  else throw new Error(`Unknown or incomplete command.\n${HELP}`);
  if (flags.json) console.log(JSON.stringify(result, null, 2));
  else display(result);
  return result.ok === false ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await main(); }
  catch (error) {
    if (process.argv.includes('--json')) console.error(JSON.stringify({ error: error.message }));
    else console.error(error.message);
    process.exitCode = 1;
  }
}
