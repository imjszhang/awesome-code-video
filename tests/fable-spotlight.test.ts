import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {renderToString} from 'react-dom/server';
import {App} from '../web/src/App';
import {FABLE_SPOTLIGHT_HEADING,FABLE_SPOTLIGHT_HOME_LIMIT,FABLE_SPOTLIGHT_PAGE_DESCRIPTION,FABLE_SPOTLIGHT_PAGE_TITLE,FABLE_SPOTLIGHT_PATH,fableSpotlight,fableSpotlightBlocks,fableSpotlightHomeItems,fableSpotlightItems,fableSpotlightPosters,spotlightFrame,spotlightStill} from '../web/src/fableSpotlight';
import {allPaths,kindCount,pageMeta,projects,resources,routeForPath} from '../web/src/model';
import {pageSeoHead} from '../web/src/seo';

const forbiddenCopy = /已渲染实测|we rendered this|verified render/i;
const homeLimit = FABLE_SPOTLIGHT_HOME_LIMIT;

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function frameSections(html: string) {
  return [...html.matchAll(/<section\b(?=[^>]*\bclass="fable-frame\b")(?=[^>]*\bdata-frame="(landscape|portrait|square)")[^>]*>([\s\S]*?)<\/section>/g)].map(match => ({
    frame: match[1],
    ids: [...match[2].matchAll(/data-spotlight-id="(\d+)"/g)].map(item => item[1]),
    frames: [...match[2].matchAll(/data-frame="([^"]+)"/g)].map(item => item[1]),
  }));
}

function spotlightSection(html: string) {
  const start = html.indexOf('class="fable-spotlight"');
  const end = html.indexOf('id="featured"');
  assert.ok(start >= 0 && end > start, 'homepage spotlight sits above Featured');
  return html.slice(start, end);
}

test('standalone gallery keeps every post and stays out of the catalog files', () => {
  const items = fableSpotlightItems();
  assert.equal(fableSpotlight.item_count, 238);
  assert.equal(items.length, 238);
  assert.equal(new Set(items.map(item => item.id)).size, 238);
  assert.equal(fableSpotlight.eyebrow, 'Now trending');
  assert.equal(fableSpotlight.title, 'Fable 5.2');
  assert.match(fableSpotlight.description, /public posts of code videos made with Claude Fable 5\.2/i);
  assert.match(fableSpotlight.description, /not yet in the curated main index/i);
  assert.doesNotMatch(fableSpotlight.description, forbiddenCopy);
  for (let index = 1; index < items.length; index++) {
    assert.ok(Date.parse(items[index - 1].created_at_utc) >= Date.parse(items[index].created_at_utc));
  }
  for (const item of items) {
    assert.equal(new URL(item.url).hostname, 'x.com', item.id);
    assert.equal(new URL(item.video_url).hostname, 'video.twimg.com', item.id);
    assert.equal(new URL(item.preview).hostname, 'pbs.twimg.com', item.id);
    assert.equal(item.url.includes('/status/'), true, item.id);
  }
  const catalogFiles = ['data/resources.json', 'data/evidence.json', 'data/projects.json', 'README.md', 'README.zh-CN.md'];
  const catalogText = catalogFiles.map(file => read(file)).join('\n');
  for (const item of items) {
    assert.equal(catalogText.includes(item.url), false, item.url);
    assert.equal(catalogText.includes(item.id), false, item.id);
  }
  assert.equal(read('scripts/lib/catalog.mjs').includes('data/fable-52-gallery.json'), true);
  assert.equal(read('scripts/check-readme.mjs').includes('fable-52-gallery'), false);
  assert.equal(read('scripts/traceability.mjs').includes('fable-52-gallery'), false);
  const posters = readdirSync(new URL('../web/public/previews', import.meta.url));
  for (const item of items) assert.equal(posters.some(name => name.includes(item.id)), false, item.id);
  const stills = new Map(fableSpotlightPosters.map(record => [record.id, record]));
  assert.equal(stills.size, items.length);
  for (const item of items) {
    const still = stills.get(item.id);
    assert.ok(still, item.id);
    assert.equal(still.source_url, item.preview);
    assert.equal(still.poster, `/spotlight/fable-5-2/${item.id}.webp`);
    assert.equal(existsSync(new URL(`../web/public${still.poster}`, import.meta.url)), true, item.id);
    assert.equal(spotlightStill(item, path => `/${path}`), still.poster);
  }
  assert.equal(spotlightStill({id: 'missing-post', preview: 'https://pbs.twimg.com/a.jpg'}), 'https://pbs.twimg.com/a.jpg');
});

