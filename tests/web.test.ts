import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App,GalleryCard} from '../web/src/App';
import {GALLERY_BATCH_SIZE,GALLERY_CATEGORY_IDS,createGalleryBrowseState,selectGalleryCategory,loadMoreGalleryItems} from '../web/src/galleryBrowsing';
import {abandonGalleryPlayback,resetPreview,toggleGalleryPlayback,type PreviewMedia} from '../web/src/galleryPlayback';
import {allPaths,resources,projects,collections,filterResources,routeForPath,pageMeta,coreCount,isCore,featuredIds,homeGalleryItems,homePreviewItems,homePreviewGroups,videoOrientation,isYouTubePreview,previewCaption,previewMode,previewPlayable,previewPoster,previewUrl,resolvePreview,type Resource} from '../web/src/model';

function renderGalleryCard(resource:Resource,base='/') {
 return renderToString(React.createElement(GalleryCard,{
  resource,href:(path='')=>base+path,saved:false,onSave:()=>{},
  activeId:null,playing:false,onToggle:()=>{},onPlayback:()=>{},onVideo:()=>{},
 }));
}
function renderPreviewCards(items=homePreviewItems(),base='/') {
 return items.map(resource=>renderGalleryCard(resource,base)).join('');
}
function escapeHtml(value:string) {
 const entities:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'};
 return value.replace(/[&<>"']/g,char=>entities[char]);
}

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
  assert.match(preview.source,/^S-(?:CV|GVP)-\d{3} https:\/\//);
  assert.equal(previewPlayable(resource),preview.kind==='video');
  assert.equal(previewCaption(resource),preview.kind==='video'?'Upstream demo':'Preview');
  if(preview.redistributable)assert.notEqual(preview.kind,'embed');
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
test('gallery cards retain complete previews and featured covers without autoplay',()=>{
 const items=homePreviewItems();
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
 assert.match(html,/class="brand-hero"/);
 assert.equal(html.includes('hero-poster'),false);
 assert.match(html,/role="tablist"/);
 assert.equal(html.includes('EDITORIAL COVER'),false);
 assert.equal(html.includes('<iframe'),false);
 const cardHtml=renderPreviewCards(items);
 assert.equal([...cardHtml.matchAll(/Watch on YouTube/g)].length,items.filter(isYouTubePreview).length);
 const captions=[...cardHtml.matchAll(/<span class="art-caption">([^<]*)<\/span>/g)].map(m=>m[1]);
 assert.deepEqual(captions,items.map(r=>previewCaption(r)));
 const videos=[...cardHtml.matchAll(/<video\b[^>]*>/g)].map(m=>m[0]);
 const playable=items.filter(r=>previewPlayable(r));
 assert.equal(videos.length,playable.length);
 assert.equal(videos.filter(tag=>/\bsrc="/i.test(tag)).length,0);
 for(const tag of videos){
  assert.match(tag,/preload="none"/);
  assert.doesNotMatch(tag,/\bsrc="/i);
  assert.match(tag,/\bposter="(?:\/previews\/|https:\/\/)/i);
  assert.match(tag,/playsinline/i);
  assert.match(tag,/tabindex="-1"/);
  const attrs=tag.replace(/\s(?:src|poster)="[^"]*"/gi,'');
  assert.doesNotMatch(attrs,/\bautoplay\b/i);
  assert.doesNotMatch(attrs,/\bcontrols\b/i);
  assert.doesNotMatch(attrs,/\bmuted\b/i);
  assert.doesNotMatch(attrs,/\bloop\b/i);
 }
 const images=[...cardHtml.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
 const thumbs=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='thumb_link';});
 const posterStills=items.filter(r=>{const preview=resolvePreview(r);return preview.playable&&Boolean(preview.poster);});
 const pageStills=items.filter(r=>{const p=resolvePreview(r);return p.mode==='embed'&&p.poster;});
 assert.equal(images.length,thumbs.length+posterStills.length+pageStills.length);
 for(const tag of images){
  assert.match(tag,/loading="lazy"/);
  assert.match(tag,/decoding="async"/);
 }
 for(const resource of items){
  const preview=resolvePreview(resource);
  const resourceHtml=renderGalleryCard(resource);
  assert.match(resourceHtml,new RegExp(`href="/resources/${resource.id}/"`));
  assert.match(resourceHtml,new RegExp(`<p class="preview-note">${esc(preview.detail)}`));
  if(!preview.degraded){
   assert(resourceHtml.includes(escapeHtml(preview.license!)),resource.id);
   assert(resourceHtml.includes(escapeHtml(preview.attribution!)),resource.id);
  }
  if(preview.degraded){
   assert.equal(preview.caption,'Editorial cover');
   continue;
  }
  assert.match(resourceHtml,new RegExp(`href="${esc(preview.url!)}" class="preview-source"`));
  if(preview.playable){
   assert.match(resourceHtml,new RegExp(`<video\\b[^>]*id="preview-${resource.id.replaceAll('-','_')}"`));
   assert.doesNotMatch(resourceHtml,new RegExp(`<(?:video|img|source)\\b[^>]*src="${esc(preview.url!)}"`));
   if(preview.poster)assert.match(resourceHtml,new RegExp(`<img\\b[^>]*src="${esc(preview.poster)}"`));
  }
  if(preview.mode==='thumb_link')assert.match(resourceHtml,new RegExp(`<img\\b[^>]*src="${esc(preview.poster||preview.url!)}"`));
  if(preview.mode==='embed'){
   if(preview.poster)assert(resourceHtml.includes(`src="${preview.poster}"`));
   else assert.match(resourceHtml,/class="preview-embed"/);
   assert.doesNotMatch(resourceHtml,new RegExp(`<video\\b[^>]*src="${esc(preview.url!)}"`));
   assert.doesNotMatch(resourceHtml,new RegExp(`<img\\b[^>]*src="${esc(preview.url!)}"`));
  }
 }
 for(const resource of resources)assert.equal(cardHtml.includes(`href="/resources/${resource.id}/"`),galleryIds.has(resource.id),resource.id);
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 assert.equal(library.includes('<video'),false);
 assert.equal(library.includes('<img'),false);
 assert.match(library,/EDITORIAL COVER/);
 const detail=renderToString(React.createElement(App,{path:'/resources/lemo-watercolor/'}));
 assert.equal(detail.includes('<video'),false);
 assert.match(detail,/EDITORIAL COVER — NOT AN UPSTREAM RENDER/);
 const about=renderToString(React.createElement(App,{path:'/about/'}));
 assert.match(about,/A preview is not a local render test/);
 assert.match(about,/Playback starts muted/);
 assert.match(about,/Videos never autoplay/);
});
test('missing preview cards stay editorial and retain source review context',()=>{
 const resource={...resources.find(r=>r.id==='ink-press')!,preview:undefined};
 const html=renderGalleryCard(resource);
 assert.match(html,/Editorial cover/);
 assert.match(html,/not an upstream render/);
 assert.match(html,/class="preview-details"/);
 assert.match(html,/Source &amp; license/);
 assert(html.includes(resource.review.reviewed_at));
 assert.match(html,new RegExp(`href="/resources/${resource.id}/"`));
 assert.doesNotMatch(html,/<(?:video|img|iframe)\b/);
 assert.doesNotMatch(html,/class="preview-play"|class="preview-source"/);
});
test('playable gallery cards can start muted and other preview kinds stay unchanged',async()=>{
 const items=homePreviewItems();
 const playable=items.filter(r=>previewPlayable(r));
 const thumbs=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='thumb_link';});
 const embeds=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='embed';});
 const covers=items.filter(r=>resolvePreview(r).degraded);
 assert(playable.length>0);
 assert(thumbs.length>0);
 assert(embeds.length>0);
 assert.equal(playable.length+thumbs.length+embeds.length+covers.length,items.length);
 const html=renderPreviewCards(items);
 const cards=[...html.matchAll(/<article class="resource-card gallery-card"[^>]*>([\s\S]*?)<\/article>/g)].map(match=>match[1]);
 assert.equal(cards.length,items.length);
 const esc=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0]).filter(tag=>tag.includes('class="preview-play"'));
 assert.equal(buttons.length,playable.length);
 for(const button of buttons){
  assert.match(button,/type="button"/);
  assert.match(button,/aria-pressed="false"/);
  assert.doesNotMatch(button,/tabindex/i);
  assert.doesNotMatch(button,/is-armed/);
 }
 for(const resource of items){
  const card=cards.find(chunk=>chunk.includes(`href="/resources/${resource.id}/"`));
  assert.ok(card,resource.id);
  const preview=resolvePreview(resource);
  if(preview.playable){
   assert.match(card,new RegExp(`aria-label="Play upstream demo: ${esc(escapeHtml(resource.name))}"`));
   assert.match(card,new RegExp(`aria-controls="preview-${resource.id.replaceAll('-','_')}"`));
   assert.match(card,/<button\b[^>]*class="preview-play"/);
   assert.match(card,/<div class="art-link">/);
   assert.doesNotMatch(card,/<a\b[^>]*class="art-link"/);
   const video=card.match(/<video\b[^>]*>/)?.[0]??'';
   assert.match(video,/preload="none"/);
   assert.doesNotMatch(video,/\bsrc="/i);
   assert.match(video,/\bposter="(?:\/previews\/|https:\/\/)/i);
   assert.match(video,/tabindex="-1"/);
   const attrs=video.replace(/\s(?:src|poster)="[^"]*"/gi,'');
   assert.doesNotMatch(attrs,/\bautoplay\b/i);
   assert.doesNotMatch(attrs,/\bcontrols\b/i);
   assert.doesNotMatch(attrs,/\bmuted\b/i);
   assert.doesNotMatch(attrs,/\bloop\b/i);
   assert.doesNotMatch(card,new RegExp(`<img\\b[^>]*src="${esc(preview.url!)}"`));
   if(preview.poster){
    assert.match(card,new RegExp(`<img\\b[^>]*src="${esc(preview.poster)}"[^>]*loading="lazy"`));
    assert.match(card,/decoding="async"/);
   }else{
    assert.match(card,/class="visual /);
    assert.doesNotMatch(card,/<img\b/);
   }
  }else{
   assert.doesNotMatch(card,/preview-play/);
   assert.doesNotMatch(card,/<video\b/);
   assert.match(card,/<a\b[^>]*class="art-link"/);
   if(preview.degraded)assert.match(card,/class="visual /);
   if(!preview.degraded&&preview.mode==='thumb_link'){
    assert.match(card,/<img\b[^>]*loading="lazy"/);
    assert.match(card,/<img\b[^>]*decoding="async"/);
   }
   if(!preview.degraded&&preview.mode==='embed'){
    if(preview.poster)assert.match(card,/<img\b[^>]*loading="lazy"/);
    else {assert.match(card,/class="preview-embed"/);assert.doesNotMatch(card,/<img\b/);}
   }
  }
 }
 assert.equal(html.includes('<iframe'),false);
 assert.match(renderToString(React.createElement(App,{path:'/'})),/Click to play · Starts muted/);
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 assert.equal(library.includes('preview-play'),false);
 const detail=renderToString(React.createElement(App,{path:'/resources/lemo-watercolor/'}));
 assert.equal(detail.includes('preview-play'),false);
 function media(at=0):PreviewMedia & {calls:string[]}{
  const calls:string[]=[];
  let src='';
  const video:PreviewMedia & {calls:string[]}={
   muted:false,controls:false,currentTime:at,calls,
   get src(){return src;},
   set src(value:string){src=value;},
   play(){calls.push('play');return Promise.resolve();},
   pause(){calls.push('pause');},
   getAttribute(name:string){return name==='src'&&src?src:null;},
   removeAttribute(name:string){calls.push('remove:'+name);if(name==='src')src='';},
   load(){calls.push('load');},
  };
  return video;
 }
 const firstMedia=media(0);
 const secondMedia=media(0);
 const videos=new Map<string,PreviewMedia>([['first',firstMedia],['second',secondMedia]]);
 let state={activeId:null as string|null,playing:false};
 let step=toggleGalleryPlayback(state,'first',videos);
 state=step.state;
 assert.equal(state.activeId,'first');
 assert.equal(state.playing,true);
 assert.equal(firstMedia.muted,true);
 assert.equal(firstMedia.controls,true);
 assert.deepEqual(firstMedia.calls,['play']);
 assert.equal(step.play instanceof Promise,true);
 firstMedia.muted=false;
 firstMedia.currentTime=6;
 step=toggleGalleryPlayback(state,'first',videos);
 state=step.state;
 assert.deepEqual(state,{activeId:'first',playing:false});
 assert.equal(firstMedia.currentTime,6);
 assert.equal(firstMedia.controls,true);
 assert.equal(firstMedia.muted,false);
 assert.deepEqual(firstMedia.calls,['play','pause']);
 assert.equal(step.play,null);
 step=toggleGalleryPlayback(state,'first',videos);
 state=step.state;
 assert.equal(state.playing,true);
 assert.equal(firstMedia.muted,false);
 assert.equal(firstMedia.currentTime,6);
 firstMedia.currentTime=4;
 step=toggleGalleryPlayback(state,'second',videos);
 state=step.state;
 assert.deepEqual(state,{activeId:'second',playing:true});
 assert.equal(firstMedia.currentTime,0);
 assert.equal(firstMedia.controls,false);
 assert.equal(firstMedia.calls.includes('pause'),true);
 assert.equal(secondMedia.muted,true);
 assert.equal(secondMedia.controls,true);
 assert.deepEqual(secondMedia.calls,['play']);
 const unchanged=toggleGalleryPlayback(state,'missing-preview',videos);
 assert.equal(unchanged.state,state);
 const blocked=media();
 blocked.play=()=>Promise.reject(new Error('blocked'));
 const failed=toggleGalleryPlayback({activeId:null,playing:false},'blocked',new Map([['blocked',blocked]]));
 assert.ok(failed.play);
 await assert.rejects(failed.play);
 assert.deepEqual(abandonGalleryPlayback(failed.state,'blocked'),{activeId:null,playing:false});
 assert.deepEqual(abandonGalleryPlayback(failed.state,'other'),failed.state);
 const stuck=media(3);
 Object.defineProperty(stuck,'currentTime',{configurable:true,get(){return 3;},set(){throw new Error('no metadata');}});
 resetPreview(stuck);
 assert.equal(stuck.controls,false);
 assert.deepEqual(stuck.calls,['pause']);
 const thrown=media();
 thrown.play=()=>{throw new Error('no player');};
 const rejected=toggleGalleryPlayback({activeId:null,playing:false},'thrown',new Map([['thrown',thrown]]));
 assert.ok(rejected.play);
 await assert.rejects(rejected.play);
 const clip='https://cdn.example/demo.mp4';
 const otherClip='https://cdn.example/other.mp4';
 const firstClip=media(0);
 const secondClip=media(0);
 const deferredVideos=new Map<string,PreviewMedia>([['first',firstClip],['second',secondClip]]);
 const deferredSources=new Map([['first',clip],['second',otherClip]]);
 let deferred=toggleGalleryPlayback({activeId:null,playing:false},'first',deferredVideos,deferredSources);
 assert.equal(deferred.state.activeId,'first');
 assert.equal(deferred.state.playing,true);
 assert.equal(firstClip.getAttribute('src'),clip);
 assert.equal(firstClip.muted,true);
 assert.deepEqual(firstClip.calls,['play']);
 firstClip.muted=false;
 firstClip.currentTime=5;
 deferred=toggleGalleryPlayback(deferred.state,'first',deferredVideos,deferredSources);
 assert.deepEqual(deferred.state,{activeId:'first',playing:false});
 assert.equal(firstClip.getAttribute('src'),clip);
 assert.equal(firstClip.currentTime,5);
 assert.equal(firstClip.muted,false);
 assert.equal(firstClip.calls.includes('load'),false);
 assert.equal(firstClip.calls.includes('remove:src'),false);
 deferred=toggleGalleryPlayback(deferred.state,'first',deferredVideos,deferredSources);
 assert.equal(deferred.state.playing,true);
 assert.equal(firstClip.muted,false);
 assert.equal(firstClip.currentTime,5);
 assert.equal(firstClip.getAttribute('src'),clip);
 deferred=toggleGalleryPlayback(deferred.state,'second',deferredVideos,deferredSources);
 assert.deepEqual(deferred.state,{activeId:'second',playing:true});
 assert.equal(firstClip.getAttribute('src'),null);
 assert.equal(firstClip.controls,false);
 assert.equal(firstClip.currentTime,0);
 assert.equal(firstClip.calls.includes('pause'),true);
 assert.equal(firstClip.calls.includes('remove:src'),true);
 assert.equal(firstClip.calls.includes('load'),true);
 assert.equal(secondClip.getAttribute('src'),otherClip);
 assert.equal(secondClip.muted,true);
 assert.deepEqual(secondClip.calls,['play']);
});
test('all pages render server-side without browser APIs and internal links resolve',()=>{
 const paths=allPaths();const valid=new Set(paths.map(p=>'/preview/'+p));
 for(const path of paths){const html=renderToString(React.createElement(App,{path:'/preview/'+path,base:'/preview/'}));
 assert(html.includes('<h1'),path);
 for(const match of html.matchAll(/<a\b[^>]*href="(\/preview\/[^"?#]*)/g))assert(valid.has(match[1]),`Broken link ${match[1]} on ${path}`);
 }
 assert.equal(projects.length,new Set(projects.map(p=>p.id)).size);
});

test('GIF previews render as lazy images without video players or Play buttons',()=>{
 const gifs=resources.filter(r=>r.preview&&/\.gif$/i.test(new URL(r.preview.url).pathname));
 assert.ok(gifs.length>0);
 assert.ok(gifs.every(r=>r.preview!.kind==='thumb_link'));
 const html=renderPreviewCards(gifs);
 for(const resource of gifs){
  const preview=resolvePreview(resource);
  assert.equal(preview.degraded,false,resource.id);
  assert.equal(preview.mode,'thumb_link',resource.id);
  assert.equal(preview.playable,false,resource.id);
  assert(html.includes(`src="${resource.preview!.poster||resource.preview!.url}"`),resource.id);
  assert(!html.includes(`id="preview-${resource.id.replaceAll('-','_')}"`),resource.id);
 }
 for(const resource of gifs){
  assert(resource.preview!.poster?.startsWith('/previews/'),resource.id);
  assert(html.includes(`href="${resource.preview!.url}"`),resource.id);
 }
 const video=resources.find(r=>r.preview?.kind==='video')!;
 for(const url of ['https://example.com/demo.gif','https://example.com/DEMO.GIF?raw=1#preview']){
  assert.equal(resolvePreview({preview:{...video.preview,url}}).degraded,true);
  assert.equal(previewPlayable({preview:{...video.preview,url}}),false);
 }
});

test('bundled video posters respect the deployment base without loading MP4s',()=>{
 const video=resources.find(r=>r.preview?.kind==='video')!;
 const preview={...video.preview,poster:'/previews/example-frame.webp'};
 assert.equal(previewPoster({preview}),preview.poster);
 for(const poster of ['/previews/../secret.webp','//example.com/frame.webp','/previews/a.svg','/previews/a.webp?x=1']){
  assert.equal(resolvePreview({preview:{...preview,poster}}).degraded,true);
 }
 const base='/gallery/';
 const html=renderPreviewCards(homePreviewItems(),base);
 for(const resource of resources.filter(r=>r.preview?.poster?.startsWith('/previews/'))){
  assert(html.includes(`src="${base}${resource.preview!.poster!.slice(1)}"`),resource.id);
 }
 for(const [tag] of html.matchAll(/<video\b[^>]*>/g))assert.doesNotMatch(tag,/\bsrc=/);
});

test('homepage hero has a code-only static fallback and stays separate from resource previews',()=>{
 for(const base of ['/','/gallery/']){
  const home=renderToString(React.createElement(App,{path:base,base}));
  assert.match(home,/class="[^"]*\bhome-site\b[^"]*"/);
  assert.match(home,/id="explore"/);
  assert.match(home,/href="(?:\/gallery\/)?#explore"/);
  const hero=home.match(/<section\b[^>]*class="brand-hero"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(hero,'homepage includes its hero');
  const canvas=hero.match(/<canvas\b[^>]*>/)?.[0];
  const fallback=hero.match(/<svg\b[^>]*class="hero-motion-fallback"[^>]*>[\s\S]*?<\/svg>/)?.[0];
  assert.ok(canvas,'animation has a canvas host');
  assert.ok(fallback,'initial HTML has a vector composition without JavaScript');
  assert.match(canvas,/aria-hidden="true"/,'decorative animation does not duplicate the heading');
  assert.match(fallback,/aria-hidden="true"/);
  assert.match(fallback,/<(?:path|circle|ellipse|rect|polygon)\b/,'fallback contains visible geometry');
  assert.doesNotMatch(hero,/<(?:img|video|iframe)\b|art\/code-in-motion\.webp/,'hero requires no external media');
  const cards=renderPreviewCards(homePreviewItems(),base);
  assert.doesNotMatch(cards,/hero-motion|art\/code-in-motion\.webp/,'brand scene is never presented as an upstream preview');
  const library=renderToString(React.createElement(App,{path:`${base}library/`,base}));
  assert.doesNotMatch(library,/\bhome-site\b|hero-motion|art\/code-in-motion\.webp/);
 }
});

test('homepage tabs expose totals and mount only the first video batch',()=>{
 const groups=homePreviewGroups();
 const videoFiles=groups.videos.filter(r=>r.preview?.kind==='video');
 const pageEmbeds=groups.videos.filter(r=>r.preview?.kind==='embed');
 assert.equal(videoFiles.length+pageEmbeds.length,groups.videos.length);
 assert.ok(videoFiles.every(r=>previewPlayable(r)));
 assert.ok(pageEmbeds.every(isYouTubePreview));
 assert.deepEqual(homeGalleryItems(),groups.videos);
 const all=Object.values(groups).flat();
 assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 assert.deepEqual(new Set(all.map(r=>r.id)),new Set(homePreviewItems().map(r=>r.id)));
 const html=renderToString(React.createElement(App,{path:'/'}));
 const landscape=groups.videos.filter(r=>videoOrientation(r)==='landscape');
 const firstBatch=landscape.slice(0,GALLERY_BATCH_SIZE);
 const firstIds=new Set(firstBatch.map(r=>r.id));
 const tabs=[...html.matchAll(/<button\b([^>]*role="tab"[^>]*)>([\s\S]*?)<\/button>/g)];
 assert.equal(tabs.length,3);
 const labels=['Video gallery','Animated examples','Other resources'];
 const items=[groups.videos,groups.animations,groups.other];
 for(const [index,id] of GALLERY_CATEGORY_IDS.entries()){
  const tab=tabs[index];
  assert.match(tab[1],new RegExp(`aria-controls="${id}"`));
  assert.match(tab[1],new RegExp(`aria-selected="${index===0}"`));
  assert.match(tab[1],new RegExp(`tabindex="${index===0?0:-1}"`));
  assert(tab[2].includes(labels[index]));
  assert.match(tab[2],new RegExp(`<span[^>]*>${items[index].length}</span>`));
  const tabId=tab[1].match(/\bid="([^"]+)"/)![1];
  const panel=html.match(new RegExp(`<section\\b([^>]*\\bid="${id}"[^>]*)>([\\s\\S]*?)</section>`));
  assert.ok(panel,id);
  assert.match(panel[1],/role="tabpanel"/);
  assert.match(panel[1],new RegExp(`aria-labelledby="${tabId}"`));
  if(index===0){
   assert.doesNotMatch(panel[1],/\bhidden(?:=|\s|$)/);
   assert.equal([...panel[2].matchAll(/class="resource-card gallery-card"/g)].length,firstBatch.length);
   assert.equal([...panel[2].matchAll(/<video\b/g)].length,firstBatch.filter(previewPlayable).length);
  }else{
   assert.match(panel[1],/\bhidden(?:=|\s|$)/);
   assert.doesNotMatch(panel[2],/<(?:article|video|img)\b/);
  }
 }
 for(const resource of resources)assert.equal(html.includes(`href="/resources/${resource.id}/"`),firstIds.has(resource.id),resource.id);
 assert.match(html.replace(/<!--[\s\S]*?-->/g,''),new RegExp(`Showing ${firstBatch.length} of ${landscape.length} videos`));
 assert.match(html.replace(/<!--[\s\S]*?-->/g,''),/Load 12 more/);
 assert.match(html,/<noscript>[\s\S]*href="\/library\/"[\s\S]*<\/noscript>/);
 const youtube=groups.videos.find(r=>r.preview?.kind==='embed')!;
 const spoof={...youtube,preview:{...youtube.preview!,url:'https://www.youtube.com.example.org/embed/H5GETOP7ivs'}};
 assert.equal(homeGalleryItems([spoof]).length,0);
 const featured=resources.find(r=>r.id==='ink-press')!;
 assert.equal(homeGalleryItems([{...featured,preview:undefined}]).length,0);
});

test('gallery browsing preserves each category batch and caps the last load',()=>{
 assert.equal(GALLERY_BATCH_SIZE,12);
 const initial=createGalleryBrowseState();
 assert.equal(initial.activeCategory,'video-gallery');
 assert.deepEqual(initial.visibleCounts,{'video-gallery':12,'animated-examples':12,'other-resources':12});
 assert.equal(selectGalleryCategory(initial,'video-gallery'),initial);
 const videos=loadMoreGalleryItems(initial,92);
 assert.equal(videos.visibleCounts['video-gallery'],24);
 assert.equal(initial.visibleCounts['video-gallery'],12,'previous state stays immutable');
 const animations=selectGalleryCategory(videos,'animated-examples');
 assert.equal(animations.visibleCounts['animated-examples'],12);
 const moreAnimations=loadMoreGalleryItems(animations,47);
 assert.equal(moreAnimations.visibleCounts['animated-examples'],24);
 const backToVideos=selectGalleryCategory(moreAnimations,'video-gallery');
 assert.equal(backToVideos.visibleCounts['video-gallery'],24);
 assert.equal(backToVideos.visibleCounts['animated-examples'],24);
 const other=selectGalleryCategory(backToVideos,'other-resources');
 const lastOther=loadMoreGalleryItems(other,13);
 assert.equal(lastOther.visibleCounts['other-resources'],13);
 assert.equal(lastOther.visibleCounts['video-gallery'],24);
 assert.equal(lastOther.visibleCounts['animated-examples'],24);
 assert.equal(loadMoreGalleryItems(lastOther,13),lastOther,'completed categories do not add duplicates');
 assert.equal(loadMoreGalleryItems(lastOther,5),lastOther,'loading does not reduce an existing batch');
 let completeVideos=selectGalleryCategory(lastOther,'video-gallery');
 const sizes=[completeVideos.visibleCounts['video-gallery']];
 for(let batch=0;batch<6;batch++){
  completeVideos=loadMoreGalleryItems(completeVideos,92);
  sizes.push(completeVideos.visibleCounts['video-gallery']);
 }
 assert.deepEqual(sizes,[24,36,48,60,72,84,92]);
 assert.equal(loadMoreGalleryItems(completeVideos,92),completeVideos);
 assert.equal(selectGalleryCategory(completeVideos,'other-resources').visibleCounts['other-resources'],13);
});


test('video orientation uses measured source dimensions and rejects stale metadata',()=>{
 const portrait=resources.find(r=>r.id==='butterfly-life')!;
 assert.equal(videoOrientation(portrait),'portrait');
 assert.equal(videoOrientation(resources.find(r=>r.id==='awesome-video-as-code')!),'landscape');
 assert.equal(videoOrientation({...portrait,preview:{...portrait.preview!,url:'https://example.com/replaced.mp4'}}),'unknown');
 assert.equal(videoOrientation({...portrait,preview:undefined}),'unknown');
 const videos=homeGalleryItems();
 for(const format of ['landscape','portrait','square'])assert.ok(videos.some(r=>videoOrientation(r)===format));
});


test('reviewed YouTube projects are landscape without classifying replacement URLs',()=>{
 const embeds=homeGalleryItems().filter(isYouTubePreview);
 assert.equal(embeds.length,5);
 for(const resource of embeds){
  assert.equal(videoOrientation(resource),'landscape',resource.id);
  assert.equal(videoOrientation({...resource,preview:{...resource.preview!,url:'https://www.youtube.com/embed/abcdefghijk'}}),'unknown');
 }
 assert.equal(homeGalleryItems().filter(r=>videoOrientation(r)==='unknown').length,0);
 const html=renderToString(React.createElement(App,{path:'/'}));
 assert.doesNotMatch(html,/Unconfirmed format/);
});
