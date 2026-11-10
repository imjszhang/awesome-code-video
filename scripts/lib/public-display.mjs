import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rulePath = path.join(root, 'data/public-display-isolation.json');

/** Public-display rule. Inventory files stay complete; public renderers omit this project. */
export const isolationRule = Object.freeze(JSON.parse(readFileSync(rulePath, 'utf8')));

if (isolationRule.purpose !== 'public-display-isolation' || typeof isolationRule.resource_project_id !== 'string' || !isolationRule.resource_project_id) {
  throw new Error('data/public-display-isolation.json must name a resource_project_id for public-display isolation.');
}

export const CORE_KINDS = new Set(['film', 'scene', 'preset', 'shot', 'style']);

export function isIsolatedResource(resource) {
  return resource?.project_id === isolationRule.resource_project_id;
}

export function isIsolatedProject(project) {
  return project?.id === isolationRule.resource_project_id;
}

export function publicResources(resources) {
  return resources.filter((resource) => !isIsolatedResource(resource));
}

/** Project pages exist only for projects that still have a publicly displayed resource. */
export function publicProjects(projects, resources) {
  const visible = new Set(publicResources(resources).map((resource) => resource.project_id));
  return projects.filter((project) => !isIsolatedProject(project) && visible.has(project.id));
}

export function publicCategoryCounts(resources) {
  const listed = publicResources(resources);
  return {
    core: listed.filter((resource) => CORE_KINDS.has(resource.kind)).length,
    filmAndScene: listed.filter((resource) => resource.kind === 'film' || resource.kind === 'scene').length,
    maps: listed.filter((resource) => resource.kind === 'preset').length,
    shots: listed.filter((resource) => resource.kind === 'shot').length,
    styles: listed.filter((resource) => resource.kind === 'style').length,
  };
}

/** Bundled poster filenames for isolated resources. Reads the inventory, not the public subset. */
export function isolatedPosterBasenames(resources) {
  const names = [];
  for (const resource of resources) {
    if (!isIsolatedResource(resource)) continue;
    const poster = resource.preview?.poster;
    if (typeof poster !== 'string' || !/^\/previews\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(poster)) {
      throw new Error(`Isolated resource ${resource?.id ?? '(missing id)'} has no bundled /previews/<id>.webp poster.`);
    }
    names.push(poster.slice('/previews/'.length));
  }
  return names;
}

let isolatedIds;
function isolatedResourceIds() {
  if (!isolatedIds) {
    const resources = JSON.parse(readFileSync(path.join(root, 'data/resources.json'), 'utf8'));
    isolatedIds = new Set(resources.filter(isIsolatedResource).map((resource) => resource.id));
  }
  return isolatedIds;
}

function parseJsonModule(code) {
  const trimmed = String(code).trim();
  if (trimmed.startsWith('export default')) {
    return { asModule: true, value: JSON.parse(trimmed.replace(/^export default\s*/, '').replace(/;\s*$/, '')) };
  }
  return { asModule: false, value: JSON.parse(trimmed) };
}

/**
 * Drop isolated catalog rows from a JSON module before it is shipped in the site bundle.
 * Returns null when the file is not a catalog module the isolation rule owns.
 */
export function filterCatalogModule(filename, code) {
  const name = path.basename(String(filename).split('?')[0]);
  if (!['resources.json', 'projects.json', 'evidence.json', 'preview-posters.json'].includes(name)) return null;
  let parsed;
  try { parsed = parseJsonModule(code); }
  catch { return null; }
  if (!Array.isArray(parsed.value)) return null;
  let rows = parsed.value;
  if (name === 'resources.json') rows = rows.filter((row) => !isIsolatedResource(row));
  else if (name === 'projects.json') rows = rows.filter((row) => !isIsolatedProject(row));
  else if (name === 'evidence.json') rows = rows.filter((row) => row?.project_id !== isolationRule.resource_project_id);
  else rows = rows.filter((row) => !isolatedResourceIds().has(row?.resource_id));
  const json = JSON.stringify(rows);
  return parsed.asModule ? `export default ${json}\n` : json;
}
