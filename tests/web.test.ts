import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App,GalleryCard,coverStill} from '../web/src/App';
import {GALLERY_BATCH_SIZE,GALLERY_CATEGORY_IDS,createGalleryBrowseState,selectGalleryCategory,loadMoreGalleryItems} from '../web/src/galleryBrowsing';
import {abandonGalleryPlayback,resetPreview,toggleGalleryPlayback,type PreviewMedia} from '../web/src/galleryPlayback';
import resourceData from '../data/resources.json';
import projectData from '../data/projects.json';
import {isolationRule} from '../scripts/lib/public-display.mjs';
import {RESOURCE_TAG_VALUES} from '../scripts/lib/catalog.mjs';
import {CHART_TOTAL} from '../web/src/heroReel';
import {FABLE_SPOTLIGHT_PATH,fableSpotlightHomeItems,fableSpotlightItems} from '../web/src/fableSpotlight';
import {allPaths,resources,projects,collections,filterResources,routeForPath,pageMeta,coreCount,isCore,isolatedProjectId,featuredIds,featuredGalleryIds,featuredGalleryItems,homeGalleryItems,homePreviewItems,homePreviewGroups,videoOrientation,previewSpecs,kindCount,kindNames,kindGroups,completenessFilters,matchesCompleteness,projectPackageFilter,tagFilterAllowlist,tagFilterVocabulary,isYouTubePreview,previewCaption,previewMode,previewPlayable,previewPoster,previewUrl,resolvePreview,type Resource} from '../web/src/model';

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

const FEATURED_GALLERY = ['remotion-templates-3d-device-stages-macro','lemo-teardown','claude-quest','remotion-templates-abstract-geometry-orbital-rings','video-shotcraft-fracture','lemo-opuscar-transit-map','paper-cut-five-layer-motion','hyperframes-data-chart'];
const FEATURED_FALLBACK = ['ink-press','paper-cut-five-layer-motion','map-motion-globe-to-location','lemo-opuscar-swiss-motion-graphics','claude-quest','hyperframes-data-chart'];
const COLLECTION_ORDER: Record<string,string[]> = {
 'product-demos':['kinetic-tech','ink-press','video-shotcraft-type-and-filter','video-shotcraft-space-camera-moves','webreel-custom-theme','webreel-drag-and-drop','webreel-mobile-viewport','guizang-product-video-skill'],
 'explainers':['paper-cut-five-layer-motion','butterfly-life','anatomy-ripple-tank','lemo-opuscar-whiteboard-explainer','lemo-opuscar-isometric-infographic','llm-explain','lemo-watercolor','lemo-teardown'],
 'maps-and-travel':['map-motion-globe-to-location','map-motion-night-location','map-motion-hiking-elevation','map-motion-road-trip','map-motion-flight-routes','map-motion-radial-coverage'],
 'data-stories':['hyperframes-data-chart','video-shotcraft-chart-live-moves','lemo-opuscar-data-storytelling','lemo-opuscar-blueprint','lemo-briefing-board'],
 'type-and-captions':['pretext','video-shotcraft-text-as-mask','video-shotcraft-paper-title-card','video-shotcraft-document-typewriter-reveal','amicro-line-reveal','remotion-tiktok','remotion-audiogram','hyperframes-yt-lower-third','lemo-opuscar-caption-news'],
 'retro-and-playful':['claude-quest','lemo-opuscar-16-bit-pixel-rpg','lemo-opuscar-ascii-crt-terminal','remotion-code-hike'],
};

