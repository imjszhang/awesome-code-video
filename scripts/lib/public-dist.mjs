import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.json', '.xml', '.txt', '.css', '.svg']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

/** Remove isolated poster files Vite copied from web/public into dist. Repository files are untouched. */
export async function stripIsolatedPosters(distDir, basenames) {
  let removed = 0;
  const missing = [];
  for (const name of basenames) {
    try {
      await rm(path.join(distDir, 'previews', name));
      removed += 1;
    } catch (error) {
      if (error?.code === 'ENOENT') missing.push(name);
      else throw error;
    }
  }
  return { removed, missing };
}

/**
 * Fail when a built site still lists isolated resources, their project page,
 * their poster files, or their upstream URLs.
 */
export async function assertPublicDist(distDir, { resourceIds, projectId, posterBasenames }) {
  const errors = [];
  const ids = new Set(resourceIds);
  const posters = new Set(posterBasenames);
  let files;
  try { files = await walk(distDir); }
  catch (error) { throw new Error(`Cannot read built site at ${distDir}: ${error.message}`); }

  for (const file of files) {
    const rel = path.relative(distDir, file);
    const base = path.basename(file);
    if (base.endsWith('.webp') && (posters.has(base) || base.startsWith('freelancer-'))) errors.push(`isolated poster in dist: ${rel}`);
    const resourcePage = rel.match(/^resources\/([^/]+)\/index\.html$/);
    if (resourcePage && ids.has(resourcePage[1])) errors.push(`isolated resource page in dist: ${rel}`);
    if (rel === path.join('projects', projectId, 'index.html')) errors.push(`isolated project page in dist: ${rel}`);
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    const text = await readFile(file, 'utf8');
    if (text.includes('freelancer-templates.org') || text.includes('linda-mhmd/freelancer-templates.org')) errors.push(`${rel} contains the isolated upstream URL`);
    if (text.includes(`projects/${projectId}/`) || text.includes(`projects/${projectId}"`)) errors.push(`${rel} links the isolated project`);
    for (const id of ids) {
      if (text.includes(id)) {
        errors.push(`${rel} contains isolated resource ${id}`);
        break;
      }
    }
  }

  const catalogPath = path.join(distDir, 'data', 'catalog.json');
  try {
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    const listedIds = new Set((catalog.resources ?? []).map((resource) => resource.id));
    for (const id of ids) if (listedIds.has(id)) errors.push(`dist/data/catalog.json still lists ${id}`);
    if ((catalog.projects ?? []).some((project) => project.id === projectId)) errors.push('dist/data/catalog.json still lists the isolated project');
    const joined = JSON.stringify(catalog);
    if (joined.includes('freelancer-templates.org') || joined.includes('linda-mhmd/freelancer-templates')) errors.push('dist/data/catalog.json contains the isolated upstream URL');
  } catch (error) {
    if (error?.code === 'ENOENT') errors.push('dist/data/catalog.json is missing');
    else if (!String(error?.message || '').startsWith('dist/data/catalog.json')) throw error;
  }

  if (errors.length) throw new Error(`Public dist isolation failed:\n${errors.slice(0, 40).join('\n')}`);
}
