import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const RESOURCE_KINDS = Object.freeze(['film', 'scene', 'preset', 'shot', 'style', 'framework', 'tool', 'workflow', 'collection']);
export const CANDIDATE_STATUSES = Object.freeze(['pending', 'researching', 'accepted', 'rejected', 'duplicate', 'deferred']);
const SECTIONS = new Map([
  ['film-and-scene-templates', ['film', 'scene']],
  ['map-animation-presets', ['preset']],
  ['shot-recipes', ['shot']],
  ['visual-style-templates', ['style']],
  ['frameworks-and-renderers', ['framework']],
  ['motion-design-tools', ['tool']],
  ['production-workflows', ['workflow']],
  ['related-lists', ['collection']],
]);
const TRACKING = /^(utm_.+|gclid|fbclid|dclid|msclkid|mc_cid|mc_eid|ref_src)$/i;
const PREVIEW_KINDS = Object.freeze(['video', 'embed', 'thumb_link']);
const PREVIEW_FIELDS = Object.freeze(['kind', 'url', 'poster', 'license', 'attribution', 'redistributable', 'source', 'checked_at']);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_ID = /^S-CV-\d{3}$/;
const TEXT = value => typeof value === 'string' && value.trim().length > 0;
const DAY = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const TIMESTAMP = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));

/** Normalize transport and tracking, never discard meaningful paths, queries, or fragments. */
export function normalizeUrl(input) {
  if (!TEXT(input)) throw new Error('A nonempty resource URL is required.');
  let value = input.trim();
  if (/^git@github\.com:/i.test(value)) value = value.replace(/^git@github\.com:/i, 'https://github.com/');
  if (/^ssh:\/\/git@github\.com\//i.test(value)) value = value.replace(/^ssh:\/\/git@github\.com\//i, 'https://github.com/');
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`Invalid URL: ${value}`); }
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Only HTTP(S) URLs and GitHub Git clone URLs are supported.');
  if (parsed.username || parsed.password) throw new Error('URLs containing credentials are not allowed.');
  if (parsed.hostname === 'www.github.com') parsed.hostname = 'github.com';
  if (['github.com', 'raw.githubusercontent.com', 'api.github.com'].includes(parsed.hostname)) parsed.protocol = 'https:';
  for (const key of [...parsed.searchParams.keys()]) if (TRACKING.test(key)) parsed.searchParams.delete(key);
  parsed.searchParams.sort();
  let pathname = parsed.pathname.replace(/\/+$/, '');
  if (['github.com', 'raw.githubusercontent.com'].includes(parsed.hostname)) {
    const pieces = pathname.split('/');
    if (pieces[1]) pieces[1] = pieces[1].toLowerCase();
    if (pieces[2]) pieces[2] = pieces[2].replace(/\.git$/i, '').toLowerCase();
    pathname = pieces.join('/');
  }
  return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
}

function githubSlug(url) {
  const parsed = new URL(normalizeUrl(url));
  if (!['github.com', 'raw.githubusercontent.com'].includes(parsed.hostname)) return null;
  const pieces = parsed.pathname.split('/').filter(Boolean);
  return pieces.length >= 2 ? pieces.slice(0, 2).join('/') : null;
}

function projectSlugs(project) {
  const slugs = new Set();
  if (TEXT(project.github?.full_name)) slugs.add(project.github.full_name.toLowerCase());
  for (const url of [project.url, ...(Array.isArray(project.urls) ? project.urls : [])]) {
    try { const slug = githubSlug(url); if (slug) slugs.add(slug); } catch { /* Validation reports malformed stored URLs. */ }
  }
  return slugs;
}