test('public surfaces omit the isolated freelancer-templates inventory',()=>{
 const isolated=resourceData.filter(resource=>resource.project_id===isolationRule.resource_project_id);
 assert.equal(isolationRule.resource_project_id,isolatedProjectId);
 assert.equal(isolated.length,688);
 assert.equal(resourceData.length,1001);
 assert.equal(resources.length,313);
 assert.equal(resources.filter(resource=>resource.preview).length,305);
 assert.equal(resources.filter(resource=>resource.preview?.kind==='video').length,228);
 assert.equal(resources.filter(resource=>resource.preview?.kind==='thumb_link').length,71);
 assert.equal(resources.filter(resource=>resource.preview?.kind==='embed').length,6);
 assert.equal(coreCount,267);
 assert.equal(projectData.some(project=>project.id===isolatedProjectId),true);
 assert.equal(projects.some(project=>project.id===isolatedProjectId),false);
 assert.equal(resources.some(resource=>resource.project_id===isolatedProjectId||resource.id.startsWith('freelancer-')),false);
 const sample=isolated[0];
 assert.equal(filterResources({q:sample.name}).some(resource=>resource.id===sample.id),false);
 assert.equal(filterResources({q:'freelancer'}).length,0);
 assert.equal(filterResources({project:isolatedProjectId}).length,0);
 assert.equal(routeForPath(`/resources/${sample.id}/`).type,'notfound');
 assert.equal(routeForPath(`/projects/${isolatedProjectId}/`).type,'notfound');
 const paths=allPaths();
 assert.equal(paths.some(path=>path.includes('freelancer-')),false);
 assert.equal(paths.filter(path=>path!=='saved/').some(path=>isolated.some(resource=>path===`resources/${resource.id}/`)),false);
 assert.deepEqual([...featuredGalleryIds],FEATURED_GALLERY);
 assert.deepEqual([...featuredIds],FEATURED_FALLBACK);
 assert.equal(collections.length,6);
 for(const collection of collections)assert.deepEqual(collection.ids,COLLECTION_ORDER[collection.id]);
 const home=renderToString(React.createElement(App,{path:'/'}));
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 const projectIndex=renderToString(React.createElement(App,{path:'/projects/'}));
 const direct=renderToString(React.createElement(App,{path:`/resources/${sample.id}/`}));
 const project=renderToString(React.createElement(App,{path:`/projects/${isolatedProjectId}/`}));
 for(const html of [home,library,projectIndex,direct,project]){
  assert.equal(html.includes(sample.id),false);
  assert.equal(html.includes('freelancer-templates.org'),false);
  assert.equal(html.includes('linda-mhmd/freelancer-templates'),false);
 }
 assert.match(home,/<b>313<\/b><span>curated resources<\/span>/);
 assert.match(home,/<b>142<\/b><span>films &amp; scenes<\/span>/);
 assert.match(home,/<b>79<\/b><span>shots &amp; presets<\/span>/);
 assert.match(home,/<b>46<\/b><span>visual styles<\/span>/);
 assert.match(home,/<b>54<\/b><span>source projects<\/span>/);
 assert.equal(projects.length,54);
 assert.equal(kindCount('workflow'),19);
 assert.equal(kindCount('framework'),10);
 assert.equal(kindCount('tool'),4);
 assert.equal(homeGalleryItems().filter(resource=>resource.preview?.kind==='video').length,228);
 assert.equal(CHART_TOTAL,resources.length);
 assert.doesNotMatch(home,/\b984\b|\b986\b|\b989\b|\b992\b|\b994\b|\b997\b|\b998\b|\b1001\b/);
 assert.doesNotMatch(library,/\b984\b|\b986\b|\b989\b|\b992\b|\b994\b|\b997\b|\b998\b|\b1001\b/);
 assert.doesNotMatch(projectIndex,/\/previews\/freelancer-/);
 assert.doesNotMatch(library,/\/previews\/freelancer-/);
 assert.match(library,/<b>313<\/b> resources/);
 assert.equal(projectIndex.includes('Freelancer Templates'),false);
 assert.equal(direct.includes(sample.name),false);
 assert.equal(project.includes('Freelancer Templates'),false);
});

