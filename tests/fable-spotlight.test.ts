import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {renderToString} from 'react-dom/server';
import {App} from '../web/src/App';
import {FABLE_SPOTLIGHT_HEADING,FABLE_SPOTLIGHT_HOME_LIMIT,FABLE_SPOTLIGHT_PAGE_DESCRIPTION,FABLE_SPOTLIGHT_PAGE_TITLE,FABLE_SPOTLIGHT_PATH,fableSpotlight,fableSpotlightBlocks,fableSpotlightHomeItems,fableSpotlightItems,fableSpotlightPosters,spotlightFrame,spotlightStill} from '../web/src/fableSpotlight';
import {SPOTLIGHT_PREVIEW_CAP,rectIntersectsViewport,releaseSpotlightMedia,selectSpotlightPreviews,viewportCenterDistance,type SpotlightPreviewCandidate} from '../web/src/spotlightPreview';
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
  assert.equal(fableSpotlight.item_count, 936);
  assert.equal(items.length, 936);
  assert.equal(new Set(items.map(item => item.id)).size, 936);
  assert.equal(fableSpotlight.eyebrow, 'Now trending');
  assert.equal(fableSpotlight.title, 'Fable 5.2');
  assert.match(fableSpotlight.description, /public posts of code videos made with Claude Fable 5\.2/i);
  assert.match(fableSpotlight.description, /not yet in the curated main index/i);
  assert.doesNotMatch(fableSpotlight.description, forbiddenCopy);
  for (let index = 1; index < items.length; index++) {
    assert.ok(Date.parse(items[index - 1].created_at_utc) >= Date.parse(items[index].created_at_utc));
  }
  const missingPreview = items.filter(item => !item.preview).map(item => item.id);
  assert.deepEqual(missingPreview, ['2120872572325928987']);
  for (const item of items) {
    assert.equal(new URL(item.url).hostname, 'x.com', item.id);
    assert.equal(new URL(item.video_url).hostname, 'video.twimg.com', item.id);
    if (item.preview) assert.equal(new URL(item.preview).hostname, 'pbs.twimg.com', item.id);
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
  const withPreview = items.filter(item => item.preview);
  assert.equal(withPreview.length, 935);
  assert.equal(stills.size, withPreview.length);
  for (const item of withPreview) {
    const still = stills.get(item.id);
    assert.ok(still, item.id);
    assert.equal(still.source_url, item.preview);
    assert.equal(still.poster, `/spotlight/fable-5-2/${item.id}.webp`);
    assert.equal(existsSync(new URL(`../web/public${still.poster}`, import.meta.url)), true, item.id);
    assert.equal(spotlightStill(item, path => `/${path}`), still.poster);
  }
  assert.equal(stills.has('2120872572325928987'), false);
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
  assert.equal(homeMeta.title, 'Awesome Code Video — AI + Code Video Resources');
  assert.equal(homeMeta.description, 'Discover curated videos, tools, open-source projects, shot recipes and visual styles for making videos with AI and code, with original sources and reuse notes.');
  assert.doesNotMatch(homeMeta.title, /Claude|Fable|Opus/);
  assert.doesNotMatch(homeMeta.description, /Claude|Fable|Opus/);
  assert.doesNotMatch(homeMeta.description, /\b118\b|curated Awesome index/);
  assert.match(section, /Now trending/);
  assert.match(section, /<h2 id="fable-spotlight-title">Claude Fable 5\.2<\/h2>/);
  assert.match(section, /Public posts of code videos made with Claude Fable 5\.2/);
  assert.match(section, /not yet in the curated main index/);
  assert.match(section, /Muted previews loop after a card enters the viewport/);
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
    const card = section.slice(section.indexOf(`data-spotlight-id="${item.id}"`), section.indexOf(`data-spotlight-id="${item.id}"`) + 4000);
    assert.match(card, /<button\b[^>]*class="art-link"/);
    assert.doesNotMatch(card, /<a\b[^>]*class="art-link"/);
    assert.match(card, new RegExp(`aria-label="Open preview by ${item.author_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(card, new RegExp(`href="${item.url}"`));
    assert.match(card, /<a\b[^>]*class="art-caption"[^>]*>Original post<\/a>/);
    assert.match(card, /target="_blank"/);
    assert.match(card, /rel="noopener noreferrer"/);
    assert.match(card, /class="spotlight-open"/);
    assert.match(card, /<img\b[^>]*class="preview-media preview-poster"[^>]*loading="lazy"/);
    assert.match(card, new RegExp(`src="/spotlight/fable-5-2/${item.id}\\.webp"`));
    assert.doesNotMatch(card, /<video\b|class="preview-play"|video\.twimg\.com|\bautoplay\b/i);
    assert.match(card, new RegExp(`data-frame="${spotlightFrame(item)}"`));
  }
  assert.equal([...section.matchAll(/<video\b/g)].length, 0, 'first paint paints stills and does not mount preview players');
  assert.doesNotMatch(section, /video\.twimg\.com|class="preview-play"|\bautoplay\b/i);
  assert.ok(latest.some(item => spotlightFrame(item) === 'portrait'));
  assert.ok(latest.some(item => spotlightFrame(item) === 'landscape'));
  assert.doesNotMatch(section, /\/previews\//);
  const signal = home.match(/<section\b[^>]*class="collection-signal"[^>]*>([\s\S]*?)<\/section>/)![1];
  const inventory = JSON.parse(read('data/resources.json')) as {id: string}[];
  assert.equal(inventory.length, 982, 'full inventory still includes isolated records');
  assert.equal(resources.length, 294, 'public catalog stays at the isolated display count');
  assert.equal(kindCount('film', 'scene'), 142);
  assert.equal(kindCount('shot', 'preset'), 79);
  assert.equal(kindCount('style'), 46);
  assert.equal(projects.length, 35);
  assert.match(signal, /<b>294<\/b><span>curated resources<\/span>/);
  assert.match(signal, /<b>142<\/b><span>films &amp; scenes<\/span>/);
  assert.match(signal, /<b>79<\/b><span>shots &amp; presets<\/span>/);
  assert.match(signal, /<b>46<\/b><span>visual styles<\/span>/);
  assert.match(signal, /<b>35<\/b><span>source projects<\/span>/);
  assert.doesNotMatch(signal, /<b>982<\/b>|<b>410<\/b>|<b>1098<\/b>/);
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
  assert.match(meta.description, /Muted previews loop after a card enters the viewport/);
  assert.doesNotMatch(meta.description, /video plays on the original post/);
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
  assert.equal(cards.length, 936);
  const rendered = frameSections(html);
  assert.deepEqual(rendered.map(block => block.frame), blocks.map(block => block.frame));
  for (const block of rendered) assert.ok(block.frames.every(frame => frame === block.frame));
  assert.equal(rendered.reduce((sum, block) => sum + block.ids.length, 0), 936);
  assert.match(html, /href="https:\/\/x\.com\//);
  assert.equal([...html.matchAll(/role="dialog"/g)].length, 0);
  assert.equal([...html.matchAll(/<video\b/g)].length, 0, 'static HTML does not mount a player for every post');
  assert.equal([...html.matchAll(/\bsrc="https:\/\/video\.twimg\.com/g)].length, 0);
  assert.doesNotMatch(html, /video\.twimg\.com|class="preview-play"/);
  assert.equal([...html.matchAll(/\bautoplay\b/gi)].length, 0, 'sources attach in the client after viewport entry, not with an autoplay attribute');
  assert.doesNotMatch(html, /\/previews\/|href="[^"]*\/resources\/|已渲染实测|we rendered this|verified render/i);
  const frames = new Set(items.map(spotlightFrame));
  assert.deepEqual([...frames].sort(), ['landscape', 'portrait', 'square']);
  assert.match(html, /data-frame="portrait"/);
  assert.match(html, /data-frame="square"/);
  assert.match(html, /data-frame="landscape"/);
  const missingAt = html.indexOf('data-spotlight-id="2120872572325928987"');
  assert.ok(missingAt > 0);
  const missingCard = html.slice(missingAt, html.indexOf('</article>', missingAt));
  assert.doesNotMatch(missingCard, /<video\b|<img\b/);
  assert.match(missingCard, /href="https:\/\/x\.com\/webasamoah\/status\/2120872572325928987"/);
  const resourcePages = paths.filter(entry => entry.startsWith('resources/'));
  assert.equal(resourcePages.length, resources.length);
});

const domGlobals = ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT'] as const;

async function withApp(path: string, run: (dom: JSDOM) => Promise<void>) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {url: 'https://awesomecodevideo.com/'});
  const previous = new Map(domGlobals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values: Record<string, unknown> = {window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true};
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {value, writable: true, configurable: true});
  const {createRoot} = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => {root.render(React.createElement(App, {path}));});
    await run(dom);
  } finally {
    await act(async () => {root.unmount();});
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

function mediaBox(rect: {left: number; top: number; width: number; height: number}) {
  return {...rect, x: rect.left, y: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height, toJSON() { return rect; }};
}

function placeSpotlightCards(dom: JSDOM, layout: ReadonlyMap<string, {top: number}>) {
  const viewport = {width: dom.window.innerWidth, height: dom.window.innerHeight};
  const candidates: SpotlightPreviewCandidate[] = [];
  for (const card of dom.window.document.querySelectorAll<HTMLElement>('.fable-spotlight .spotlight-card')) {
    const id = card.getAttribute('data-spotlight-id') ?? '';
    const placed = layout.get(id);
    const rect = placed ? {left: 40, top: placed.top, width: 160, height: 120} : {left: 0, top: 5000, width: 160, height: 120};
    card.getBoundingClientRect = () => mediaBox(rect);
    if (placed && rectIntersectsViewport(rect, viewport)) candidates.push({id, intersecting: true, distanceToCenter: viewportCenterDistance(rect, viewport)});
  }
  return candidates;
}

function stubSpotlightMedia(dom: JSDOM, rejectSrc = '') {
  const paused: string[] = [];
  const proto = dom.window.HTMLMediaElement.prototype;
  proto.play = function play(this: HTMLMediaElement) {
    const src = this.getAttribute('src') || '';
    if (rejectSrc && src === rejectSrc) return Promise.reject(new Error('play rejected'));
    return Promise.resolve();
  };
  proto.pause = function pause(this: HTMLMediaElement) { paused.push(this.getAttribute('src') || ''); };
  proto.load = function load() {};
  return paused;
}

async function settleViewport(dom: JSDOM) {
  await act(async () => {
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    for (let step = 0; step < 6; step += 1) await new Promise(resolve => setTimeout(resolve, 0));
  });
}

function installPreviewFetch(rejectUrl = '') {
  const calls: {url: string; referrerPolicy?: string}[] = [];
  const previousFetch = globalThis.fetch;
  const previousCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const previousRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  let serial = 0;
  Object.defineProperty(URL, 'createObjectURL', {configurable: true, writable: true, value: () => `blob:spotlight-${++serial}`});
  Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, writable: true, value: () => {}});
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({url, referrerPolicy: init?.referrerPolicy});
    if (rejectUrl && url === rejectUrl) return new Response('no', {status: 403});
    return new Response(new Uint8Array([1, 2, 3]), {status: 200, headers: {'Content-Type': 'video/mp4'}});
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = previousFetch;
      if (previousCreate) Object.defineProperty(URL, 'createObjectURL', previousCreate);
      else delete (URL as {createObjectURL?: unknown}).createObjectURL;
      if (previousRevoke) Object.defineProperty(URL, 'revokeObjectURL', previousRevoke);
      else delete (URL as {revokeObjectURL?: unknown}).revokeObjectURL;
    },
  };
}

function previewSources(dom: JSDOM) {
  return [...dom.window.document.querySelectorAll('.fable-spotlight video')].map(video => video.getAttribute('src') || '');
}

test('spotlight preview selection prefers the center and releases a file URL', () => {
  assert.equal(SPOTLIGHT_PREVIEW_CAP, 6);
  const candidates: SpotlightPreviewCandidate[] = [
    {id: 'far', intersecting: true, distanceToCenter: 50},
    {id: 'near', intersecting: true, distanceToCenter: 1},
    {id: 'out', intersecting: false, distanceToCenter: 0},
    {id: 'mid', intersecting: true, distanceToCenter: 5},
    {id: 'tie-b', intersecting: true, distanceToCenter: 5},
    {id: 'tie-a', intersecting: true, distanceToCenter: 5},
  ];
  assert.deepEqual(selectSpotlightPreviews(candidates, 3), ['near', 'mid', 'tie-a']);
  assert.deepEqual(selectSpotlightPreviews(candidates, 3, new Set(['near'])), ['mid', 'tie-a', 'tie-b']);
  assert.deepEqual(selectSpotlightPreviews(candidates, 0), []);
  assert.equal(rectIntersectsViewport({left: 0, top: 0, width: 0, height: 0}, {width: 800, height: 800}), false);
  assert.equal(rectIntersectsViewport({left: -10, top: 10, width: 30, height: 10}, {width: 800, height: 800}), true);
  assert.equal(viewportCenterDistance({left: 0, top: 0, width: 100, height: 100}, {width: 100, height: 100}), 0);
  const events: string[] = [];
  const media = {
    src: 'https://video.twimg.com/a.mp4',
    pause() { events.push('pause'); },
    load() { events.push('load'); },
    getAttribute(name: string) { return name === 'src' ? this.src : null; },
    removeAttribute(name: string) { if (name === 'src') { this.src = ''; events.push('remove'); } },
  };
  releaseSpotlightMedia(media);
  assert.deepEqual(events, ['pause', 'remove', 'load']);
  releaseSpotlightMedia(media);
  assert.deepEqual(events, ['pause', 'remove', 'load', 'pause']);
});

test('spotlight cards keep the original post link and do not mount a player before viewport entry', async () => {
  await withApp('/', async dom => {
    const section = dom.window.document.querySelector('.fable-spotlight')!;
    assert.equal(section.querySelector('video'), null);
    assert.equal(section.querySelector('.preview-play'), null);
    assert.equal(section.innerHTML.includes('video.twimg.com'), false);
    const cards = [...section.querySelectorAll('.spotlight-card')];
    const latest = fableSpotlightHomeItems();
    assert.equal(cards.length, latest.length);
    for (const card of cards) {
      const item = latest.find(entry => entry.id === card.getAttribute('data-spotlight-id'));
      assert.ok(item);
      const link = card.querySelector('a.art-caption');
      assert.equal(link?.getAttribute('href'), item.url);
      assert.equal(link?.getAttribute('target'), '_blank');
      assert.equal(link?.getAttribute('rel'), 'noopener noreferrer');
      const cover = card.querySelector('button.art-link');
      assert.equal(cover?.getAttribute('aria-label'), `Open preview by ${item.author_name}`);
      assert.equal(cover?.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${item.id}.webp`);
      assert.equal(cover?.querySelector('video'), null);
    }
  });
});