export function projectForUrl(input, projects = []) {
  const normalized = normalizeUrl(input);
  const parsed = new URL(normalized);
  const apiId = parsed.hostname === 'api.github.com' && parsed.pathname.match(/^\/repositories\/(\d+)\/?$/)?.[1];
  if (apiId) return projects.find(project => String(project.github?.id) === apiId) ?? null;
  const slug = githubSlug(normalized);
  if (slug) return projects.find(project => projectSlugs(project).has(slug)) ?? null;
  return projects.find(project => [project.url, ...(project.urls ?? [])].some(url => {
    try {
      const base = new URL(normalizeUrl(url));
      return base.origin === parsed.origin && (base.pathname === '/' || parsed.pathname === base.pathname || parsed.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/`));
    } catch { return false; }
  })) ?? null;
}

function projectKey(project, fallback) {
  return project?.github?.id ? `github:${project.github.id}` : project ? `project:${project.id}` : `github:${fallback}`;
}

/** Offline identity: known aliases map to a repository ID; unknown renames need an explicit alias update. */
export function urlIdentity(input, projects = []) {
  const normalized = normalizeUrl(input);
  const parsed = new URL(normalized);
  const project = projectForUrl(normalized, projects);
  const suffix = `${parsed.search}${parsed.hash}`;
  if (parsed.hostname === 'api.github.com' && /^\/repositories\/\d+$/.test(parsed.pathname) && project) return `${projectKey(project)}${suffix}`;
  const slug = githubSlug(normalized);
  if (slug) {
    const parts = parsed.pathname.split('/').filter(Boolean);
    const key = projectKey(project, slug);
    const tail = parts.slice(2);
    if (!tail.length) return `${key}${parsed.search}${parsed.hash.toLowerCase() === '#readme' ? '' : parsed.hash}`;
    const action = parsed.hostname === 'raw.githubusercontent.com' ? 'raw' : tail.shift();
    if (['blob', 'tree', 'raw'].includes(action)) {
      const rawTail = tail.join('/');
      const branch = project?.github?.default_branch;
      if (branch && (rawTail === branch || rawTail.startsWith(`${branch}/`))) {
        const file = rawTail.slice(branch.length).replace(/^\//, '');
        if (!file && action === 'tree') return `${key}${parsed.search}${parsed.hash.toLowerCase() === '#readme' ? '' : parsed.hash}`;
        return `${key}/path/${file}${suffix}`;
      }
      // Without a known default branch we cannot safely equate different refs.
      // Blob and raw views are still equivalent for the same explicitly named ref.
      return `${key}/ref/${rawTail}${suffix}`;
    }
    return `${key}/${action}${tail.length ? `/${tail.join('/')}` : ''}${suffix}`;
  }
  if (project && [project.url, ...(project.urls ?? [])].some(url => {
    try { return normalizeUrl(url) === normalized; } catch { return false; }
  })) return projectKey(project);
  return normalized;
}

export async function loadCatalog(root) {
  const files = { projects: 'data/projects.json', resources: 'data/resources.json', evidence: 'data/evidence.json', candidates: 'research/candidates.json' };
  const catalog = {};
  await Promise.all(Object.entries(files).map(async ([key, file]) => {
    let parsed;
    try { parsed = JSON.parse(await fs.readFile(path.join(root, file), 'utf8')); }
    catch (error) { throw new Error(`Cannot read ${file}: ${error.message}`); }
    if (!Array.isArray(parsed)) throw new Error(`${file} must contain a JSON array.`);
    catalog[key] = parsed;
  }));
  return catalog;
}

function normalizedSection(value) { return String(value ?? '').toLowerCase().replaceAll(' ', '-'); }
function requireValid(catalog) {
  const result = validateCatalog(catalog);
  if (!result.ok) throw new Error(`Catalog validation failed:\n${result.errors.join('\n')}`);
}

/** Gallery preview metadata only. Never accept a vendored media file as this object. */
function validatePreview(preview, label, url, errors) {
  if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
    errors.push(`${label}: preview must be an object.`);
    return;
  }
  for (const key of Object.keys(preview)) {
    if (!PREVIEW_FIELDS.includes(key)) errors.push(`${label}: preview.${key} is not a preview field.`);
  }
  if (!PREVIEW_KINDS.includes(preview.kind)) errors.push(`${label}: preview.kind must be video, embed, or thumb_link.`);
  if (typeof preview.url !== 'string' || !preview.url.startsWith('https://')) errors.push(`${label}: preview.url must be an https URL.`);
  else url(preview.url, `${label} preview`);
  if (preview.kind === 'video' && typeof preview.url === 'string') {
    try {
      if (/\.gif$/i.test(new URL(preview.url).pathname)) errors.push(`${label}: GIF previews must use kind thumb_link, not video.`);
    } catch { /* Invalid URLs are reported above. */ }
  }
  if (Object.hasOwn(preview, 'poster')) {
    if (typeof preview.poster !== 'string' || !preview.poster.startsWith('https://')) errors.push(`${label}: preview.poster must be an https URL or be omitted.`);
    else url(preview.poster, `${label} preview poster`);
  }
  for (const field of ['license', 'attribution', 'source']) {
    if (!TEXT(preview[field])) errors.push(`${label}: preview.${field} is required.`);
  }
  if (typeof preview.redistributable !== 'boolean') errors.push(`${label}: preview.redistributable must be true or false.`);
  else if (preview.redistributable === true && preview.kind === 'embed') errors.push(`${label}: a redistributable preview must use kind video or thumb_link.`);
  if (!DAY(preview.checked_at)) errors.push(`${label}: preview.checked_at must be YYYY-MM-DD.`);
}

export function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];
  const arrays = ['projects', 'resources', 'evidence', 'candidates'];
  for (const key of arrays) if (!Array.isArray(catalog[key])) errors.push(`${key} must be an array.`);
  if (errors.length) return { ok: false, errors, warnings, counts: {} };
  const { projects, resources, evidence, candidates } = catalog;
  const maps = {};
  for (const key of arrays) {
    maps[key] = new Map();
    for (const record of catalog[key]) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) { errors.push(`${key}: every record must be an object.`); continue; }
      if (!TEXT(record.id)) errors.push(`${key}: missing id.`);
      else if (maps[key].has(record.id)) errors.push(`${key}: duplicate id ${record.id}.`);
      maps[key].set(record.id, record);
    }
  }
  const safeProjects = projects.filter(record => record && typeof record === 'object' && !Array.isArray(record));
  const unique = (seen, key, id, label) => {
    if (seen.has(key)) errors.push(`${label}: ${id} duplicates ${seen.get(key)}.`);
    else seen.set(key, id);
  };
  const url = (value, label) => {
    try { return normalizeUrl(value); } catch (error) { errors.push(`${label}: ${error.message}`); return null; }
  };
  const projectUrls = new Map();
  const repositoryIds = new Map();
  for (const project of safeProjects) {
    const label = `project ${project.id}`;
    if (!ID.test(project.id)) errors.push(`${label}: id must be a lowercase slug.`);
    if (!TEXT(project.name)) errors.push(`${label}: name is required.`);
    if (!Array.isArray(project.aliases) || project.aliases.some(alias => !TEXT(alias))) errors.push(`${label}: aliases must be an array of nonempty names.`);
    if (!Array.isArray(project.urls)) errors.push(`${label}: urls must be an array.`);
    if (project.identity_checked_at != null && !DAY(project.identity_checked_at)) errors.push(`${label}: invalid identity_checked_at.`);
    const allUrls = new Set([project.url, ...(Array.isArray(project.urls) ? project.urls : [])]);
    for (const value of allUrls) {
      const normalized = url(value, label);
      if (normalized) unique(projectUrls, normalized, project.id, 'Project URL');
    }
    if (project.github != null) {
      if (!Number.isSafeInteger(project.github.id) || project.github.id <= 0) errors.push(`${label}: github.id must be a positive integer.`);
      else unique(repositoryIds, project.github.id, project.id, 'GitHub repository ID');
      if (!/^[^/\s]+\/[^/\s]+$/.test(project.github.full_name ?? '')) errors.push(`${label}: github.full_name must be owner/repository.`);
      if (!TEXT(project.github.default_branch)) errors.push(`${label}: github.default_branch is required.`);
    }
  }
  for (const entry of maps.evidence.values()) {
    const label = `evidence ${entry.id}`;
    if (!SOURCE_ID.test(entry.id)) errors.push(`${label}: use S-CV- followed by exactly three digits.`);
    if (!maps.projects.has(entry.project_id)) errors.push(`${label}: unknown project_id ${entry.project_id}.`);
    for (const field of ['title', 'type', 'notes']) if (!TEXT(entry[field])) errors.push(`${label}: ${field} is required.`);
    url(entry.url, label);
    if (!['reviewed', 'unverified'].includes(entry.status)) errors.push(`${label}: unsupported status.`);
    if (!['high', 'medium', 'low'].includes(entry.reliability)) errors.push(`${label}: unsupported reliability.`);
    if (entry.status === 'reviewed' && !DAY(entry.checked_at)) errors.push(`${label}: reviewed evidence needs checked_at (YYYY-MM-DD).`);
    if (entry.status === 'unverified' && entry.checked_at != null && !DAY(entry.checked_at)) errors.push(`${label}: invalid checked_at.`);
  }
  const resourceUrls = new Map();
  for (const resource of maps.resources.values()) {
    const label = `resource ${resource.id}`;
    if (!ID.test(resource.id)) errors.push(`${label}: id must be a lowercase slug.`);
    if (!maps.projects.has(resource.project_id)) errors.push(`${label}: unknown project_id ${resource.project_id}.`);
    for (const field of ['name', 'description']) if (!TEXT(resource[field])) errors.push(`${label}: ${field} is required.`);
    if (!RESOURCE_KINDS.includes(resource.kind)) errors.push(`${label}: unsupported kind ${resource.kind}.`);
    const allowed = SECTIONS.get(normalizedSection(resource.section));
    if (!allowed || !allowed.includes(resource.kind)) errors.push(`${label}: section does not match kind.`);
    if (url(resource.url, label)) {
      unique(resourceUrls, urlIdentity(resource.url, safeProjects), resource.id, 'Resource URL');
      const owner = projectForUrl(resource.url, safeProjects);
      if (!owner) errors.push(`${label}: URL is outside the project's recorded URLs; add its official host/path alias first.`);
      else if (owner.id !== resource.project_id) errors.push(`${label}: URL belongs to project ${owner.id}, not ${resource.project_id}.`);
    }
    if (!resource.review || !['source-reviewed', 'render-tested'].includes(resource.review.level) || !DAY(resource.review.reviewed_at) || typeof resource.review.render_tested !== 'boolean') errors.push(`${label}: review must record level, reviewed_at, and render_tested.`);
    else if ((resource.review.level === 'render-tested') !== resource.review.render_tested) errors.push(`${label}: review level and render_tested disagree.`);
    if (!Array.isArray(resource.evidence_ids) || !resource.evidence_ids.length) errors.push(`${label}: at least one evidence_id is required.`);
    else {
      if (new Set(resource.evidence_ids).size !== resource.evidence_ids.length) errors.push(`${label}: repeated evidence_ids.`);
      for (const id of resource.evidence_ids) {
        const source = maps.evidence.get(id);
        if (!source) errors.push(`${label}: unknown evidence_id ${id}.`);
        else {
          if (source.project_id !== resource.project_id) errors.push(`${label}: evidence ${id} belongs to a different project.`);
          if (source.status !== 'reviewed') errors.push(`${label}: evidence ${id} has not been reviewed.`);
        }
      }
    }
    if (Object.hasOwn(resource, 'preview')) validatePreview(resource.preview, label, url, errors);
  }
  const candidateUrls = new Map();
  for (const candidate of maps.candidates.values()) {
    const label = `candidate ${candidate.id}`;
    if (!/^C-[A-Za-z0-9-]+$/.test(candidate.id)) errors.push(`${label}: invalid candidate id.`);
    if (!TEXT(candidate.name)) errors.push(`${label}: name is required.`);
    if (!CANDIDATE_STATUSES.includes(candidate.status)) errors.push(`${label}: unsupported status.`);
    const candidateIdentities = new Set();
    for (const value of [candidate.url, ...(candidate.resolved_url != null ? [candidate.resolved_url] : [])]) {
      if (url(value, label)) candidateIdentities.add(urlIdentity(value, safeProjects));
    }
    for (const identity of candidateIdentities) unique(candidateUrls, identity, candidate.id, 'Candidate URL');
    if (['rejected', 'deferred', 'duplicate'].includes(candidate.status) && !TEXT(candidate.reason)) errors.push(`${label}: ${candidate.status} requires a reason.`);
    if (!TIMESTAMP(candidate.created_at) || !TIMESTAMP(candidate.updated_at) || Date.parse(candidate.updated_at) < Date.parse(candidate.created_at)) errors.push(`${label}: invalid creation/update timestamps.`);
    if (candidate.resource_id != null && !maps.resources.has(candidate.resource_id)) errors.push(`${label}: unknown resource_id ${candidate.resource_id}.`);
    if (candidate.status === 'duplicate' && !candidate.resource_id) errors.push(`${label}: duplicate requires a target resource_id.`);
    if (!['accepted', 'duplicate'].includes(candidate.status) && candidate.resource_id != null) errors.push(`${label}: resource_id is reserved for accepted or duplicate resolutions.`);
    if (['pending', 'researching', 'deferred'].includes(candidate.status)) {
      try {
        const listed = resourceUrls.get(urlIdentity(candidate.resolved_url || candidate.url, safeProjects));
        if (listed) warnings.push(`${label}: matches listed resource ${listed}; resolve the candidate as accepted or duplicate.`);
      } catch { /* URL error is already reported. */ }
    }
    if (!Array.isArray(candidate.evidence_ids)) errors.push(`${label}: evidence_ids must be an array.`);
    else for (const id of candidate.evidence_ids) if (!maps.evidence.has(id)) errors.push(`${label}: unknown evidence_id ${id}.`);
    if (candidate.status === 'accepted') {
      const resource = maps.resources.get(candidate.resource_id);
      if (!resource) errors.push(`${label}: accepted requires a real resource_id.`);
      else {
        try { if (urlIdentity(candidate.resolved_url || candidate.url, safeProjects) !== urlIdentity(resource.url, safeProjects)) errors.push(`${label}: accepted resource does not match candidate URL.`); } catch { /* URL error is already reported. */ }
        if (!Array.isArray(candidate.evidence_ids) || !candidate.evidence_ids.length) errors.push(`${label}: accepted requires reviewed evidence.`);
        else for (const id of candidate.evidence_ids) {
          const source = maps.evidence.get(id);
          if (source && (source.status !== 'reviewed' || source.project_id !== resource.project_id)) errors.push(`${label}: accepted evidence ${id} is unreviewed or belongs to another project.`);
        }
      }
    }
    if (!Array.isArray(candidate.history) || !candidate.history.length) errors.push(`${label}: status history is required.`);
    else {
      let previous = null;
      let previousResolution = null;
      let previousAt = Date.parse(candidate.created_at);
      for (const event of candidate.history) {
        if (!event || event.from !== previous || !CANDIDATE_STATUSES.includes(event.to) || !TIMESTAMP(event.at) || Date.parse(event.at) < previousAt || !TEXT(event.reason)) errors.push(`${label}: invalid status history.`);
        if (event?.resolution) {
          if (event.resolution.from !== previousResolution) errors.push(`${label}: resolution history is discontinuous.`);
          if (event.resolution.from != null) url(event.resolution.from, `${label} resolution history`);
          url(event.resolution.to, `${label} resolution history`);
          previousResolution = event.resolution.to;
        }
        previous = event?.to;
        previousAt = Date.parse(event?.at);
      }
      if (previousResolution !== (candidate.resolved_url ?? null)) errors.push(`${label}: resolution history does not match resolved_url.`);
      if (candidate.history[0].at !== candidate.created_at) errors.push(`${label}: first history timestamp must match created_at.`);
      if (previous !== candidate.status || candidate.history.at(-1).at !== candidate.updated_at) errors.push(`${label}: history does not match current status/update time.`);
    }
  }
  return { ok: !errors.length, errors, warnings, counts: Object.fromEntries(arrays.map(key => [key, catalog[key].length])) };
}

function enrichMatches(result, catalog) {
  const related = result.type === 'url' ? catalog.resources.filter(resource => result.projects.some(project => project.id === resource.project_id) && !result.resources.some(exact => exact.id === resource.id)) : [];
  const ids = new Set([...result.resources, ...related, ...result.candidates].flatMap(entry => entry.evidence_ids ?? []));
  return { ...result, related_resources: related, evidence: catalog.evidence.filter(entry => ids.has(entry.id)) };
}

export function findMatches(catalog, query) {
  const { projects = [], resources = [], candidates = [] } = catalog;
  const value = String(query ?? '').trim();
  if (!value) throw new Error('Provide a URL, project alias, resource name, or repository ID.');
  const numeric = value.match(/^(?:github:)?(\d+)$/);
  if (numeric) {
    const matchedProjects = projects.filter(project => String(project.github?.id) === numeric[1]);
    const ids = new Set(matchedProjects.map(project => project.id));
    return enrichMatches({ query: value, type: 'repository-id', projects: matchedProjects, resources: resources.filter(resource => ids.has(resource.project_id)), candidates: candidates.filter(candidate => ids.has(projectForUrl(candidate.resolved_url || candidate.url, projects)?.id)) }, catalog);
  }
  if (/^(?:[a-z][a-z0-9+.-]*:|git@)/i.test(value)) {
    const normalized = normalizeUrl(value);
    const identity = urlIdentity(normalized, projects);
    const matchedCandidates = candidates.filter(candidate => [candidate.url, candidate.resolved_url].filter(Boolean).some(url => urlIdentity(url, projects) === identity));
    const project = projectForUrl(normalized, projects) ?? projectForCandidate(matchedCandidates[0], projects);
    return enrichMatches({ query: value, type: 'url', normalized_url: normalized, identity, projects: project ? [project] : [], resources: resources.filter(resource => urlIdentity(resource.url, projects) === identity), candidates: matchedCandidates }, catalog);
  }
  const needle = value.toLowerCase();
  const matchedProjects = projects.filter(project => [project.id, project.name, project.github?.full_name, ...(project.aliases ?? [])].filter(Boolean).some(text => text.toLowerCase().includes(needle)));
  const ids = new Set(matchedProjects.map(project => project.id));
  return enrichMatches({
    query: value,
    type: 'text',
    projects: matchedProjects,
    resources: resources.filter(resource => ids.has(resource.project_id) || [resource.id, resource.name, resource.description, resource.url, ...(resource.evidence_ids ?? [])].some(text => String(text).toLowerCase().includes(needle))),
    candidates: candidates.filter(candidate => [candidate.id, candidate.name, candidate.reason, candidate.url, candidate.resolved_url, ...(candidate.evidence_ids ?? [])].some(text => String(text ?? '').toLowerCase().includes(needle))),
  }, catalog);
}

function projectForCandidate(candidate, projects) {
  return candidate ? projectForUrl(candidate.resolved_url || candidate.url, projects) : null;
}

async function withCandidateLock(root, operation) {
  const file = path.join(root, 'research/.candidates.lock');
  let handle;
  try { handle = await fs.open(file, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Candidate registry is locked by another writer. Retry after it finishes; inspect a stale lock before removing it.');
    throw error;
  }
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid, created_at: new Date().toISOString() }));
    return await operation();
  } finally {
    await handle.close();
    await fs.unlink(file);
  }
}

