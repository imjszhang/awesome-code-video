import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App} from '../web/src/App';
import {allPaths,resources,projects,collections,filterResources,routeForPath,pageMeta,coreCount,isCore,featuredIds,homeGalleryItems,previewCaption,previewMode,previewPlayable,previewPoster,previewUrl,resolvePreview} from '../web/src/model';

test('every public resource and project has exactly one stable route',()=>{
 const paths=allPaths();assert.equal(new Set(paths).size,paths.length);
 for(const r of resources){assert(paths.includes(`resources/${r.id}/`));assert.equal(routeForPath(`/resources/${r.id}/`).type,'resource');}
 assert.equal(coreCount,resources.filter(isCore).length);
 for(const c of collections)for(const id of c.ids)assert(resources.some(r=>r.id===id),`Unknown collection resource ${id}`);
});
test('search combines query, kind, project and use case filters',()=>{
 assert(filterResources({q:'watercolor'}).some(r=>r.id==='lemo-watercolor'));
 const maps=filterResources({kind:'preset',use:'maps-and-travel'});assert.equal(maps.length,6);
 assert.equal(filterResources({q:'zzzzzznonexistent'}).length,0);
 assert(filterResources({project:'webreel'}).every(r=>r.project_id==='webreel'));
 assert.equal(filterResources({kind:'style',project:'webreel'}).length,0);
 const sorted=filterResources({sort:'name'}).map(r=>r.name);assert.deepEqual(sorted,[...sorted].sort((a,b)=>a.localeCompare(b)));
});
test('subpath routes are supported and unrelated paths are rejected',()=>{
 assert.deepEqual(routeForPath('/awesome-code-video/resources/ink-press/','/awesome-code-video/'),{type:'resource',id:'ink-press'});
 for(const path of ['/resources/missing/','/resources/ink-press/extra/','/not-here/'])assert.equal(routeForPath(path).type,'notfound');
 assert.equal(routeForPath('/resources/ink-press/','/awesome-code-video/').type,'notfound');
});
test('all detail pages contain the source, reuse notes and review status in initial HTML',()=>{
 for(const r of resources){const html=renderToString(React.createElement(App,{path:`/resources/${r.id}/`}));
 assert(html.includes(r.url.replaceAll('&','&amp;')),r.id);assert(html.includes('What you’re reusing'),r.id);assert(html.includes('Not tested'),r.id);assert(html.includes('Review &amp; sources'),r.id);assert(html.includes(r.review.reviewed_at),r.id);
 assert.equal(pageMeta(routeForPath(`/resources/${r.id}/`)).description,r.description);
 }
});
test('shipped previews resolve from catalog fields and missing ones stay editorial covers',()=>{
 const withPreview=resources.filter(r=>r.preview);
 const without=resources.filter(r=>!r.preview);
 assert.equal(withPreview.length+without.length,resources.length);
 assert(withPreview.length>0);
 for(const resource of without){
  const resolved=resolvePreview(resource);
  assert.equal(resolved.degraded,true,resource.id);
  assert.equal(resolved.mode,'thumb_link');
  assert.equal(resolved.caption,'Editorial cover');
  assert.equal(resolved.playable,false);
  assert.equal(previewUrl(resource),null);
  assert.equal(previewPoster(resource),null);
  assert.match(resolved.detail,/not an upstream render/);
 }
 for(const resource of withPreview){
  const preview=resource.preview!;
  const resolved=resolvePreview(resource);
  assert.equal(resolved.degraded,false,resource.id);
  assert.equal(resolved.mode,preview.kind);
  assert.equal(resolved.url,preview.url);
  assert.equal(previewPoster(resource),'poster' in preview?preview.poster:null);
  assert.equal(resolved.license,preview.license);
  assert.equal(resolved.attribution,preview.attribution);
  assert.equal(resolved.source,preview.source);
  assert.equal(resolved.redistributable,preview.redistributable);
  assert.equal(resolved.checkedAt,preview.checked_at);
  assert.match(preview.source,/^S-CV-\d{3} https:\/\//);
  assert.equal(previewPlayable(resource),preview.kind==='video');
  assert.equal(previewCaption(resource),preview.kind==='video'?'Upstream demo':'Preview');
  if(preview.redistributable)assert.equal(preview.kind,'video');
  assert.match(resolved.detail,/not a local render test/);
 }
});
test('incomplete or unsafe previews degrade without exposing a url',()=>{
 const video=resources.find(r=>r.preview?.kind==='video'&&r.preview.redistributable)!;
 const embed=resources.find(r=>r.preview?.kind==='embed')!;
 const thumb=resources.find(r=>r.preview?.kind==='thumb_link')!;
 assert.equal(previewMode({}),'thumb_link');
 assert.equal(previewCaption(null),'Editorial cover');
 assert.equal(previewPlayable({preview:{...video.preview,license:' '}}),false);
 assert.equal(previewUrl({preview:{...video.preview,url:'javascript:alert(1)'}}),null);
 assert.equal(previewUrl({preview:{...video.preview,url:'http://example.com/demo.mp4'}}),null);
 assert.equal(resolvePreview({preview:{...video.preview,checked_at:'2026-02-30'}}).degraded,true);
 assert.equal(resolvePreview({preview:{...video.preview,poster:null}}).degraded,true);
 assert.equal(resolvePreview({preview:{...video.preview,notes:'extra'}}).degraded,true);
 assert.equal(resolvePreview({preview:{...video.preview,kind:'embed'}}).degraded,true);
 assert.equal(resolvePreview(embed).mode,'embed');
 assert.equal(resolvePreview(embed).playable,false);
 assert.equal(resolvePreview(thumb).mode,'thumb_link');
 assert.equal(resolvePreview(thumb).playable,false);
 assert.equal(previewPoster({preview:{...thumb.preview,poster:thumb.preview!.url}}),thumb.preview!.url);
});
test('homepage gallery lists complete previews and featured covers without playback controls',()=>{
 const items=homeGalleryItems();
 const ids=items.map(r=>r.id);
 assert.equal(new Set(ids).size,ids.length);
 const withPreview=resources.filter(r=>!resolvePreview(r).degraded);
 const featuredFallback=featuredIds.filter(id=>resolvePreview(resources.find(r=>r.id===id)).degraded);
 assert.deepEqual(new Set(ids),new Set([...withPreview.map(r=>r.id),...featuredFallback]));
 assert.equal(items.filter(r=>resolvePreview(r).degraded).every(r=>featuredIds.includes(r.id)),true);
 const ranks=items.map(r=>{const preview=resolvePreview(r);return preview.degraded?3:preview.playable?0:preview.mode==='thumb_link'?1:2;});
 assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));
 const galleryIds=new Set(ids);
 for(const resource of resources){
  const preview=resolvePreview(resource);
  assert.equal(galleryIds.has(resource.id),!preview.degraded||featuredIds.includes(resource.id),resource.id);
 }
 const esc=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const html=renderToString(React.createElement(App,{path:'/'}));
 assert.match(html,/class="hero hero-short"/);
 assert.equal(html.includes('hero-poster'),false);
 assert.match(html,/aria-label="Preview gallery"/);
 assert.match(html,/Nothing on this page is a local render test/);
 assert.equal(html.includes('EDITORIAL COVER'),false);
 assert.equal(html.includes('<iframe'),false);
 const captions=[...html.matchAll(/<span class="art-caption">([^<]*)<\/span>/g)].map(m=>m[1]);
 assert.deepEqual(captions,items.map(r=>previewCaption(r)));
 const videos=[...html.matchAll(/<video\b[^>]*>/g)].map(m=>m[0]);
 const playable=items.filter(r=>previewPlayable(r));
 assert.equal(videos.length,playable.length);
 for(const tag of videos){
  assert.match(tag,/preload="metadata"/);
  assert.match(tag,/playsinline/i);
  assert.match(tag,/tabindex="-1"/);
  assert.doesNotMatch(tag,/\bautoplay\b/i);
  assert.doesNotMatch(tag,/\bcontrols\b/i);
  assert.doesNotMatch(tag,/\bmuted\b/i);
  assert.doesNotMatch(tag,/\bloop\b/i);
 }
 const images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
 const thumbs=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='thumb_link';});
 assert.equal(images.length,thumbs.length);
 for(const resource of items){
  const preview=resolvePreview(resource);
  assert.match(html,new RegExp(`href="/resources/${resource.id}/"`));
  assert.match(html,new RegExp(`<p class="preview-note">${esc(preview.detail)}`));
  if(preview.degraded){
   assert.equal(preview.caption,'Editorial cover');
   continue;
  }
  assert.match(html,new RegExp(`href="${esc(preview.url!)}" class="preview-source"`));
  if(preview.playable)assert.match(html,new RegExp(`<video\\b[^>]*src="${esc(preview.url!)}"`));
  if(preview.mode==='thumb_link')assert.match(html,new RegExp(`<img\\b[^>]*src="${esc(preview.poster||preview.url!)}"`));
  if(preview.mode==='embed'){
   assert.match(html,/class="preview-embed"/);
   assert.doesNotMatch(html,new RegExp(`<video\\b[^>]*src="${esc(preview.url!)}"`));
   assert.doesNotMatch(html,new RegExp(`<img\\b[^>]*src="${esc(preview.url!)}"`));
  }
 }
 for(const resource of resources)assert.equal(html.includes(`href="/resources/${resource.id}/"`),galleryIds.has(resource.id),resource.id);
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 assert.equal(library.includes('<video'),false);
 assert.equal(library.includes('<img'),false);
 assert.match(library,/EDITORIAL COVER/);
 const detail=renderToString(React.createElement(App,{path:'/resources/lemo-watercolor/'}));
 assert.equal(detail.includes('<video'),false);
 assert.match(detail,/EDITORIAL COVER — NOT AN UPSTREAM RENDER/);
 const about=renderToString(React.createElement(App,{path:'/about/'}));
 assert.match(about,/A preview is not a local render test/);
});
test('all pages render server-side without browser APIs and internal links resolve',()=>{
 const paths=allPaths();const valid=new Set(paths.map(p=>'/preview/'+p));
 for(const path of paths){const html=renderToString(React.createElement(App,{path:'/preview/'+path,base:'/preview/'}));
 assert(html.includes('<h1'),path);
 for(const match of html.matchAll(/href="(\/preview\/[^"?#]*)/g))assert(valid.has(match[1]),`Broken link ${match[1]} on ${path}`);
 }
 assert.equal(projects.length,new Set(projects.map(p=>p.id)).size);
});