test('every public resource and project has exactly one stable route',()=>{
 const paths=allPaths();assert.equal(new Set(paths).size,paths.length);
 for(const r of resources){assert(paths.includes(`resources/${r.id}/`));assert.equal(routeForPath(`/resources/${r.id}/`).type,'resource');}
 assert.equal(coreCount,resources.filter(isCore).length);
 for(const c of collections)for(const id of c.ids)assert(resources.some(r=>r.id===id),`Unknown collection resource ${id}`);
});
test('library filters split films from scenes and read stored completeness fields',()=>{
 assert.equal(resources.length,301);
 assert.equal(projects.length,42);
 assert.equal(coreCount,267);
 assert.equal(kindCount('film'),37);
 assert.equal(kindCount('scene'),105);
 assert.equal(kindCount('film','scene'),142);
 const grouped=kindGroups.flatMap(group=>group.kinds.map(kind=>kind.id));
 assert.deepEqual(new Set(grouped),new Set(Object.keys(kindNames)));
 assert.equal(new Set(grouped).size,grouped.length);
 assert.deepEqual(kindGroups.find(group=>group.id==='core')!.kinds.map(kind=>kind.id),['film','scene','shot','preset','style']);
 assert.deepEqual(kindGroups.find(group=>group.id==='reference')!.kinds.map(kind=>kind.id),['workflow','generative_prompt','framework','tool','collection']);
 assert.equal(filterResources({kind:'film'}).length,37);
 assert.equal(filterResources({kind:'scene'}).length,105);
 assert.ok(filterResources({kind:'film'}).every(resource=>resource.kind==='film'));
 assert.ok(filterResources({kind:'scene'}).every(resource=>resource.kind==='scene'));
 for(const item of completenessFilters){
  const matched=filterResources({[item.id]:'1'});
  assert.equal(matched.length,resources.filter(resource=>matchesCompleteness(resource,item.id)).length,item.id);
  assert.ok(matched.every(resource=>matchesCompleteness(resource,item.id)),item.id);
 }
 const prompted=filterResources({prompt:'1'});
 assert.equal(prompted.length,kindCount('generative_prompt'));
 assert.ok(prompted.every(resource=>resource.kind==='generative_prompt'&&matchesCompleteness(resource,'prompt')));
 const filmsWithVideo=filterResources({kind:'film',video:'1'});
 assert.equal(filmsWithVideo.length,resources.filter(resource=>resource.kind==='film'&&resource.preview?.kind==='video').length);
 assert.equal(filterResources({package:'1'}).length,resources.length,'a missing project-package field does not filter');
 assert.equal(projectPackageFilter.active,false);
 assert.equal(tagFilterVocabulary.status,'ready');
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 assert.ok(library.indexOf('kind-group-core')<library.indexOf('kind-group-reference'));
 assert.match(library,/Films<span>37<\/span>/);
 assert.match(library,/Scenes<span>105<\/span>/);
 assert.match(library,/Map animation presets<span>6<\/span>/);
 assert.match(library,/Shot recipes<span>73<\/span>/);
 assert.match(library,/Visual styles<span>46<\/span>/);
 assert.match(library,/Optional stack and genre tags\. Some resources have none\. Filtering does not change the catalog\./);
 assert.match(library,/Stack and genre tags are optional, and some resources have none\. Filtering does not change the catalog itself\./);
 assert.doesNotMatch(library,/Waiting for the controlled vocabulary/);
 assert.doesNotMatch(library,/Tags stay off/);
 assert.match(library,/No project-package field is stored/);
 const tagField=library.slice(library.indexOf('<fieldset class="filter-tags"'),library.indexOf('</fieldset>',library.indexOf('<fieldset class="filter-tags"')));
 assert.equal(tagField.includes('disabled'),false);
 assert.match(library,/<input[^>]*disabled[^>]*aria-describedby="package-filter-note"/);
 assert.doesNotMatch(library,/<option[^>]*>Film \(/);
 assert.equal([...library.matchAll(/<div class="art-frame"/g)].length,resources.length);
 const about=renderToString(React.createElement(App,{path:'/about/'}));
 assert.ok(about.indexOf('kind-group-copy-core')<about.indexOf('kind-group-copy-reference'));
 assert.match(about,/These groups are not new catalog sections/);
 assert.match(about,/The README still lists films and scenes together/);
 const home=renderToString(React.createElement(App,{path:'/'})).replace(/<!--[\s\S]*?-->/g,'');
 const signal=home.match(/<section\b[^>]*class="collection-signal"[^>]*>([\s\S]*?)<\/section>/)![1];
 assert.match(signal,/<b>301<\/b><span>curated resources<\/span>/);
 assert.match(signal,/<b>142<\/b><span>films &amp; scenes<\/span>/);
 assert.match(signal,/<b>42<\/b><span>source projects<\/span>/);
 assert.doesNotMatch(signal,/<b>296<\/b>/);
 assert.doesNotMatch(signal,/<b>37<\/b><span>source projects/);
 assert.match(home,/href="\/library\/\?kind=film">37 /);
 assert.match(home,/href="\/library\/\?kind=scene">105 /);
});
test('library tag filters list used public stack and genre values only',()=>{
 assert.deepEqual([...tagFilterAllowlist.stack],[...RESOURCE_TAG_VALUES.stack]);
 assert.deepEqual([...tagFilterAllowlist.genre],[...RESOURCE_TAG_VALUES.genre]);
 assert.deepEqual(tagFilterVocabulary.groups.map(group=>group.id),['stack','genre']);
 const tagged=resources.filter(resource=>resource.tags);
 const untagged=resources.filter(resource=>!resource.tags);
 assert.equal(tagged.length,215);
 assert.equal(untagged.length,86);
 assert.equal(resources.filter(resource=>resource.tags?.stack?.length).length,203);
 assert.equal(resources.filter(resource=>resource.tags?.genre?.length).length,21);
 assert.equal(resources.filter(resource=>resource.tags?.stack?.length&&resource.tags?.genre?.length).length,9);
 const open=filterResources();
 assert.equal(open.length,301);
 assert.ok(open.some(resource=>resource.id==='map-motion-globe-to-location'&&!resource.tags));
 assert.deepEqual(tagFilterVocabulary.groups[0].options.map(option=>[option.value,option.count]),[
  ['remotion',146],['hyperframes',45],['motion-canvas',5],['revideo',2],['theatre-js',1],['threejs',1],['html',2],['python',2],['manim',1],
 ]);
 assert.deepEqual(tagFilterVocabulary.groups[1].options.map(option=>[option.value,option.count]),[
  ['short-film',1],['game',2],['interactive',1],['explainer',17],['motion-graphics',2],
 ]);
 const offered=new Set(tagFilterVocabulary.groups.flatMap(group=>group.options.map(option=>option.value)));
 for(const rejected of ['source','method','fable-5-2','blender','unreal','unity','music-video','simulation'])assert.equal(offered.has(rejected),false,rejected);
 const stackOr=filterResources({stack:'html,threejs'});
 const stackUnion=new Set([...filterResources({stack:'html'}),...filterResources({stack:'threejs'})].map(resource=>resource.id));
 assert.deepEqual(stackOr.map(resource=>resource.id).sort(),[...stackUnion].sort());
 assert.ok(stackOr.some(resource=>resource.id==='huashu-motion'));
 assert.ok(stackOr.some(resource=>resource.id==='edulab'));
 assert.equal(stackOr.some(resource=>resource.id==='map-motion-globe-to-location'),false);
 const genreOr=filterResources({genre:'explainer,game'});
 assert.ok(genreOr.some(resource=>resource.id==='claude-quest'));
 assert.ok(genreOr.some(resource=>resource.id==='butterfly-life'));
 assert.equal(genreOr.some(resource=>resource.id==='gvp-modern-rural-healing'),false);
 assert.deepEqual(genreOr.map(resource=>resource.id).sort(),[...new Set([...filterResources({genre:'game'}),...filterResources({genre:'explainer'})].map(resource=>resource.id))].sort());
 const both=filterResources({stack:'hyperframes',genre:'explainer'});
 assert.ok(both.every(resource=>resource.tags?.stack?.includes('hyperframes')&&resource.tags?.genre?.includes('explainer')));
 assert.ok(both.some(resource=>resource.id==='paper-cut-five-layer-motion'));
 assert.equal(both.some(resource=>resource.id==='butterfly-life'),false);
 assert.equal(both.some(resource=>resource.id==='gvp-character-intro-mogra'),false);
 const htmlExplainers=filterResources({stack:'html,threejs',genre:'explainer'});
 assert.deepEqual(htmlExplainers.map(resource=>resource.id),['edulab']);
 assert.deepEqual(filterResources({kind:'film',genre:'game'}).map(resource=>resource.id),['claude-quest']);
 const filmsWithVideo=filterResources({kind:'film',genre:'game',video:'1'});
 assert.deepEqual(filmsWithVideo.map(resource=>resource.id),filterResources({kind:'film',genre:'game'}).filter(resource=>matchesCompleteness(resource,'video')).map(resource=>resource.id));
 const remotionFilms=filterResources({kind:'film',stack:'remotion',video:'1'});
 assert.ok(remotionFilms.some(resource=>resource.id==='ink-press'));
 assert.ok(remotionFilms.every(resource=>resource.kind==='film'&&resource.tags?.stack?.includes('remotion')&&matchesCompleteness(resource,'video')));
 assert.deepEqual(filterResources({stack:'fable-5-2'}).map(resource=>resource.id),resources.map(resource=>resource.id));
 assert.deepEqual(filterResources({stack:'source,method',genre:'fable-5-2'}).map(resource=>resource.id),resources.map(resource=>resource.id));
 assert.deepEqual(filterResources({stack:'blender,unreal,unity',genre:'music-video,simulation'}).length,301);
 assert.deepEqual(filterResources({stack:'remotion,fable-5-2'}).map(resource=>resource.id),filterResources({stack:'remotion'}).map(resource=>resource.id));
 assert.equal(filterResources({package:'1',stack:'remotion'}).length,filterResources({stack:'remotion'}).length);
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 const tagField=library.slice(library.indexOf('class="filter-tags"'),library.indexOf('What are you making?'));
 const controls=[...tagField.matchAll(/name="(stack|genre)" value="([^"]+)"[\s\S]*?<span class="filter-count">(\d+)<\/span>/g)].map(match=>[match[1],match[2],Number(match[3])]);
 assert.deepEqual(controls,tagFilterVocabulary.groups.flatMap(group=>group.options.map(option=>[group.id,option.value,option.count])));
 assert.doesNotMatch(tagField,/fable-5-2|value="source"|value="method"|name="source"|name="method"|disabled/);
 assert.doesNotMatch(library,/fable-5-2/);
 const home=renderToString(React.createElement(App,{path:'/'}));
 const spotlightStart=home.indexOf('class="fable-spotlight"');
 const spotlightEnd=home.indexOf('id="featured"');
 const teaser=home.slice(spotlightStart,spotlightEnd);
 assert.equal([...teaser.matchAll(/data-spotlight-id="/g)].length,fableSpotlightHomeItems().length);
 assert.doesNotMatch(teaser,/filter-tags|tag-group|name="stack"|name="genre"/);
 assert.doesNotMatch(home,/class="filter-tags"/);
 const spotlight=renderToString(React.createElement(App,{path:`/${FABLE_SPOTLIGHT_PATH}`}));
 assert.equal([...spotlight.matchAll(/data-spotlight-id="/g)].length,fableSpotlightItems().length);
 assert.doesNotMatch(spotlight,/class="filter-tags"|tag-group-|name="stack"|name="genre"/);
 assert.match(spotlight,/public posts, newest first/);
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
test('featured gallery resolves curator ids to playable video only, in order',()=>{
 const items=featuredGalleryItems();
 assert.equal(featuredGalleryIds.length,8);
 assert.deepEqual(items.map(resource=>resource.id),featuredGalleryIds);
 assert.equal(items.every(resource=>resolvePreview(resource).playable),true);
 assert.equal(items.every(resource=>resolvePreview(resource).mode==='video'),true);
 // featuredIds remains the no-preview fallback ranking and must stay independent.
 assert.notDeepEqual(featuredGalleryIds,featuredIds);
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
  if (/id="preview-home_gallery-(?:herk_edit_kit|cinetic|motionswift|mg_styles_15|anidoodle|claude_code_video_toolkit|remocn|uberscene|soundkit|brag|autocast)"/.test(tag)) assert.doesNotMatch(tag,/\bposter=/i);
  else assert.match(tag,/\bposter="(?:\/previews\/|https:\/\/)/i);
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
   assert.match(resourceHtml,new RegExp(`<video\\b[^>]*id="preview-home_gallery-${resource.id.replaceAll('-','_')}"`));
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
 // Browse cards rest on stills; playback belongs to the homepage gallery and the resource page.
 assert.equal(library.includes('<video'),false);
 assert.match(library,/EDITORIAL COVER/);
 const detail=renderToString(React.createElement(App,{path:'/resources/pretext/'}));
 assert.equal(detail.includes('<video'),false);
 assert.doesNotMatch(detail.match(/<figure class="detail-art">([\s\S]*?)<\/figure>/)![1],/<img\b/);
 assert.match(detail,/EDITORIAL COVER — NOT AN UPSTREAM RENDER/);
 const about=renderToString(React.createElement(App,{path:'/about/'}));
 assert.match(about,/A preview is not a local render test/);
 assert.match(about,/Playback starts muted/);
 assert.match(about,/Main-catalog previews are still click-to-play/);
 assert.match(about,/Fable Spotlight uses muted looping previews after a card enters the viewport/);
 assert.doesNotMatch(about,/Videos never autoplay/);
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
   assert.match(card,new RegExp(`aria-controls="preview-home_gallery-${resource.id.replaceAll('-','_')}"`));
   assert.match(card,/<button\b[^>]*class="preview-play"/);
   assert.match(card,/<div class="art-link">/);
   assert.doesNotMatch(card,/<a\b[^>]*class="art-link"/);
   const video=card.match(/<video\b[^>]*>/)?.[0]??'';
   assert.match(video,/preload="none"/);
   assert.doesNotMatch(video,/\bsrc="/i);
   if(resource.id==='herk-edit-kit'||resource.id==='cinetic'||resource.id==='motionswift'||resource.id==='mg-styles-15'||resource.id==='anidoodle'||resource.id==='claude-code-video-toolkit'||resource.id==='remocn'||resource.id==='uberscene'||resource.id==='soundkit'||resource.id==='brag'||resource.id==='autocast') assert.doesNotMatch(video,/\bposter=/i);
   else assert.match(video,/\bposter="(?:\/previews\/|https:\/\/)/i);
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
 const detail=renderToString(React.createElement(App,{path:'/resources/pretext/'}));
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
  assert(!html.includes(`id="preview-home_gallery-${resource.id.replaceAll('-','_')}"`),resource.id);
 }
 for(const resource of gifs){
  if(resource.id==='snapcn'||resource.id==='openmotion'||resource.id==='tutorials-kit') assert.equal(Object.hasOwn(resource.preview!,'poster'),false,resource.id);
  else assert(resource.preview!.poster?.startsWith('/previews/'),resource.id);
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
  assert.match(home,/id="featured"/);
  assert.match(home,/href="(?:\/gallery\/)?#explore"/);
  const signalAt=home.indexOf('collection-signal');
  const featuredAt=home.indexOf('id="featured"');
  const exploreAt=home.indexOf('id="explore"');
  assert.ok(signalAt>=0 && featuredAt>signalAt && exploreAt>featuredAt,'featured sits between collection-signal and #explore');
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

test('browse cards show the reviewed still, labelled, and keep the editorial cover only without one',()=>{
 const esc=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const base of ['/','/gallery/']){
  const href=(path='')=>base+path;
  const library=renderToString(React.createElement(App,{path:`${base}library/`,base}));
  const cards=[...library.matchAll(/<article class="resource-card" data-resource-id="([^"]+)">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length,resources.length);
  let editorial=0;
  for(const [,id,card] of cards){
   const resource=resources.find(r=>r.id===id)!;
   const preview=resolvePreview(resource);
   const still=coverStill(resource,href);
   const images=[...card.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
   assert.doesNotMatch(card,/<video\b|preview-play/,id);
   if(!still){
    editorial++;
    if(id==='herk-edit-kit'||id==='cinetic'||id==='motionswift'||id==='mg-styles-15'||id==='anidoodle'||id==='claude-code-video-toolkit'||id==='remocn'||id==='uberscene'||id==='soundkit'||id==='brag'||id==='autocast'){
     assert.equal(preview.degraded,false,id);
     assert.equal(preview.playable,true,id);
     assert.equal(preview.poster,null,id);
    }else assert.equal(preview.degraded,true,id);
    assert.equal(images.length,0,id);
    assert.match(card,/class="visual /,id);
    assert.match(card,/<span class="art-caption">EDITORIAL COVER<\/span>/,id);
    continue;
   }
   // A still is never the video file itself, and a bundled frame follows the site base.
   assert.equal(images.length,1,id);
   assert.match(images[0],new RegExp(`src="${esc(still.src)}"`),id);
   assert.match(images[0],/alt=""/,id);
   assert.match(images[0],/loading="lazy"/,id);
   assert.match(images[0],/decoding="async"/,id);
   if(preview.poster?.startsWith('/previews/'))assert.equal(still.src,base+preview.poster.slice(1),id);
   if(preview.playable)assert.notEqual(still.src,preview.url,id);
   assert.equal(still.caption,preview.caption,id);
   assert.match(card,new RegExp(`<span class="art-caption">${still.caption}</span>`),id);
   assert.doesNotMatch(card,/class="visual /,id);
  }
  const reviewedWithoutStill=resources.filter(r=>!coverStill(r,href)&&!resolvePreview(r).degraded).map(r=>r.id);
  assert.deepEqual(reviewedWithoutStill,['herk-edit-kit','cinetic','motionswift','mg-styles-15','anidoodle','claude-code-video-toolkit','remocn','uberscene','soundkit','brag','autocast']);
  assert.equal(editorial,resources.filter(r=>resolvePreview(r).degraded).length+reviewedWithoutStill.length);
  assert.ok(editorial>0&&editorial<20,'only resources without a reviewed preview keep an editorial cover');
 }
 // A playable video with no poster has no still to show: it must not fall back to the video URL.
 const ink=resources.find(r=>r.id==='ink-press')!;
 assert.equal(coverStill({...ink,preview:{...ink.preview!,poster:undefined}},(path='')=>'/'+path),null);
 assert.equal(coverStill({...ink,preview:undefined},(path='')=>'/'+path),null);
 // Editorial title cards carry the resource's own name, so they do not repeat.
 const fallbacks=resources.filter(r=>resolvePreview(r).degraded);
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 const titles=[...library.matchAll(/<div class="type-word" data-fit="[a-z]+">([^<]+)<\/div>/g)].map(match=>match[1]);
 assert.ok(titles.length>1);
 assert.equal(new Set(titles).size,titles.length);
 const allowedTitles=new Set([...fallbacks.map(r=>escapeHtml(r.name)),escapeHtml('herk-edit-kit'),escapeHtml('cinetic'),escapeHtml('motionswift'),escapeHtml('mg-styles-15'),escapeHtml('anidoodle'),escapeHtml('Claude Code Video Toolkit'),escapeHtml('Remocn'),escapeHtml('uberscene'),escapeHtml('SoundKit'),escapeHtml('brag'),escapeHtml('Autocast')]);
 for(const title of titles)assert.ok(allowedTitles.has(title),title);
});

test('a resource page plays its own upstream demo under the gallery rules and credits it',()=>{
 const ink=resources.find(r=>r.id==='ink-press')!;
 const preview=resolvePreview(ink);
 const page=renderToString(React.createElement(App,{path:'/resources/ink-press/'})).replace(/<!--[\s\S]*?-->/g,'');
 const art=page.match(/<figure class="detail-art">([\s\S]*?)<\/figure>/)![1];
 const video=art.match(/<video\b[^>]*>/)![0];
 assert.match(video,/id="preview-resource_detail-ink_press"/);
 assert.match(video,/preload="none"/);
 assert.match(video,/referrerpolicy="no-referrer"/i);
 assert.match(video,/poster="\/previews\/ink-press\.webp"/);
 assert.match(video,/tabindex="-1"/);
 const attrs=video.replace(/\s(?:src|poster)="[^"]*"/gi,'');
 assert.doesNotMatch(video,/\bsrc="/i);
 assert.doesNotMatch(attrs,/\b(?:autoplay|controls|muted|loop)\b/i);
 assert.match(art,/<button type="button" class="preview-play" aria-pressed="false" aria-controls="preview-resource_detail-ink_press" aria-label="Play upstream demo: Ink Press">/);
 assert.match(art,/<span class="art-caption">Upstream demo<\/span>/);
 const credit=art.match(/<figcaption class="detail-credit">([\s\S]*?)<\/figcaption>/)![1];
 assert.ok(credit.includes(escapeHtml(preview.detail)));
 assert.match(credit,/Playback starts muted\./);
 assert.ok(credit.includes(escapeHtml(preview.license!)));
 assert.ok(credit.includes(escapeHtml(preview.attribution!)));
 assert.ok(credit.includes(`href="${preview.url}" class="preview-source"`));
 assert.match(page,/<span class="card-spec">0:36<\/span><span class="card-spec">1280×720<\/span>/);
 assert.doesNotMatch(page,/EDITORIAL COVER — NOT AN UPSTREAM RENDER/);
 // The resources suggested below are stills, not more players.
 assert.equal([...page.matchAll(/<video\b/g)].length,1);
 // An upstream image is a link to that image, never a player.
 const image=resources.find(r=>resolvePreview(r).mode==='thumb_link'&&!resolvePreview(r).degraded)!;
 const imagePage=renderToString(React.createElement(App,{path:`/resources/${image.id}/`}));
 const imageArt=imagePage.match(/<figure class="detail-art">([\s\S]*?)<\/figure>/)![1];
 assert.doesNotMatch(imageArt,/<video\b|preview-play/);
 assert.ok(imageArt.includes(`<a class="art-link" href="${resolvePreview(image).url}" target="_blank" rel="noopener noreferrer"`));
 assert.doesNotMatch(imageArt,/Playback starts muted/);
 // With no preview there is nothing to open: the editorial cover is not a link.
 const bare=renderToString(React.createElement(App,{path:'/resources/pretext/'}));
 const bareArt=bare.match(/<figure class="detail-art">([\s\S]*?)<\/figure>/)![1];
 assert.match(bareArt,/<div class="art-link"><div class="visual [^"]*visual-hero/);
 assert.doesNotMatch(bareArt,/<a\b/);
 assert.match(bareArt,/not a screenshot or an upstream render/);
});

test('every page shares one shell: the same header, a marked current section and no theme switch',()=>{
 const pages:[string,string|null][]=[['/',null],['/library/','Library'],['/resources/ink-press/','Library'],['/collections/','Use cases'],['/collections/explainers/','Use cases'],['/projects/','Projects'],['/projects/video-shotcraft/','Projects'],['/about/','About'],['/saved/',null],['/missing/',null]];
 for(const [path,current] of pages){
  const html=renderToString(React.createElement(App,{path}));
  const header=html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[1];
  assert.ok(header,path);
  assert.match(header,/<svg class="brand-mark"[^>]*aria-hidden="true"/,path);
  assert.match(header,/<span class="brand-wordmark">Awesome Code Video<\/span>/,path);
  assert.doesNotMatch(html,/theme-toggle|brand-icon/,path);
  const marked=[...header.matchAll(/<a aria-current="(page|true)" href="[^"]*">([^<]+)<\/a>/g)].map(match=>match[2]);
  assert.deepEqual(marked,current?[current]:[],path);
  // The exact page says "page"; a page beneath a section marks that section without claiming to be it.
  if(current)assert.match(header,new RegExp(`aria-current="${['/library/','/collections/','/projects/','/about/'].includes(path)?'page':'true'}"`),path);
  assert.equal(/class="saved-nav" aria-current="page"/.test(header),path==='/saved/',path);
  assert.equal(/\bhome-site\b/.test(html),path==='/',path);
 }
 const library=renderToString(React.createElement(App,{path:'/library/'}));
 assert.equal([...library.matchAll(/<div class="art-frame"><a class="art-link"[^>]*tabindex="-1" aria-hidden="true">/g)].length,resources.length,'library covers are decorative links inside the shared frame');
 const projectsPage=renderToString(React.createElement(App,{path:'/projects/'})).replace(/<!--[\s\S]*?-->/g,'');
 assert.doesNotMatch(projectsPage,/>1 resources</);
 assert.match(projectsPage,/>1 resource</);
});

test('homepage reel is server-rendered at rest with labelled, initially disabled controls',()=>{
 const home=renderToString(React.createElement(App,{path:'/'}));
 const hero=home.match(/<section\b[^>]*class="brand-hero"[^>]*>([\s\S]*?)<\/section>/)![1];
 assert.match(hero,/<h1 id="home-title">/);
 assert.match(hero,/class="hero-motion" data-state="loading" data-shot="title"/);
 const toggle=hero.match(/<button\b[^>]*class="hero-motion-toggle"[^>]*>/)![0];
 assert.match(toggle,/type="button"/);
 assert.match(toggle,/\bdisabled\b/);
 assert.match(toggle,/aria-label="Play hero animation"/,'a still poster offers Play, not Pause');
 const scrubber=hero.match(/<input\b[^>]*class="reel-scrubber"[^>]*>/)![0];
 assert.match(scrubber,/type="range"/);
 assert.match(scrubber,/min="0"/);
 assert.match(scrubber,/max="179"/);
 assert.match(scrubber,/\bdisabled\b/);
 assert.match(scrubber,/aria-label="[^"]+"/);
 // The listing is a decorative sketch; assistive technology gets the heading and controls instead.
 assert.match(hero,/<div class="reel-code" aria-hidden="true">/);
});

test('homepage explains the three starting points with live catalog counts',()=>{
 for(const base of ['/','/gallery/']){
  const home=renderToString(React.createElement(App,{path:base,base})).replace(/<!--[\s\S]*?-->/g,'');
  const section=home.match(/<section\b[^>]*class="start-paths"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section,'ways to start section');
  assert.ok(home.indexOf('class="start-paths"')>home.indexOf('id="featured"')&&home.indexOf('class="start-paths"')<home.indexOf('id="explore"'));
  assert.equal([...section.matchAll(/<li\b[^>]*class="start-card"/g)].length,3);
  for(const kind of ['film','scene','shot','preset','style']){
   const count=resources.filter(r=>r.kind===kind).length;
   assert.ok(count>0,kind);
   assert.equal(kindCount(kind),count);
   assert.match(section,new RegExp(`<a href="${base}library/\\?kind=${kind}">${count} `),kind);
  }
  assert.equal(kindCount('film','scene'),kindCount('film')+kindCount('scene'));
  const signal=home.match(/<section\b[^>]*class="collection-signal"[^>]*>([\s\S]*?)<\/section>/)![1];
  for(const count of [resources.length,kindCount('film','scene'),kindCount('shot','preset'),kindCount('style'),projects.length])assert.match(signal,new RegExp(`<b>${count}</b>`));
 }
});

test('gallery cards show measured running time and frame size only for the measured file',()=>{
 const ink=resources.find(r=>r.id==='ink-press')!;
 assert.deepEqual(previewSpecs(ink),['0:36','1280×720']);
 const html=renderGalleryCard(ink);
 assert.match(html,/<span class="card-spec">0:36<\/span><span class="card-spec">1280×720<\/span>/);
 assert.deepEqual(previewSpecs(resources.find(r=>r.id==='claude-quest')!),['1:00','1280×720']);
 // A replaced preview URL must not inherit the old file's measurements.
 assert.deepEqual(previewSpecs({...ink,preview:{...ink.preview!,url:'https://example.com/replaced.mp4'}}),[]);
 assert.deepEqual(previewSpecs({...ink,preview:undefined}),[]);
 const unmeasured=homePreviewItems().find(r=>resolvePreview(r).mode==='thumb_link')!;
 assert.deepEqual(previewSpecs(unmeasured),[]);
 assert.doesNotMatch(renderGalleryCard(unmeasured),/card-spec/);
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
 const featuredOnHome=new Set(featuredGalleryItems().map(resource=>resource.id));
 for(const resource of resources)assert.equal(html.includes(`href="/resources/${resource.id}/"`),firstIds.has(resource.id)||featuredOnHome.has(resource.id),resource.id);
 assert.match(html,/id="featured"/);
 assert.match(html,/Selected work\. Original sources\./);
 assert.equal([...html.matchAll(/class="resource-card gallery-card"/g)].length,firstBatch.length+featuredGalleryItems().length);
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
 const unmeasured=homeGalleryItems().filter(r=>videoOrientation(r)==='unknown');
 assert.deepEqual(unmeasured.map(r=>r.id),['herk-edit-kit','cinetic','motionswift','claude-code-video-toolkit','remocn','uberscene','soundkit','brag','autocast']);
 const html=renderToString(React.createElement(App,{path:'/'}));
 assert.match(html,/Unconfirmed format<!-- --> <span>9<\/span>/);
});
