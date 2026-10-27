import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App} from '../web/src/App';
import {allPaths,resources,projects,collections,filterResources,routeForPath,pageMeta,coreCount,isCore,previewCaption,previewMode,previewPlayable,previewPoster,previewUrl,resolvePreview} from '../web/src/model';

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
test('shipped previews resolve from Batch A fields and missing ones stay editorial covers',()=>{
 const withPreview=resources.filter(r=>r.preview);
 const without=resources.filter(r=>!r.preview);
 assert.equal(withPreview.length,34);
 assert.equal(without.length,21);
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
  assert.equal(previewPoster(resource),null);
  assert.equal('poster' in preview,false);
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
test('all pages render server-side without browser APIs and internal links resolve',()=>{
 const paths=allPaths();const valid=new Set(paths.map(p=>'/preview/'+p));
 for(const path of paths){const html=renderToString(React.createElement(App,{path:'/preview/'+path,base:'/preview/'}));
 assert(html.includes('<h1'),path);
 for(const match of html.matchAll(/href="(\/preview\/[^"?#]*)/g))assert(valid.has(match[1]),`Broken link ${match[1]} on ${path}`);
 }
 assert.equal(projects.length,new Set(projects.map(p=>p.id)).size);
});