async function saveCandidates(root, candidates) {
  const destination = path.join(root, 'research/candidates.json');
  const temporary = path.join(root, `research/.candidates-${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, `${JSON.stringify(candidates, null, 2)}\n`, { flag: 'wx' });
    await fs.rename(temporary, destination);
  } finally { await fs.rm(temporary, { force: true }); }
}

export async function addCandidate(root, { url, name, evidence_ids = [] }) {
  const normalized = normalizeUrl(url);
  if (!TEXT(name)) throw new Error('A candidate name is required.');
  return withCandidateLock(root, async () => {
    const catalog = await loadCatalog(root);
    requireValid(catalog);
    const matches = findMatches(catalog, normalized);
    if (matches.resources.length) return { action: 'already-listed', resource: matches.resources[0], candidate: matches.candidates[0] ?? null, project: matches.projects[0] ?? null };
    if (matches.candidates.length) return { action: 'already-candidate', candidate: matches.candidates[0], project: matches.projects[0] ?? null };
    const at = new Date().toISOString();
    const candidate = {
      id: `C-${createHash('sha256').update(matches.identity).digest('hex').slice(0, 12)}`,
      url: normalized,
      name: name.trim(),
      status: 'pending',
      reason: '',
      resource_id: null,
      evidence_ids,
      created_at: at,
      updated_at: at,
      history: [{ at, from: null, to: 'pending', reason: 'Added for review.' }],
    };
    catalog.candidates.push(candidate);
    requireValid(catalog);
    await saveCandidates(root, catalog.candidates);
    return { action: 'added', candidate, project: matches.projects[0] ?? null };
  });
}

export async function updateCandidate(root, { id, status, reason, resource_id, evidence_ids, resolved_url }) {
  const resolved = resolved_url === undefined ? undefined : normalizeUrl(resolved_url);
  if (!CANDIDATE_STATUSES.includes(status)) throw new Error(`Unsupported status: ${status}`);
  return withCandidateLock(root, async () => {
    const catalog = await loadCatalog(root);
    requireValid(catalog);
    const candidate = catalog.candidates.find(entry => entry.id === id);
    if (!candidate) throw new Error(`Unknown candidate: ${id}`);
    if (candidate.status === 'accepted' && status !== 'accepted') throw new Error('An accepted candidate is closed. Update the catalog resource and its evidence directly.');
    if (['rejected', 'deferred', 'duplicate'].includes(status) && !TEXT(reason)) throw new Error(`${status} requires --reason.`);
    if (['rejected', 'duplicate'].includes(candidate.status) && candidate.status !== status && !TEXT(reason)) throw new Error('Reopening a rejected or duplicate candidate requires --reason.');
    const resolutionChanged = resolved !== undefined && resolved !== candidate.resolved_url;
    if (resolutionChanged && !TEXT(reason)) throw new Error('Changing resolved_url requires --reason.');
    const resource = catalog.resources.find(entry => entry.id === resource_id);
    if (status === 'accepted' && !resource && !candidate.resource_id) throw new Error('Acceptance requires --resource naming an existing catalog resource. It does not create or publish one.');
    const nextResource = ['accepted', 'duplicate'].includes(status) ? (resource_id === undefined ? candidate.resource_id : resource_id) : null;
    if (status === 'duplicate' && !nextResource) throw new Error('Duplicate resolution requires --resource naming the existing target.');
    if (resource_id !== undefined && !resource) throw new Error(`Unknown resource: ${resource_id}`);
    const evidence = evidence_ids ?? (status === 'accepted' ? (resource ?? catalog.resources.find(entry => entry.id === nextResource))?.evidence_ids ?? [] : candidate.evidence_ids);
    const nextReason = TEXT(reason) ? reason.trim() : `Status changed to ${status}.`;
    const at = new Date().toISOString();
    const event = { at, from: candidate.status, to: status, reason: nextReason };
    if (resolutionChanged) event.resolution = { from: candidate.resolved_url ?? null, to: resolved };
    Object.assign(candidate, { status, reason: nextReason, resource_id: nextResource, evidence_ids: evidence, updated_at: at, history: [...candidate.history, event] });
    if (resolved !== undefined) candidate.resolved_url = resolved;
    requireValid(catalog);
    await saveCandidates(root, catalog.candidates);
    return { action: 'updated', candidate };
  });
}