test('visible spotlight cards attach a capped muted loop and release it outside the viewport', async () => {
  const preview = installPreviewFetch();
  try {
  await withApp('/', async dom => {
    Object.defineProperty(dom.window, 'innerWidth', {configurable: true, value: 800});
    Object.defineProperty(dom.window, 'innerHeight', {configurable: true, value: 800});
    const paused = stubSpotlightMedia(dom);
    const cards = [...dom.window.document.querySelectorAll<HTMLElement>('.fable-spotlight .spotlight-card')];
    const visible = cards.slice(0, 8).map((card, index) => [card.getAttribute('data-spotlight-id')!, {top: 30 + index * 80}] as const);
    const candidates = placeSpotlightCards(dom, new Map(visible));
    await settleViewport(dom);
    const expected = selectSpotlightPreviews(candidates);
    assert.equal(expected.length, SPOTLIGHT_PREVIEW_CAP);
    const sources = new Map(previewSources(dom).map(src => [src, true]));
    assert.equal(sources.size, SPOTLIGHT_PREVIEW_CAP);
    for (const id of expected) {
      const card = dom.window.document.querySelector(`[data-spotlight-id="${id}"]`)!;
      const video = card.querySelector('video')!;
      const item = fableSpotlightHomeItems().find(entry => entry.id === id)!;
      assert.match(video.getAttribute('src') || '', /^blob:spotlight-/);
      assert.equal(preview.calls.some(call => call.url === item.video_url && call.referrerPolicy === 'no-referrer'), true);
      assert.equal(video.getAttribute('referrerpolicy'), 'no-referrer');
      assert.equal(video.muted, true);
      assert.equal(video.loop, true);
      assert.equal(video.hasAttribute('playsinline'), true);
      assert.equal(video.hasAttribute('autoplay'), false);
      assert.equal(video.hasAttribute('controls'), false);
      assert.equal(video.getAttribute('poster'), `/spotlight/fable-5-2/${id}.webp`);
      assert.equal(card.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${id}.webp`);
    }
    const idle = cards.slice(8, 12).map((card, index) => [card.getAttribute('data-spotlight-id')!, {top: 40 + index * 140}] as const);
    const released = [...sources.keys()];
    placeSpotlightCards(dom, new Map(idle));
    await settleViewport(dom);
    const nextSources = previewSources(dom);
    assert.equal(nextSources.length, idle.length);
    for (const src of released) {
      assert.equal(nextSources.includes(src), false, src);
      assert.equal(paused.includes(src), true, src);
    }
    for (const [id] of idle) assert.equal(dom.window.document.querySelector(`[data-spotlight-id="${id}"] video`)?.getAttribute('poster'), `/spotlight/fable-5-2/${id}.webp`);
    const cover = dom.window.document.querySelector('.fable-spotlight button.art-link')!;
    await act(async () => {
      cover.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));
      for (let step = 0; step < 6; step += 1) await new Promise(resolve => setTimeout(resolve, 0));
    });
    assert.equal(dom.window.document.querySelectorAll('.fable-spotlight .spotlight-card video[src]').length, 0, 'opening the viewer releases card previews');
    assert.equal(dom.window.document.querySelector('[role="dialog"] video')?.getAttribute('referrerpolicy'), 'no-referrer');
    assert.match(dom.window.document.querySelector('[role="dialog"] video')?.getAttribute('src') || '', /^blob:spotlight-/);
  });
  } finally { preview.restore(); }
});

test('a rejected spotlight preview leaves the still and gives the slot to the next card', async () => {
  let restore = () => {};
  try {
  await withApp('/', async dom => {
    Object.defineProperty(dom.window, 'innerWidth', {configurable: true, value: 800});
    Object.defineProperty(dom.window, 'innerHeight', {configurable: true, value: 800});
    stubSpotlightMedia(dom);
    const cards = [...dom.window.document.querySelectorAll<HTMLElement>('.fable-spotlight .spotlight-card')];
    const visible = cards.slice(0, 8).map((card, index) => [card.getAttribute('data-spotlight-id')!, {top: 30 + index * 80}] as const);
    const candidates = placeSpotlightCards(dom, new Map(visible));
    const failId = selectSpotlightPreviews(candidates)[0];
    const failItem = fableSpotlightHomeItems().find(entry => entry.id === failId)!;
    restore = installPreviewFetch(failItem.video_url).restore;
    await settleViewport(dom);
    const expected = selectSpotlightPreviews(candidates, SPOTLIGHT_PREVIEW_CAP, new Set([failId]));
    const playing = [...dom.window.document.querySelectorAll('.fable-spotlight .spotlight-card')].flatMap(card => card.querySelector('video[src]') ? [card.getAttribute('data-spotlight-id')] : []);
    assert.deepEqual(playing.sort(), [...expected].sort());
    assert.equal(playing.includes(failId), false);
    const failed = dom.window.document.querySelector(`[data-spotlight-id="${failId}"]`)!;
    assert.equal(failed.querySelector('video'), null);
    assert.equal(failed.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${failId}.webp`);
    assert.equal(dom.window.document.querySelectorAll('.fable-spotlight .spotlight-card video[src]').length, SPOTLIGHT_PREVIEW_CAP);
  });
  } finally { restore(); }
});

test('a Fable card opens a same-page viewer and plays the video there', async () => {
  const item = fableSpotlightBlocks(fableSpotlightHomeItems())[0].items[0];
  const preview = installPreviewFetch();
  try {
  await withApp('/', async dom => {
    stubSpotlightMedia(dom);
    const stayed = dom.window.location.href;
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    const cover = dom.window.document.querySelector('.fable-spotlight button.art-link')!;
    await act(async () => {
      cover.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));
      for (let step = 0; step < 6; step += 1) await new Promise(resolve => setTimeout(resolve, 0));
    });
    assert.equal(dom.window.location.href, stayed);
    const dialog = dom.window.document.querySelector('[role="dialog"]')!;
    assert.equal(dialog.getAttribute('data-frame'), spotlightFrame(item));
    const video = dialog.querySelector('video')!;
    assert.match(video.getAttribute('src') || '', /^blob:spotlight-/);
    assert.equal(preview.calls.some(call => call.url === item.video_url && call.referrerPolicy === 'no-referrer'), true);
    assert.equal(video.getAttribute('referrerpolicy'), 'no-referrer');
    assert.equal(video.muted, true);
    assert.equal(video.hasAttribute('playsinline'), true);
    assert.equal(video.hasAttribute('controls'), true);
    assert.equal(video.hasAttribute('autoplay'), false);
    assert.equal(video.getAttribute('poster'), `/spotlight/fable-5-2/${item.id}.webp`);
    assert.equal(dialog.querySelector('img')?.getAttribute('src'), `/spotlight/fable-5-2/${item.id}.webp`);
    assert.equal(dom.window.document.querySelectorAll('.fable-spotlight .spotlight-card video').length, 0);
    assert.ok((dialog.textContent ?? '').includes(item.author_name));
    assert.ok((dialog.textContent ?? '').includes(item.created_at_shanghai));
    assert.ok((dialog.textContent ?? '').includes(item.text.split('\n')[0].slice(0, 40)));
    const source = dialog.querySelector('a')!;
    assert.equal(source.getAttribute('href'), item.url);
    assert.equal(source.getAttribute('target'), '_blank');
    assert.match(source.textContent ?? '', /Original post/);
    await act(async () => {dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key: 'Escape'}));});
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    const opener = dom.window.document.querySelector('.fable-spotlight .spotlight-open')!;
    await act(async () => {
      opener.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));
      for (let step = 0; step < 6; step += 1) await new Promise(resolve => setTimeout(resolve, 0));
    });
    assert.match(dom.window.document.querySelector('[role="dialog"] video')?.getAttribute('src') || '', /^blob:spotlight-/);
    const backdrop = dom.window.document.querySelector('.spotlight-modal')!;
    await act(async () => {backdrop.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));});
    assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
    assert.equal(dom.window.location.href, stayed);
  });
  } finally { preview.restore(); }
});