test('homepage spotlight shows the latest 24 posts between the stats row and Featured', () => {
  const home = renderToString(React.createElement(App, {path: '/'}));
  const heroAt = home.indexOf('brand-hero');
  const signalAt = home.indexOf('collection-signal');
  const spotlightAt = home.indexOf('class="fable-spotlight"');
  const featuredAt = home.indexOf('id="featured"');
  const exploreAt = home.indexOf('id="explore"');
  assert.ok(heroAt >= 0 && signalAt > heroAt && spotlightAt > signalAt && featuredAt > spotlightAt && exploreAt > featuredAt);
  const section = spotlightSection(home);
  const homeMeta = pageMeta(routeForPath('/'));
  assert.equal(homeMeta.title, 'Awesome Code Video — Styles, Shots & Templates, Claude Fable 5.2');
  assert.equal(homeMeta.description, 'Discover curated video templates, visual styles, shot recipes, and workflows for making videos with code. Find the source and understand what to reuse. Claude Fable 5.2 code videos stay in a separate spotlight, outside the curated index.');
  assert.match(homeMeta.title, /Claude Fable 5\.2/);
  assert.match(homeMeta.description, /Claude Fable 5\.2/);
  assert.doesNotMatch(homeMeta.description, /\b118\b|curated Awesome index/);
  assert.match(section, /Now trending/);
  assert.match(section, /<h2 id="fable-spotlight-title">Claude Fable 5\.2<\/h2>/);
  assert.match(section, /Public posts of code videos made with Claude Fable 5\.2/);
  assert.match(section, /not yet in the curated main index/);
  assert.match(section, new RegExp(`href="/${FABLE_SPOTLIGHT_PATH}"`));
  assert.match(section, new RegExp(`All ${fableSpotlightItems().length} posts`));
  assert.doesNotMatch(section, forbiddenCopy);
  assert.doesNotMatch(section, /href="[^"]*\/resources\//);
  assert.doesNotMatch(section, /Render tested|Source reviewed|Editorial cover|reuse brief/i);
  const cards = [...section.matchAll(/data-spotlight-id="(\d+)"/g)].map(match => match[1]);
  const latest = fableSpotlightHomeItems();
  assert.equal(homeLimit, 24);
  const blocks = fableSpotlightBlocks(latest);
  assert.deepEqual(cards, blocks.flatMap(block => block.items.map(item => item.id)));
  assert.equal(cards.includes(fableSpotlightItems()[24].id), false);
  assert.equal(cards.length, latest.length);
  assert.match(section, /class="fable-spotlight-grid"/);
  assert.doesNotMatch(section, /featured-track|Scroll Fable 5\.2 posts/);
  const rendered = frameSections(section);
  assert.deepEqual(rendered.map(block => block.frame), blocks.map(block => block.frame));
  for (const block of rendered) {
    assert.equal(block.ids.length, blocks.find(item => item.frame === block.frame)!.items.length);
    assert.ok(block.frames.every(frame => frame === block.frame), block.frame);
    assert.match(block.frame === 'landscape' ? section : section, new RegExp(`>${block.frame === 'landscape' ? 'Landscape' : block.frame === 'portrait' ? 'Portrait' : 'Square'}<`));
  }
  const css = read('web/src/styles.css');
  assert.match(css, /\.fable-frame\[data-frame='landscape'\] \.art-link \{ aspect-ratio: 16 \/ 9; \}/);
  assert.match(css, /\.fable-frame\[data-frame='portrait'\] \.art-link \{ aspect-ratio: 9 \/ 16; \}/);
  assert.match(css, /\.fable-frame\[data-frame='square'\] \.art-link \{ aspect-ratio: 1 \/ 1; \}/);
  assert.match(css, /\.fable-frame \.preview-poster \{[^}]*object-fit: cover;/);
  assert.doesNotMatch(css, /\.fable-frame[^{]*\{[^}]*object-fit:\s*fill/);
  assert.match(css, /\.fable-frame\[data-frame='landscape'\] \.fable-spotlight-grid \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /\.fable-frame\[data-frame='portrait'\] \.fable-spotlight-grid,\s*\.fable-frame\[data-frame='square'\] \.fable-spotlight-grid \{ grid-template-columns: repeat\(6, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /@media \(max-width: 1180px\) \{[\s\S]*\.fable-frame\[data-frame='landscape'\] \.fable-spotlight-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.fable-frame\[data-frame='landscape'\] \.fable-spotlight-grid,\s*\.fable-frame\[data-frame='portrait'\] \.fable-spotlight-grid,\s*\.fable-frame\[data-frame='square'\] \.fable-spotlight-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.spotlight-modal-dialog\[data-frame='portrait'\] \.spotlight-modal-stage \{ aspect-ratio: 9 \/ 16;/);
  assert.match(css, /\.spotlight-modal-stage \.preview-poster \{[^}]*object-fit: cover;/);
  const mixed = fableSpotlightItems().slice(0, 2).map((item, index) => ({...item, video_url: index === 0 ? 'https://video.twimg.com/vid/avc1/1920x1080/a.mp4' : 'https://video.twimg.com/vid/avc1/1080x1920/a.mp4'}));
  assert.deepEqual(fableSpotlightBlocks(mixed).map(block => block.frame), ['landscape', 'portrait']);
  for (const item of latest) {
    const card = section.slice(section.indexOf(`data-spotlight-id="${item.id}"`), section.indexOf(`data-spotlight-id="${item.id}"`) + 2500);
    assert.match(card, new RegExp(`href="${item.url}"`));
    assert.match(card, /target="_blank"/);
    assert.match(card, /rel="noopener noreferrer"/);
    assert.match(card, new RegExp(`aria-label="Original post by ${item.author_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(card, /class="spotlight-open"/);
    assert.match(card, /<img\b[^>]*class="preview-media preview-poster"[^>]*loading="lazy"/);
    assert.match(card, new RegExp(`src="/spotlight/fable-5-2/${item.id}\\.webp"`));
    assert.doesNotMatch(card, /<video\b|class="preview-play"|video\.twimg\.com/);
    assert.match(card, new RegExp(`data-frame="${spotlightFrame(item)}"`));
  }
  assert.equal([...section.matchAll(/<video\b/g)].length, 0);
  assert.doesNotMatch(section, /video\.twimg\.com|class="preview-play"/);
  assert.ok(latest.some(item => spotlightFrame(item) === 'portrait'));
  assert.ok(latest.some(item => spotlightFrame(item) === 'landscape'));
  assert.doesNotMatch(section, /\/previews\//);
  const signal = home.match(/<section\b[^>]*class="collection-signal"[^>]*>([\s\S]*?)<\/section>/)![1];
  const inventory = JSON.parse(read('data/resources.json')) as {id: string}[];
  assert.equal(inventory.length, 981, 'full inventory still includes isolated records');
  assert.equal(resources.length, 293, 'public catalog stays at the isolated display count');
  assert.equal(kindCount('film', 'scene'), 142);
  assert.equal(kindCount('shot', 'preset'), 79);
  assert.equal(kindCount('style'), 46);
  assert.equal(projects.length, 34);
  assert.match(signal, /<b>293<\/b><span>curated resources<\/span>/);
  assert.match(signal, /<b>142<\/b><span>films &amp; scenes<\/span>/);
  assert.match(signal, /<b>79<\/b><span>shots &amp; presets<\/span>/);
  assert.match(signal, /<b>46<\/b><span>visual styles<\/span>/);
  assert.match(signal, /<b>34<\/b><span>source projects<\/span>/);
  assert.doesNotMatch(signal, /<b>981<\/b>|<b>410<\/b>|<b>1098<\/b>/);
  const spotlightIds = new Set(fableSpotlightItems().map(item => item.id));
  assert.equal(inventory.some(record => spotlightIds.has(record.id)), false);
});

test('spotlight index lists all posts, keeps catalog routes unchanged, and is a public page', () => {
  const items = fableSpotlightItems();
  const path = `/${FABLE_SPOTLIGHT_PATH}`;
  assert.deepEqual(routeForPath(path), {type: 'spotlight', id: 'fable-5-2'});
  assert.deepEqual(routeForPath(`/awesome-code-video/${FABLE_SPOTLIGHT_PATH}`, '/awesome-code-video/'), {type: 'spotlight', id: 'fable-5-2'});
  assert.equal(routeForPath('/spotlight/other/').type, 'notfound');
  assert.equal(routeForPath(`/${FABLE_SPOTLIGHT_PATH}extra/`).type, 'notfound');
  const paths = allPaths();
  assert.equal(paths.filter(entry => entry.startsWith('spotlight/')).join(','), FABLE_SPOTLIGHT_PATH);
  assert.equal(paths.includes('saved/'), true);
  const build = read('scripts/build-web.ts');
  assert.match(build, /const paths=allPaths\(\)/);
  assert.match(build, /paths\.filter\(p=>p!=='saved\/'\)/);
  assert.doesNotMatch(build, /fable-52-gallery|fableSpotlightItems/);
  const meta = pageMeta(routeForPath(path));
  assert.equal(meta.title, 'Claude Fable 5.2 Code Videos | Awesome Code Video');
  assert.equal(meta.title, FABLE_SPOTLIGHT_PAGE_TITLE);
  assert.equal(meta.description, FABLE_SPOTLIGHT_PAGE_DESCRIPTION);
  assert.match(meta.description, /Claude Fable 5\.2 code videos/i);
  assert.match(meta.description, /not yet in the curated main index/i);
  assert.doesNotMatch(meta.description, /\b118\b/);
  const head = pageSeoHead(routeForPath(path), {site: new URL('https://awesomecodevideo.com'), base: '/', path: FABLE_SPOTLIGHT_PATH, indexable: true});
  assert.match(head, /<title>Claude Fable 5\.2 Code Videos \| Awesome Code Video<\/title>/);
  assert.match(head, /name="description" content="Claude Fable 5\.2 code videos from public posts/);
  const html = renderToString(React.createElement(App, {path}));
  assert.doesNotMatch(html, /\bhome-site\b/);
  assert.match(html, /<h1>Claude Fable 5\.2<\/h1>/);
  assert.match(html, new RegExp(`<p class="eyebrow">${fableSpotlight.eyebrow}</p>`));
  assert.equal(fableSpotlight.eyebrow, 'Now trending');
  assert.equal(FABLE_SPOTLIGHT_HEADING, 'Claude Fable 5.2');
  assert.match(html, new RegExp(`${items.length} public posts, newest first`));
  const cards = [...html.matchAll(/data-spotlight-id="(\d+)"/g)].map(match => match[1]);
  const blocks = fableSpotlightBlocks(items);
  assert.deepEqual(cards, blocks.flatMap(block => block.items.map(item => item.id)));
  assert.equal(cards.length, 238);
  const rendered = frameSections(html);
  assert.deepEqual(rendered.map(block => block.frame), blocks.map(block => block.frame));
  for (const block of rendered) assert.ok(block.frames.every(frame => frame === block.frame));
  assert.equal(rendered.reduce((sum, block) => sum + block.ids.length, 0), 238);
  assert.match(html, /href="https:\/\/x\.com\//);
  assert.equal([...html.matchAll(/role="dialog"/g)].length, 0);
  assert.equal([...html.matchAll(/<video\b/g)].length, 0);
  assert.doesNotMatch(html, /video\.twimg\.com|class="preview-play"/);
  assert.equal([...html.matchAll(/\bautoplay\b/gi)].length, 0);
  assert.doesNotMatch(html, /\/previews\/|href="[^"]*\/resources\/|已渲染实测|we rendered this|verified render/i);
  const frames = new Set(items.map(spotlightFrame));
  assert.deepEqual([...frames].sort(), ['landscape', 'portrait', 'square']);
  assert.match(html, /data-frame="portrait"/);
  assert.match(html, /data-frame="square"/);
  assert.match(html, /data-frame="landscape"/);
  const resourcePages = paths.filter(entry => entry.startsWith('resources/'));
  assert.equal(resourcePages.length, resources.length);
});

test('spotlight cards link to the original post and do not mount a player', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {url: 'https://awesomecodevideo.com/'});
  const previous = new Map(['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values: Record<string, unknown> = {window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true};
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {value, writable: true, configurable: true});
  const {createRoot} = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => {root.render(React.createElement(App, {path: '/'}));});
    const section = dom.window.document.querySelector('.fable-spotlight')!;
    assert.equal(section.querySelector('video'), null);
    assert.equal(section.querySelector('.preview-play'), null);
    const cards = [...section.querySelectorAll('.spotlight-card')];
    const latest = fableSpotlightHomeItems();
    assert.equal(cards.length, latest.length);
    for (const card of cards) {
      const item = latest.find(entry => entry.id === card.getAttribute('data-spotlight-id'));
      assert.ok(item);
      const link = card.querySelector('a.art-link');
      assert.equal(link?.getAttribute('href'), item.url);
      assert.equal(link?.getAttribute('target'), '_blank');
      assert.equal(link?.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${item.id}.webp`);
    }
  } finally {
    await act(async () => {root.unmount();});
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test('a Fable card opens a same-page viewer and does not leave for the original post', async () => {
  const item = fableSpotlightBlocks(fableSpotlightHomeItems())[0].items[0];
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {url: 'https://awesomecodevideo.com/'});
  const previous = new Map(['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values: Record<string, unknown> = {window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true};
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {value, writable: true, configurable: true});
  const {createRoot} = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => {root.render(React.createElement(App, {path: '/'}));});
    const stayed = dom.window.location.href;
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    const opener = dom.window.document.querySelector('.fable-spotlight .spotlight-open')!;
    await act(async () => {opener.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));});
    assert.equal(dom.window.location.href, stayed);
    const dialog = dom.window.document.querySelector('[role="dialog"]')!;
    assert.equal(dialog.getAttribute('data-frame'), spotlightFrame(item));
    assert.equal(dialog.querySelector('video'), null);
    assert.equal(dialog.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${item.id}.webp`);
    assert.ok((dialog.textContent ?? '').includes(item.author_name));
    assert.ok((dialog.textContent ?? '').includes(item.created_at_shanghai));
    assert.ok((dialog.textContent ?? '').includes(item.text.split('\n')[0].slice(0, 40)));
    const source = dialog.querySelector('a')!;
    assert.equal(source.getAttribute('href'), item.url);
    assert.equal(source.getAttribute('target'), '_blank');
    assert.match(source.textContent ?? '', /Original post/);
    await act(async () => {dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key: 'Escape'}));});
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    await act(async () => {opener.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));});
    const backdrop = dom.window.document.querySelector('.spotlight-modal')!;
    await act(async () => {backdrop.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));});
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    assert.equal(dom.window.location.href, stayed);
  } finally {
    await act(async () => {root.unmount();});
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
