import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App} from '../web/src/App';
import {abandonGalleryPlayback,resetPreview,toggleGalleryPlayback,type PreviewMedia} from '../web/src/galleryPlayback';
import {allPaths,resources,projects,collections,filterResources,routeForPath,pageMeta,coreCount,isCore,featuredIds,homeGalleryItems,homePreviewItems,homePreviewGroups,isYouTubePreview,previewCaption,previewMode,previewPlayable,previewPoster,previewUrl,resolvePreview} from '../web/src/model';

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
test('homepage gallery lists complete previews and featured covers without autoplay',()=>{
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
 assert.match(html,/class="hero hero-short"/);
 assert.equal(html.includes('hero-poster'),false);
 assert.match(html,/aria-label="Video gallery"/);
 assert.match(html,/Nothing on this page is a local render test/);
 assert.equal(html.includes('EDITORIAL COVER'),false);
 assert.equal(html.includes('<iframe'),false);
 const captions=[...html.matchAll(/<span class="art-caption">([^<]*)<\/span>/g)].map(m=>m[1]);
 assert.deepEqual(captions,Object.values(homePreviewGroups()).flat().map(r=>previewCaption(r)));
 const videos=[...html.matchAll(/<video\b[^>]*>/g)].map(m=>m[0]);
 const playable=items.filter(r=>previewPlayable(r));
 assert.equal(videos.length,playable.length);
 assert.equal(videos.filter(tag=>/\bsrc="/i.test(tag)).length,0);
 for(const tag of videos){
  assert.match(tag,/preload="none"/);
  assert.doesNotMatch(tag,/\bsrc="/i);
  assert.match(tag,/\bposter="\/previews\//i);
  assert.match(tag,/playsinline/i);
  assert.match(tag,/tabindex="-1"/);
  const attrs=tag.replace(/\s(?:src|poster)="[^"]*"/gi,'');
  assert.doesNotMatch(attrs,/\bautoplay\b/i);
  assert.doesNotMatch(attrs,/\bcontrols\b/i);
  assert.doesNotMatch(attrs,/\bmuted\b/i);
  assert.doesNotMatch(attrs,/\bloop\b/i);
 }
 const images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
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
  assert.match(html,new RegExp(`href="/resources/${resource.id}/"`));
  assert.match(html,new RegExp(`<p class="preview-note">${esc(preview.detail)}`));
  if(preview.degraded){
   assert.equal(preview.caption,'Editorial cover');
   continue;
  }
  assert.match(html,new RegExp(`href="${esc(preview.url!)}" class="preview-source"`));
  if(preview.playable){
   assert.match(html,new RegExp(`<video\\b[^>]*id="preview-${resource.id.replaceAll('-','_')}"`));
   assert.doesNotMatch(html,new RegExp(`<(?:video|img|source)\\b[^>]*src="${esc(preview.url!)}"`));
   if(preview.poster)assert.match(html,new RegExp(`<img\\b[^>]*src="${esc(preview.poster)}"`));
  }
  if(preview.mode==='thumb_link')assert.match(html,new RegExp(`<img\\b[^>]*src="${esc(preview.poster||preview.url!)}"`));
  if(preview.mode==='embed'){
   if(preview.poster)assert(html.includes(`src="${preview.poster}"`));
   else assert.match(html,/class="preview-embed"/);
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
 assert.match(about,/Playback starts muted/);
 assert.match(about,/Videos never autoplay/);
});
test('homepage playable cards can start muted and other preview kinds stay unchanged',async()=>{
 const items=homePreviewItems();
 const playable=items.filter(r=>previewPlayable(r));
 const thumbs=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='thumb_link';});
 const embeds=items.filter(r=>{const preview=resolvePreview(r);return !preview.degraded&&preview.mode==='embed';});
 const covers=items.filter(r=>resolvePreview(r).degraded);
 assert(playable.length>0);
 assert(thumbs.length>0);
 assert(embeds.length>0);
 assert.equal(playable.length+thumbs.length+embeds.length+covers.length,items.length);
 const html=renderToString(React.createElement(App,{path:'/'}));
 const cards=[...html.matchAll(/<article class="resource-card gallery-card">([\s\S]*?)<\/article>/g)].map(match=>match[1]);
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
   assert.match(card,new RegExp(`aria-label="Play upstream demo: ${esc(resource.name)}"`));
   assert.match(card,new RegExp(`aria-controls="preview-${resource.id.replaceAll('-','_')}"`));
   assert.match(card,/<button\b[^>]*class="preview-play"/);
   assert.match(card,/<div class="art-link">/);
   assert.doesNotMatch(card,/<a\b[^>]*class="art-link"/);
   const video=card.match(/<video\b[^>]*>/)?.[0]??'';
   assert.match(video,/preload="none"/);
   assert.doesNotMatch(video,/\bsrc="/i);
   assert.match(video,/\bposter="\/previews\//i);
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
 assert.match(html,/Playback starts muted/);
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
 for(const match of html.matchAll(/href="(\/preview\/[^"?#]*)/g))assert(valid.has(match[1]),`Broken link ${match[1]} on ${path}`);
 }
 assert.equal(projects.length,new Set(projects.map(p=>p.id)).size);
});

test('GIF previews render as lazy images without video players or Play buttons',()=>{
 const gifs=resources.filter(r=>r.preview&&/\.gif$/i.test(new URL(r.preview.url).pathname));
 assert.ok(gifs.length>0);
 assert.ok(gifs.every(r=>r.preview!.kind==='thumb_link'));
 const html=renderToString(React.createElement(App,{path:'/'}));
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
 const html=renderToString(React.createElement(App,{path:base,base}));
 for(const resource of resources.filter(r=>r.preview?.poster?.startsWith('/previews/'))){
  assert(html.includes(`src="${base}${resource.preview!.poster!.slice(1)}"`),resource.id);
 }
 for(const [tag] of html.matchAll(/<video\b[^>]*>/g))assert.doesNotMatch(tag,/\bsrc=/);
});

test('homepage separates videos, animated images and other resources without duplicates',()=>{
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
 const section=(id:string)=>html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`))![1];
 const videos=section('video-gallery');
 assert.equal([...videos.matchAll(/class="resource-card gallery-card"/g)].length,groups.videos.length);
 assert.equal([...videos.matchAll(/<video\b/g)].length,videoFiles.length);
 assert.equal([...videos.matchAll(/Watch on YouTube/g)].length,pageEmbeds.length);
 for(const [id,items] of [['animated-examples',groups.animations],['other-resources',groups.other]] as const){
  const content=section(id);
  assert.equal([...content.matchAll(/class="resource-card gallery-card"/g)].length,items.length);
  assert.doesNotMatch(content,/<video\b/);
  assert.match(html,new RegExp(`href="#${id}"`));
 }
 const youtube=groups.videos.find(r=>r.preview?.kind==='embed')!;
 const spoof={...youtube,preview:{...youtube.preview!,url:'https://www.youtube.com.example.org/embed/H5GETOP7ivs'}};
 assert.equal(homeGalleryItems([spoof]).length,0);
 const featured=resources.find(r=>r.id==='ink-press')!;
 assert.equal(homeGalleryItems([{...featured,preview:undefined}]).length,0);
});
