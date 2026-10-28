#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SECTION_TRANSLATIONS = Object.freeze({
  'Film and Scene Templates': '成片与场景工程',
  'Map Animation Presets': '参数化地图镜头',
  'Shot Recipes': '可复用镜头配方',
  'Visual Style Templates': '视觉风格文件',
  'Frameworks and Renderers': '视频制作框架',
  'Motion Design Tools': '视频动效辅助工具',
  'Production Workflows': '制作工作流',
  'Generative Video Prompts': '生成式视频提示词',
  'Related Lists': '相关清单',
});

const CORE_KINDS = new Set(['film', 'scene', 'preset', 'shot', 'style']);
const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

// This deliberately reads the maintained list syntax, not every explanatory link.
// A resource is the first link in a bullet, or the first cell of a Chinese table.
export function readEntries(markdown, language = 'en') {
  const sections = new Map(Object.entries(SECTION_TRANSLATIONS).map(([en, zh]) => [language === 'zh' ? zh : en, en]));
  const entries = [];
  let section = null;
  let fence = null;
  for (const [index, line] of String(markdown).split(/\r?\n/).entries()) {
    const fenced = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenced) {
      if (!fence) fence = fenced[1][0];
      else if (fence === fenced[1][0]) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^##\s+(.+?)\s*#*$/);
    if (heading) {
      section = sections.get(heading[1].trim()) ?? null;
      continue;
    }
    if (!section) continue;
    const bullet = line.match(/^\s*-\s+\[([^\]]+)\]\(([^\s)]+)\)(?:\s+-\s+(.*))?\s*$/);
    const table = language === 'zh' && line.match(/^\s*\|\s*\[([^\]]+)\]\(([^\s)]+)\)\s*\|/);
    const match = bullet || table;
    if (match) entries.push({ name: match[1], url: match[2], description: bullet?.[3] ?? '', section, line: index + 1 });
  }
  return entries;
}

export function auditReadmes({ resources, english, chinese }) {
  const errors = [];
  if (!Array.isArray(resources)) return { errors: ['data/resources.json must contain an array.'], summary: {} };
  const byUrl = new Map();
  for (const resource of resources) {
    if (!resource || typeof resource.url !== 'string') {
      errors.push('Every catalog resource needs a URL before README consistency can be checked.');
      continue;
    }
    if (byUrl.has(resource.url)) errors.push(`Catalog has duplicate resource URL: ${resource.url}`);
    byUrl.set(resource.url, resource);
    if (!Object.hasOwn(SECTION_TRANSLATIONS, resource.section)) errors.push(`Catalog resource ${resource.id} has an unsupported README section: ${resource.section}`);
  }

  const counts = {};
  for (const [language, filename, text] of [['en', 'README.md', english], ['zh', 'README.zh-CN.md', chinese]]) {
    const entries = readEntries(text, language);
    const seen = new Map();
    counts[language] = entries.length;
    for (const entry of entries) {
      const location = `${filename}:${entry.line}`;
      seen.set(entry.url, (seen.get(entry.url) ?? 0) + 1);
      if (seen.get(entry.url) > 1) errors.push(`${location}: Duplicate resource entry: ${entry.url}`);
      const resource = byUrl.get(entry.url);
      if (!resource) {
        errors.push(`${location}: Entry is not in data/resources.json: ${entry.url}`);
        continue;
      }
      if (entry.section !== resource.section) errors.push(`${location}: ${resource.id} belongs in "${resource.section}", not "${entry.section}".`);
      if (language === 'en') {
        if (normalizeText(entry.name) !== normalizeText(resource.name)) errors.push(`${location}: Name differs from catalog for ${resource.id}.`);
        if (normalizeText(entry.description) !== normalizeText(resource.description)) errors.push(`${location}: Description differs from catalog for ${resource.id}.`);
      }
    }
    for (const resource of resources) {
      if (!seen.has(resource?.url)) errors.push(`${filename}: Missing resource entry: ${resource?.id ?? '(invalid record)'}.`);
    }
    const intro = String(text).split(/^##\s+/m)[0];
    const advertised = language === 'en'
      ? intro.match(/\bcontains\s+(\d+)\s+reusable\b/i)
      : intro.match(/首批\s*(\d+)\s*个可复用单元/);
    const coreCount = resources.filter((resource) => CORE_KINDS.has(resource?.kind)).length;
    if (!advertised) errors.push(`${filename}: Missing recognizable introductory reusable-resource count.`);
    else if (Number(advertised[1]) !== coreCount) errors.push(`${filename}: Intro advertises ${advertised[1]} reusable resources; catalog contains ${coreCount}.`);
  }
  return { errors, summary: { catalog: resources.length, core: resources.filter((resource) => CORE_KINDS.has(resource?.kind)).length, english: counts.en, chinese: counts.zh } };
}

export async function checkReadmes(root) {
  const [resources, english, chinese] = await Promise.all([
    fs.readFile(path.join(root, 'data/resources.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(root, 'README.md'), 'utf8'),
    fs.readFile(path.join(root, 'README.zh-CN.md'), 'utf8'),
  ]);
  return auditReadmes({ resources, english, chinese });
}

async function main(args) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--root' && args[index + 1]) root = path.resolve(args[++index]);
    else if (['--help', '-h'].includes(args[index])) {
      console.log('Usage: node scripts/check-readme.mjs [--root <directory>]');
      return;
    } else throw new Error(`Unknown or incomplete argument: ${args[index]}`);
  }
  const result = await checkReadmes(root);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
  } else console.log(`README consistency passed: ${result.summary.catalog} entries in both languages (${result.summary.core} core resources).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`README check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
