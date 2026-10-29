import React,{useCallback,useEffect,useRef,useState} from 'react';
import {HeroMotion} from './HeroMotion';
import {PrivacyChoices} from './PrivacyChoices';
import {getAnalyticsConsent,subscribeAnalytics,trackEvent} from './analytics';
import {abandonGalleryPlayback,resetPreview,toggleGalleryPlayback,type GalleryPlaybackState} from './galleryPlayback';
import {GALLERY_BATCH_SIZE,GALLERY_CATEGORY_IDS,createGalleryBrowseState,selectGalleryCategory,loadMoreGalleryItems,type GalleryCategory} from './galleryBrowsing';
import {resources,projects,evidence,repo,kindNames,kindGuides,coreCount,collections,projectFor,collectionsFor,palette,galleryLinks,filterResources,routeForPath,pageMeta,homePreviewGroups,videoOrientation,type VideoOrientation,isYouTubePreview,resolvePreview,type Resource} from './model';

export type SiteMeasurement={trackEvent:typeof trackEvent;getAnalyticsConsent:typeof getAnalyticsConsent;subscribeAnalytics:typeof subscribeAnalytics};
const defaultMeasurement:SiteMeasurement={trackEvent,getAnalyticsConsent,subscribeAnalytics};

function Arrow(){return <span aria-hidden="true">↗</span>}
function Visual({resource,hero=false}:{resource:Resource,hero?:boolean}){
 const theme=palette(resource);
 return <div className={`visual visual-${theme} ${hero?'visual-hero':''}`} aria-hidden="true">
  {theme==='paper'?<><div className="paper-sheet sheet-back"/><div className="paper-sheet sheet-front"><span>FIELD NOTES / 01</span><strong>{resource.id.includes('cut')?'CUT.\nLAYER.\nMOVE.':'Ideas,\nin motion.'}</strong><i>↗</i></div><div className="paper-stamp">MAKE IT<br/>YOUR OWN</div></>:
   theme==='map'?<><svg viewBox="0 0 400 240"><defs><pattern id={'grid-'+resource.id} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="currentColor" strokeOpacity=".13"/></pattern></defs><rect width="400" height="240" fill={`url(#grid-${resource.id})`}/><ellipse cx="200" cy="120" rx="100" ry="91"/><ellipse cx="200" cy="120" rx="50" ry="91"/><path d="M100 120h200M113 80h174M113 160h174M200 29v182"/><path className="route-path" d="M115 159Q165 38 270 81"/><circle cx="115" cy="159" r="5" fill="currentColor"/><circle cx="270" cy="81" r="6" fill="currentColor"/></svg><span className="coordinates">35.68° N → 139.69° E</span></>:
   theme==='pixel'?<><div className="pixel-stars">+ · + · + · +</div><div className="pixel-word">INSERT<br/><span>STORY_</span></div><div className="pixel-ground">▟▙ ▟▙ ▟▙ ▟▙ ▟▙ ▟▙ ▟▙</div><span className="pixel-label">PRESS PLAY TO BEGIN</span></>:
   theme==='chart'?<><span className="chart-label">A STORY IN NUMBERS</span><div className="chart-bars">{[30,52,43,74,90].map((h,i)=><i key={i} style={{height:h+'%'}}/> )}</div><span className="chart-caption">01 — 02 — 03 — 04 — 05</span></>:
   theme==='dark'?<><div className="wire-box"><div/><div/><div/></div><span className="dark-label">BUILD / FRAME / RENDER</span></>:
   <><div className="type-orbit"/><div className="type-word">MAKE<br/><span>IT MOVE.</span></div><span className="type-star">✳</span></>}
 </div>;
}
function External({href,children,className='',primaryResource}:{href:string,children:React.ReactNode,className?:string,primaryResource?:string}){return <a href={href} className={className} target="_blank" rel="noopener noreferrer" data-primary-resource={primaryResource}>{children}<Arrow/></a>}
function resourceParams(resource:Resource){return {resource_id:resource.id,resource_kind:resource.kind,project_id:resource.project_id};}

// Only the explicit resource CTA denotes reuse intent; other links remain diagnostic.
export function navigationAction(href:string,origin:string,base='/',resourceId?:string,primaryResourceId?:string){
 let target:URL;try{target=new URL(href,origin);}catch{return null;}
 if(!['http:','https:'].includes(target.protocol))return null;
 const resource=resources.find(r=>r.id===(primaryResourceId||resourceId));
 if(primaryResourceId&&resource&&target.href===new URL(resource.url).href)return {event:'open_resource' as const,resource,destination_domain:target.hostname};
 if(target.origin===origin){
  const destination=routeForPath(target.pathname,base);
  return destination.type==='resource'&&resource&&destination.id===resource.id?{event:'select_resource' as const,resource}:null;
 }
 if(target.href===`${repo}/issues/new/choose`)return {event:'suggest_resource_click' as const,destination_domain:target.hostname};
 return {event:'outbound_click' as const,resource,destination_domain:target.hostname};
}

export function GalleryCard({resource,href,saved,onSave,activeId,playing,onToggle,onPlayback,onVideo,measurement=defaultMeasurement}:{resource:Resource,href:(path?:string)=>string,saved:boolean,onSave:(id:string)=>void,activeId:string|null,playing:boolean,onToggle:(id:string)=>void,onPlayback:(id:string,playing:boolean)=>void,onVideo:(id:string,node:HTMLVideoElement|null,url?:string|null)=>void,measurement?:SiteMeasurement}){
 const {trackEvent}=measurement;
 const preview=resolvePreview(resource);
 const poster=preview.poster?.startsWith('/previews/')?href(preview.poster.slice(1)):preview.poster;
 const still=poster||preview.url;
 const canPlay=Boolean(preview.playable&&preview.url);
 const previewDomId=`preview-${resource.id.replaceAll('-','_')}`;
 const armed=canPlay&&activeId===resource.id;
 const showPause=armed&&playing;
 const previewStarted=useRef(false);
 useEffect(()=>{if(!armed)previewStarted.current=false;},[armed]);
 function previewPlaying(){onPlayback(resource.id,true);if(armed&&!previewStarted.current){previewStarted.current=true;trackEvent('preview_start',{...resourceParams(resource),placement:'home_gallery'});}}
 function previewEnded(){onPlayback(resource.id,false);if(previewStarted.current){trackEvent('preview_complete',{...resourceParams(resource),placement:'home_gallery'});previewStarted.current=false;}}
 const bind=useCallback((node:HTMLVideoElement|null)=>{onVideo(resource.id,node,preview.url);},[onVideo,resource.id,preview.url]);
 const media=canPlay?<>
  <button type="button" className={`preview-play${armed?' is-armed':''}`} aria-pressed={showPause} aria-controls={previewDomId} aria-label={`${showPause?'Pause':'Play'} upstream demo: ${resource.name}`} onClick={()=>onToggle(resource.id)}><span aria-hidden="true">{showPause?'Pause':'Play'}</span></button>
  {poster?<img className="preview-media preview-poster" src={poster} alt="" loading="lazy" decoding="async"/>:<Visual resource={resource}/>}
  <video id={previewDomId} ref={bind} className={`preview-media preview-player${armed?' is-armed':''}`} preload="none" poster={poster||undefined} playsInline tabIndex={armed?undefined:-1} controls={armed||undefined} aria-hidden={armed?undefined:true} onPlay={()=>onPlayback(resource.id,true)} onPlaying={previewPlaying} onEnded={previewEnded} onEmptied={()=>{previewStarted.current=false;}} onPause={()=>onPlayback(resource.id,false)}/>
 </>:!preview.degraded&&preview.mode==='thumb_link'&&still?<img className="preview-media preview-poster" src={still} alt="" loading="lazy" decoding="async"/>:!preview.degraded&&preview.mode==='embed'&&poster?<img className="preview-media preview-poster" src={poster} alt="" loading="lazy" decoding="async"/>:!preview.degraded&&preview.mode==='embed'?<div className="preview-embed"><span>UPSTREAM PAGE</span><b>Open the source page.</b></div>:<Visual resource={resource}/>;
 const upstreamLabel=canPlay?'Upstream file':isYouTubePreview(resource)?'Watch on YouTube':preview.mode==='thumb_link'?'Upstream image':'Upstream page';
 const frame=canPlay?<div className="art-link">{media}</div>:<a className="art-link" href={preview.url||href(`resources/${resource.id}/`)} target={preview.url?'_blank':undefined} rel={preview.url?'noopener noreferrer':undefined} aria-label={`Open ${preview.mode==='embed'?'source page':'upstream preview'}: ${resource.name}`}>{media}</a>;
 return <article className="resource-card gallery-card" data-resource-id={resource.id}>
  <div className="art-frame">{frame}<span className="art-caption">{preview.caption}</span></div>
  <div className="card-body">
   <div className="card-kicker">
    <span>{kindNames[resource.kind]}</span>
    <button className={`save-button ${saved?'is-saved':''}`} aria-label={`${saved?'Unsave':'Save'} ${resource.name}`} aria-pressed={saved} onClick={()=>onSave(resource.id)}>{saved?'★':'☆'}</button>
   </div>
   <h3><a href={href(`resources/${resource.id}/`)}>{resource.name}<Arrow/></a></h3>
   <p className="card-description">{resource.description}</p>
   <details className="preview-details">
    <summary className="preview-summary">
     <span className="card-project">{projectFor(resource).name}</span>
     <span className="preview-details-label">Source &amp; license <span aria-hidden="true">+</span></span>
    </summary>
    <div className="preview-details-content">
     <p className="preview-note">{preview.detail}{preview.degraded?null:<> {preview.license}. {preview.attribution}</>}</p>
     {!preview.degraded&&preview.url?<External href={preview.url} className="preview-source">{upstreamLabel}</External>:null}
     <p className="preview-review">Source reviewed · {resource.review.reviewed_at}</p>
    </div>
   </details>
  </div>
 </article>;
}
function HomeGallery({href,saved,onSave,measurement}:{href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement}){
 const {trackEvent}=measurement;
 const videos=useRef(new Map<string,HTMLVideoElement>());
 const sources=useRef(new Map<string,string>());
 const tabs=useRef(new Map<GalleryCategory,HTMLButtonElement>());
 const grid=useRef<HTMLDivElement>(null);
 const revealIndex=useRef<number|null>(null);
 const [browse,setBrowse]=useState(createGalleryBrowseState);
 const [orientation,setOrientation]=useState<VideoOrientation>('landscape');
 const [playback,setPlayback]=useState<GalleryPlaybackState>({activeId:null,playing:false});
 const playbackRef=useRef(playback);
 const playRequest=useRef(0);
 const onVideo=useCallback((id:string,node:HTMLVideoElement|null,url?:string|null)=>{
  if(node){videos.current.set(id,node);if(url)sources.current.set(id,url);}
  else{
   const previous=videos.current.get(id);
   if(previous)resetPreview(previous);
   videos.current.delete(id);
   sources.current.delete(id);
  }
 },[]);
 const onPlayback=useCallback((id:string,isPlaying:boolean)=>{
  if(playbackRef.current.activeId!==id)return;
  const next={activeId:id,playing:isPlaying};
  playbackRef.current=next;
  setPlayback(next);
 },[]);
 function toggle(id:string){
  const request=++playRequest.current;
  const result=toggleGalleryPlayback(playbackRef.current,id,videos.current,sources.current);
  playbackRef.current=result.state;
  setPlayback(result.state);
  void result.play?.catch(()=>{
   // An old media request must not clear a newer playback session after a tab switch.
   if(request!==playRequest.current)return;
   const next=abandonGalleryPlayback(playbackRef.current,id);
   playbackRef.current=next;
   setPlayback(next);
   const video=videos.current.get(id);
   if(video&&next.activeId!==id)resetPreview(video);
  });
 }
 const activate=useCallback((category:GalleryCategory)=>{
  ++playRequest.current;
  const previousId=playbackRef.current.activeId;
  const idle={activeId:null,playing:false};
  playbackRef.current=idle;
  setPlayback(idle);
  if(previousId){const previous=videos.current.get(previousId);if(previous)resetPreview(previous);}
  revealIndex.current=null;
  setBrowse(current=>selectGalleryCategory(current,category));
 },[]);
 useEffect(()=>{
  function syncHash(){
   const category=GALLERY_CATEGORY_IDS.find(id=>`#${id}`===window.location.hash);
   if(category)activate(category);
  }
  syncHash();
  window.addEventListener('hashchange',syncHash);
  return()=>window.removeEventListener('hashchange',syncHash);
 },[activate]);
 useEffect(()=>{
  if(revealIndex.current===null)return;
  const firstNew=grid.current?.children[revealIndex.current] as HTMLElement|undefined;
  revealIndex.current=null;
  // Continue from the newly appended row instead of skipping it on the next Tab press.
  firstNew?.querySelector<HTMLAnchorElement>('h3 a')?.focus({preventScroll:true});
  firstNew?.scrollIntoView({block:'start'});
 },[browse]);
 function selectTab(category:GalleryCategory){
  if(category===browse.activeCategory)return;
  activate(category);
  trackEvent('gallery_category_select',{category,placement:'home_gallery'});
  history.replaceState(history.state,'',`#${category}`);
 }
 function handleTabKey(event:React.KeyboardEvent<HTMLButtonElement>,index:number){
  const last=GALLERY_CATEGORY_IDS.length-1;
  const next=event.key==='ArrowRight'?(index+1)%(last+1):event.key==='ArrowLeft'?(index+last)%(last+1):event.key==='Home'?0:event.key==='End'?last:null;
  if(next===null)return;
  event.preventDefault();
  const category=GALLERY_CATEGORY_IDS[next];
  tabs.current.get(category)?.focus({preventScroll:true});
  selectTab(category);
 }
 const groups=homePreviewGroups();
 const orientations = [{id:'landscape',label:'Landscape'}, {id:'portrait',label:'Portrait'}, {id:'square',label:'Square'}, {id:'unknown',label:'Unconfirmed format'}] as const;
 const sections=[
  {id:'video-gallery',label:'Video gallery',unit:'videos',items:groups.videos.filter(resource=>videoOrientation(resource)===orientation),description:'A shot, a style, a whole new direction. Watch the work, then explore its source.',format:'Click to play · Starts muted'},
  {id:'animated-examples',label:'Animated examples',unit:'animated examples',items:groups.animations,description:'Small studies in motion. Open an animation to see how the idea comes together.',format:'GIF & animated WebP'},
  {id:'other-resources',label:'Other resources',unit:'resources',items:groups.other,description:'Visual starting points, templates and tools. Follow a frame back to its creator.',format:'Images & project pages'},
 ] satisfies {id:GalleryCategory,label:string,unit:string,items:Resource[],description:string,format:string}[];
 return <>
  <div className="gallery-navigation" role="tablist" aria-label="Browse media types">
   {sections.map((section,index)=><button key={section.id} type="button" role="tab" id={`${section.id}-tab`} aria-controls={section.id} aria-selected={browse.activeCategory===section.id} tabIndex={browse.activeCategory===section.id?0:-1} ref={node=>{if(node)tabs.current.set(section.id,node);else tabs.current.delete(section.id);}} onClick={()=>selectTab(section.id)} onKeyDown={event=>handleTabKey(event,index)}>{section.label} <span>{section.id==='video-gallery'?groups.videos.length:section.items.length}</span></button>)}
  </div>
  {sections.map(section=>{
   const active=browse.activeCategory===section.id;
   const visible=section.items.slice(0,browse.visibleCounts[section.id]);
   const remaining=section.items.length-visible.length;
   return <section key={section.id} id={section.id} className="section home-gallery" role="tabpanel" aria-labelledby={`${section.id}-tab`} hidden={!active} tabIndex={active?0:-1}>
    {active&&<>
     {section.id==='video-gallery'&&<div className="gallery-orientations" role="group" aria-label="Video orientation">{orientations.filter(option=>groups.videos.some(resource=>videoOrientation(resource)===option.id)).map(option=><button key={option.id} type="button" aria-pressed={orientation===option.id} onClick={()=>{activate('video-gallery');setOrientation(option.id);setBrowse(current=>({...current,visibleCounts:{...current.visibleCounts,'video-gallery':GALLERY_BATCH_SIZE}}));}}>{option.label} <span>{groups.videos.filter(resource=>videoOrientation(resource)===option.id).length}</span></button>)}</div>}
     <div className="gallery-context"><p className="gallery-lead">{section.description}</p><span className="gallery-format">{section.format}</span></div>
     <div className={`card-grid ${section.id==='video-gallery'?`gallery-${orientation}`:''}`} ref={grid}>{visible.map(resource=><GalleryCard key={resource.id} resource={resource} href={href} saved={saved.includes(resource.id)} onSave={onSave} activeId={playback.activeId} playing={playback.playing} onToggle={toggle} onPlayback={onPlayback} onVideo={onVideo} measurement={measurement}/>)}</div>
     <div className="gallery-pagination">
      <p className="gallery-progress" role="status" aria-live="polite" aria-atomic="true">Showing {visible.length} of {section.items.length} {section.unit}</p>
      {remaining>0?<button type="button" className="button gallery-load-more" onClick={()=>{revealIndex.current=visible.length;setBrowse(current=>loadMoreGalleryItems(current,section.items.length));trackEvent('gallery_load_more',{category:section.id,visible_count:Math.min(visible.length+GALLERY_BATCH_SIZE,section.items.length),placement:'home_gallery'});}}>Load {Math.min(GALLERY_BATCH_SIZE,remaining)} more <span aria-hidden="true">↓</span></button>:<p className="gallery-complete">All {section.items.length} {section.unit} shown</p>}
     </div>
    </>}
   </section>;
  })}
  <noscript><p className="gallery-lead">Enable JavaScript to switch categories and load more previews, or <a href={href('library/')}>browse all {resources.length} resources in the library</a>.</p></noscript>
 </>;
}
export function App({path,base='/',measurement=defaultMeasurement}:{path:string,base?:string,measurement?:SiteMeasurement}){
 const {trackEvent,getAnalyticsConsent,subscribeAnalytics}=measurement;
 const route=routeForPath(path,base);const href=(s='')=>base+s;
 const [saved,setSaved]=useState<string[]>([]);const [saveStatus,setSaveStatus]=useState('');
 const [dark,setDark]=useState(false);const [menu,setMenu]=useState(false);
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem('acv:saved')||'[]');if(Array.isArray(data))setSaved(data.filter((id:unknown)=>typeof id==='string'&&resources.some(r=>r.id===id)));setDark(localStorage.getItem('acv:theme')==='dark');}catch{}document.title=pageMeta(route).title;},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';},[dark]);
 function toggleSave(id:string){const resource=resources.find(r=>r.id===id);if(!resource)return;const next=saved.includes(id)?saved.filter(s=>s!==id):[...saved,id];setSaved(next);trackEvent(next.includes(id)?'save_resource':'unsave_resource',{...resourceParams(resource),placement:route.type==='resource'?'resource_detail':route.type==='home'?'home_gallery':route.type==='collection'?'collection':route.type==='project'?'project':route.type==='saved'?'saved':'library'});try{localStorage.setItem('acv:saved',JSON.stringify(next));setSaveStatus(next.includes(id)?'Saved on this device.':'Removed from saved resources.');}catch{setSaveStatus('Saved for this visit. Browser storage is unavailable.');}}
 function toggleTheme(){setDark(!dark);try{localStorage.setItem('acv:theme',dark?'light':'dark');}catch{}}
 function Card({r}:{r:Resource}){return <article className="resource-card" data-resource-id={r.id}><a className="art-link" href={href(`resources/${r.id}/`)} tabIndex={-1} aria-hidden="true"><Visual resource={r}/><span className="art-caption">EDITORIAL COVER</span></a><div className="card-body"><div className="card-kicker"><span>{kindNames[r.kind]}</span><button className={`save-button ${saved.includes(r.id)?'is-saved':''}`} aria-label={`${saved.includes(r.id)?'Unsave':'Save'} ${r.name}`} aria-pressed={saved.includes(r.id)} onClick={()=>toggleSave(r.id)}>{saved.includes(r.id)?'★':'☆'}</button></div><h3><a href={href(`resources/${r.id}/`)}>{r.name}<Arrow/></a></h3><p>{r.description}</p><div className="card-foot"><span>{projectFor(r).name}</span><span>Source reviewed</span></div></div></article>}
 function Cards({items}:{items:Resource[]}){return <div className="card-grid">{items.map(r=><Card key={r.id} r={r}/>)}</div>}
 function Intro({label,title,text}:{label:string,title:string,text:string}){return <section className="page-intro"><p className="eyebrow">{label}</p><h1>{title}</h1><p className="intro-copy">{text}</p></section>}
 function CollectionCards(){return <div className="collection-grid">{collections.map((c,i)=><a className="collection-card" key={c.id} href={href(`collections/${c.id}/`)}><span className="collection-num">0{i+1} / {c.ids.length} RESOURCES</span><strong className="collection-symbol">{c.symbol}</strong><h3>{c.name}<Arrow/></h3><p>{c.caption}</p></a>)}</div>}
 function Library(){
  const [filters,setFilters]=useState({q:'',kind:'',project:'',use:'',sort:'curated'});
  useEffect(()=>{function sync(){const p=new URLSearchParams(location.search);setFilters({q:p.get('q')||'',kind:p.get('kind')||'',project:p.get('project')||'',use:p.get('use')||'',sort:p.get('sort')||'curated'});}sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  const searchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lastSearch=useRef<string|null>(null);
  useEffect(()=>{const unsubscribe=subscribeAnalytics(()=>{if(getAnalyticsConsent()!=='granted'&&searchTimer.current){clearTimeout(searchTimer.current);searchTimer.current=null;}});return()=>{unsubscribe();if(searchTimer.current)clearTimeout(searchTimer.current);};},[]);
  function recordSearch(next:typeof filters){
   if(searchTimer.current){clearTimeout(searchTimer.current);searchTimer.current=null;}
   if(getAnalyticsConsent()!=='granted')return;
   const signature=JSON.stringify(next);
   if(signature===lastSearch.current)return;
   lastSearch.current=signature;
   trackEvent('search_results_view',{result_count:filterResources(next).length,query_length:next.q.length,has_query:Boolean(next.q.trim())});
  }
  function change(key:keyof typeof filters,value:string){
   const next={...filters,[key]:value};setFilters(next);
   const p=new URLSearchParams();Object.entries(next).forEach(([k,v])=>{if(v && !(k==='sort'&&v==='curated'))p.set(k,v)});history.replaceState(null,'',href('library/')+(p.size?'?'+p:''));
   if(searchTimer.current){clearTimeout(searchTimer.current);searchTimer.current=null;}
   if(key==='q'){
    if(getAnalyticsConsent()==='granted')searchTimer.current=setTimeout(()=>recordSearch(next),600);
   }else trackEvent('filter_resources',{filter_name:key,filter_value:value,result_count:filterResources(next).length});
  }
  function clear(){if(searchTimer.current){clearTimeout(searchTimer.current);searchTimer.current=null;}lastSearch.current=null;setFilters({q:'',kind:'',project:'',use:'',sort:'curated'});history.replaceState(null,'',href('library/'));trackEvent('filter_resources',{filter_name:'reset',filter_value:'',result_count:resources.length});}
  const result=filterResources(filters);
  return <><Intro label="THE RESOURCE INDEX" title="Find your starting frame." text="A complete film, one good shot, or a whole new visual language. Find the source. Make it yours."/><div className="library-layout"><aside className="filters"><div className="filter-heading"><h2>FILTER THE INDEX</h2><button onClick={clear}>Reset</button></div><label>Resource type<select value={filters.kind} onChange={e=>change('kind',e.target.value)}><option value="">All types</option>{Object.entries(kindNames).map(([id,name])=><option key={id} value={id}>{name} ({resources.filter(r=>r.kind===id).length})</option>)}</select></label><label>What are you making?<select value={filters.use} onChange={e=>change('use',e.target.value)}><option value="">All use cases</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Source project<select value={filters.project} onChange={e=>change('project',e.target.value)}><option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="filter-note"><span>GOOD TO KNOW</span><p>A style is a specification. A shot is a building block. A film is an editable project.</p><a href={href('about/')}>Read the selection guide →</a></div></aside><div className="library-results"><form className="search-box" onSubmit={e=>{e.preventDefault();recordSearch(filters);}} role="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search resources" placeholder="Try paper, maps, captions, Remotion…" value={filters.q} onChange={e=>change('q',e.target.value)}/></form><div className="results-toolbar"><p aria-live="polite"><b>{result.length}</b> resources{filters.q?` for “${filters.q}”`:''}</p><label>Sort<select aria-label="Sort resources" value={filters.sort} onChange={e=>change('sort',e.target.value)}><option value="curated">{filters.q?'Relevance':'Curated order'}</option><option value="name">Name A–Z</option></select></label></div>{result.length?<Cards items={result}/>:<div className="empty"><strong>No matching frames.</strong><p>Try a broader search or remove a filter.</p><button className="button" onClick={clear}>Clear all filters ↗</button></div>}<noscript>Enable JavaScript to use search and filters. All resources are listed below and have standalone detail pages.</noscript></div></div></>;
 }
 function ResourceDetail({id}:{id:string}){
  const r=resources.find(r=>r.id===id)!;const p=projectFor(r);const sources=evidence.filter(s=>r.evidence_ids.includes(s.id));const themes=collectionsFor(r);const [copied,setCopied]=useState(false);const [copyError,setCopyError]=useState('');
  async function copy(){try{await navigator.clipboard.writeText(`${r.name}\n${r.url}\n\n${r.description}\n\nResource type: ${kindNames[r.kind]}. ${kindGuides[r.kind]}\nSource reviewed: ${r.review.reviewed_at}. Render tested: ${r.review.render_tested?'yes':'no'}. Check upstream licenses and dependencies before reuse.`);setCopied(true);setCopyError('');trackEvent('copy_reuse_brief',{...resourceParams(r),placement:'source_panel'});}catch{setCopyError('Clipboard unavailable. Select and copy the source link and reuse notes below.');}}
  const related=resources.filter(x=>x.id!==r.id&&(x.project_id===r.project_id || themes.some(c=>c.ids.includes(x.id)))).slice(0,3);
  return <><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('library/')}>Library</a><span>/</span><a href={href(`projects/${p.id}/`)}>{p.name}</a><span>/</span><span>{r.name}</span></nav><div className="detail-layout"><div className="detail-main"><div className="detail-art"><Visual resource={r} hero/><span className="art-caption">EDITORIAL COVER — NOT AN UPSTREAM RENDER</span></div><div className="detail-title"><span className="tag">{kindNames[r.kind]}</span><h1>{r.name}</h1><p>{r.description}</p></div><section className="prose-block"><h2>What you’re reusing</h2><p>{kindGuides[r.kind]}</p>{themes.length>0&&<><h3>A good starting point for</h3><div className="topic-links">{themes.map(c=><a key={c.id} href={href(`collections/${c.id}/`)}>{c.name} ↗</a>)}</div><small>Use-case recommendations are editorial assessments.</small></>}</section><section className="prose-block"><h2>Make it your own</h2><ol className="steps"><li><b>Inspect the actual source.</b><p>Open the linked artifact and its project instructions. Check the required runtime, inputs, and upstream terms.</p></li><li><b>Adapt the content and visual direction.</b><p>Use the replacement notes above. Bring your own copy, data, assets, and branding; match the timing to your story.</p></li><li><b>Preview, render, and review.</b><p>Follow the upstream render workflow. Check framing, typography, audio, and output before publishing.</p></li></ol></section><section className="prose-block" id="sources"><h2>Review & sources <span className="count-small">{sources.length}</span></h2><p>Source and documentation review is separate from installation and render testing.</p>{sources.map(s=><details key={s.id}><summary>{s.title}<span>{s.checked_at}</span></summary><p>{s.notes}</p><External href={s.url}>Read reviewed source</External></details>)}</section></div><aside className="detail-sidebar"><div className="source-panel"><p className="eyebrow">START WITH THE SOURCE</p><h2>Build on this.</h2><External href={r.url} className="button primary" primaryResource={r.id}>{r.kind==='style'?'Open style specification':r.kind==='collection'?'Open related list':'Open original resource'}</External>{galleryLinks[r.project_id]&&<External href={galleryLinks[r.project_id]} className="button">Upstream demo gallery</External>}<button className="button" onClick={copy}>{copied?'Copied ✓':'Copy reuse brief'}<span aria-hidden="true">⧉</span></button><button className="text-button" aria-pressed={saved.includes(r.id)} onClick={()=>toggleSave(r.id)}>{saved.includes(r.id)?'★ Saved on this device':'☆ Save for later'}</button><span role="status" className="small-status">{copied?'Source link and reuse notes copied.':copyError}</span><dl><dt>Source project</dt><dd><a href={href(`projects/${p.id}/`)}>{p.name} ↗</a></dd><dt>Resource type</dt><dd>{kindNames[r.kind]}</dd><dt>Reviewed</dt><dd>{r.review.reviewed_at}</dd><dt>Render tested</dt><dd>{r.review.render_tested?'Yes':'Not tested'}</dd></dl><p className="license-note">Code, footage, fonts, audio, and dependencies retain their own terms. Check upstream licenses for your use.</p></div></aside></div>{related.length>0&&<section className="section"><div className="section-heading"><h2>Keep exploring.</h2><a href={href('library/')}>The full index ↗</a></div><Cards items={related}/></section>}</>;
 }
 function Projects(){return <><Intro label="THE PEOPLE & CODE BEHIND THE FRAMES" title="Good work has a source." text="Each project can contain many reusable resources. Explore the selected examples, then continue with the original creators."/><div className="project-list">{projects.map((p,i)=><a href={href(`projects/${p.id}/`)} className="project-row" key={p.id}><span className="project-index">{String(i+1).padStart(2,'0')}</span><div><h2>{p.name}</h2><p>{new URL(p.url).hostname}{'github' in p&&p.github?' / '+p.github.full_name:''}</p></div><span>{resources.filter(r=>r.project_id===p.id).length} resources</span><Arrow/></a>)}</div></>}
 function About(){return <><Intro label="CURATED, WITH CONTEXT" title="Know what you’re getting." text="An independent collection of reusable parts for making videos with code. Specific artifacts, useful context, and a path back to the source."/><div className="about-grid"><section className="prose-block"><h2>One index. Different starting points.</h2>{Object.entries(kindNames).map(([k,n])=><div className="kind-definition" key={k}><h3>{n}</h3><p>{kindGuides[k]}</p></div>)}</section><div><section className="prose-block"><h2>Our selection standard</h2><p>We look for an identifiable source file, example, configuration, implementation recipe, or reusable style specification. A preview alone is not an editable template.</p><p>Descriptions explain the look, the likely use, and the adaptation work. A source review does not promise installation success, render quality, or unrestricted commercial use.</p><p>The collection was researched and drafted with AI assistance. Sources and review dates stay attached to individual resources. The catalog is CC0; upstream materials keep their own licenses.</p><External href={`${repo}/blob/main/docs/selection.md`}>Full selection notes</External></section><section className="prose-block yellow-panel"><h2>Found a good starting point?</h2><p>Suggest a specific resource, tell us what can be reused, and link to its source and terms.</p><External href={`${repo}/issues/new/choose`} className="button primary">Suggest a resource</External><p><External href={`${repo}/blob/main/contributing.md`}>Contribution guidelines</External></p></section><section className="prose-block"><h2>About the covers</h2><p>Detail pages and the library use original editorial illustrations. They are not screenshots, footage, or verified reproductions. The homepage gallery hotlinks an upstream file, image, or page only when a reviewed preview exists, and labels it Upstream demo, Preview, or Editorial cover. Choose Play on an upstream demo to watch it here. Playback starts muted, and the player controls can unmute it. Videos never autoplay. Animated images may move when loaded. A preview is not a local render test.</p><div id="privacy"><h3>Your privacy choices</h3><p>Search runs in your browser. Saved resources, your theme preference and your analytics choice stay on this device. No account is required.</p><p>When optional analytics is available and you accept it, Google Analytics receives page visits and actions such as opening a resource, saving a resource or playing a preview. These events can include resource and project identifiers. Analytics uses cookies to understand visits. We do not send your free-text searches, copied content or saved-resource list to Google.</p><p>You can decline or withdraw analytics through Analytics choices in the footer. Analytics does not load before you accept, and actions taken before acceptance are not replayed. Withdrawing stops future collection; it does not erase data already sent. See <External href="https://policies.google.com/privacy">Google’s privacy policy</External>.</p><p>Preview images and videos may connect to their original providers, which receive normal web request information. Our website host may also keep access logs. These requests are separate from optional analytics. The site does not connect to a rendering service.</p></div></section></div></div></>}
 let content:React.ReactNode;
 if(route.type==='home')content=<>
  <section className="brand-hero" aria-labelledby="home-title">
   <div className="brand-hero-copy">
    <p className="eyebrow">A FIELD GUIDE TO CODE-DRIVEN VIDEO</p>
    <h1 id="home-title"><span>Good code.</span><span>Great video.</span></h1>
    <p className="brand-hero-description">Explore films, motion studies and reusable ideas.<br/>{' '}Find your next visual language. Make it yours.</p>
    <div className="hero-actions">
     <a className="button primary" href="#explore">Explore the work <span aria-hidden="true">↓</span></a>
     <External className="button secondary" href={repo}>View on GitHub</External>
    </div>
   </div>
   <figure className="brand-hero-art">
    <HeroMotion/>
    <figcaption>CODE <span aria-hidden="true">→</span> FRAME <span aria-hidden="true">→</span> MOTION</figcaption>
   </figure>
   <a className="hero-scroll" href="#explore">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
  </section>
  <div className="home-content">
  <section className="collection-signal" aria-label="About the collection">
   <p>An open collection.<br/>A new starting point.</p>
   <div className="signal-stats">
    <div><b>{resources.length}</b><span>curated resources</span></div>
    <div><b>{projects.length}</b><span>source projects</span></div>
    <div><b>{collections.length.toString().padStart(2,'0')}</b><span>creative directions</span></div>
   </div>
  </section>
  <section className="motion-index" id="explore" aria-labelledby="index-title">
   <header className="index-heading"><div><p className="eyebrow">THE MOTION INDEX</p><h2 id="index-title">Find a frame. Make it yours.</h2></div><a href={href('library/')}>All {resources.length} resources <Arrow/></a></header>
   <HomeGallery href={href} saved={saved} onSave={toggleSave} measurement={measurement}/>
  </section>
  <section className="use-case-band" aria-labelledby="use-case-title">
   <div className="use-case-intro"><div><p className="eyebrow">A DIRECTION FOR EVERY IDEA</p><h2 id="use-case-title">Start with a story.</h2></div><p>A launch, an explanation, a journey.<br/>Find the right tools for the thing you want to say.</p></div>
   <CollectionCards/>
  </section>
  <section className="editorial-note" aria-labelledby="editorial-title">
   <div><p className="eyebrow">CURATED, WITH CONTEXT</p><h2 id="editorial-title">Borrow a technique.<br/>Build something new.</h2></div>
   <div><p>Every entry leads to a specific source, with practical reuse notes and an honest review status. The starting point is here. The next frame is yours.</p><a href={href('about/')}>Our selection standard <Arrow/></a></div>
  </section>
  </div>
 </>;
else if(route.type==='library')content=<Library/>;
 else if(route.type==='resource')content=<ResourceDetail id={route.id}/>;
 else if(route.type==='projects')content=<Projects/>;
 else if(route.type==='project'){const p=projects.find(p=>p.id===route.id)!;content=<><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('projects/')}>Projects</a><span>/</span><span>{p.name}</span></nav><Intro label="SOURCE PROJECT" title={p.name} text="Selected reusable resources from this project, with specific artifact links and review notes."/><div className="page-actions"><External href={p.url} className="button primary">Visit original project</External><a href={href('projects/')}>All projects →</a></div><Cards items={resources.filter(r=>r.project_id===p.id)}/></>}
 else if(route.type==='collections')content=<><Intro label="START WITH YOUR STORY" title="A direction for every idea." text="Curated paths through the library. Pick the kind of video you want to make, then find a useful starting point."/><CollectionCards/></>;
 else if(route.type==='collection'){const c=collections.find(c=>c.id===route.id)!;content=<><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('collections/')}>Use cases</a><span>/</span><span>{c.name}</span></nav><Intro label="CURATED USE CASE" title={c.name} text={c.description}/><div className="collection-banner"><span>{c.symbol}</span><p>{c.caption}</p><b>{c.ids.length} starting points</b></div><Cards items={c.ids.map(id=>resources.find(r=>r.id===id)!)}/></>}
 else if(route.type==='about')content=<About/>;
 else if(route.type==='saved')content=<><Intro label="YOUR SHORTLIST" title="Keep the good stuff." text="Resources you saved in this browser. No account required; clearing browser storage removes this list."/>{saved.length?<Cards items={resources.filter(r=>saved.includes(r.id))}/>:<div className="empty"><strong>Your next idea is out there.</strong><p>Use the star on a resource to save it here.</p><a className="button primary" href={href('library/')}>Explore the library ↗</a></div>}</>;
 else content=<><Intro label="404 / FRAME NOT FOUND" title="This shot is missing." text="The page may have moved, or the address may be incorrect."/><a className="button primary" href={href('library/')}>Back to the library ↗</a></>;
 function trackLink(event:React.MouseEvent<HTMLDivElement>){
  if(event.defaultPrevented||(event.type==='click'?event.button!==0:event.button!==1))return;
  const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
  if(!anchor)return;
  const placement=anchor.closest('header')?'header':anchor.closest('footer')?'footer':anchor.closest('.brand-hero')?'hero':anchor.closest('#sources')?'review_sources':anchor.closest('.source-panel')?'source_panel':anchor.closest('.preview-details')?'gallery_preview':route.type==='home'?'home_gallery':route.type==='resource'?'resource_detail':route.type==='collection'?'collection':route.type==='project'?'project':route.type==='saved'?'saved':route.type==='about'?'about':'library';
  const action=navigationAction(anchor.href,window.location.origin,base,anchor.closest<HTMLElement>('[data-resource-id]')?.dataset.resourceId,anchor.dataset.primaryResource);
  if(!action)return;
  if(action.event==='open_resource'){trackEvent('open_resource',{...resourceParams(action.resource),destination_domain:action.destination_domain,placement});return;}
  if(action.event==='select_resource'){trackEvent('select_resource',{...resourceParams(action.resource),placement});return;}
  if(action.event==='suggest_resource_click'){trackEvent('suggest_resource_click',{destination_domain:action.destination_domain,placement});return;}
  trackEvent('outbound_click',{...(action.resource?resourceParams(action.resource):{}),destination_domain:action.destination_domain,placement});
 }
 return <div className={`site-shell${route.type==='home'?' home-site':''}`} onClick={trackLink} onAuxClick={trackLink}>
  <a className="skip-link" href="#main">Skip to content</a>
  <header className="site-header">
   <a className="brand" href={href()} aria-label="Awesome Code Video home">
    {route.type==='home'?<span className="brand-wordmark">AWESOME CODE VIDEO</span>:<><span className="brand-icon">{'<▶>'}</span><span>AWESOME<br/><b>CODE VIDEO</b></span></>}
   </a>
   {route.type==='home'&&<span className="brand-note">CODE × MOTION × POSSIBILITY</span>}
   <button className="menu-toggle" aria-expanded={menu} aria-controls="site-navigation" onClick={()=>setMenu(!menu)}>Menu {menu?'−':'+'}</button>
   <nav id="site-navigation" className={menu?'open':''} aria-label="Main navigation">
    <a aria-current={route.type==='library'?'page':undefined} href={href('library/')}>Library</a>
    <a aria-current={route.type==='collections'?'page':undefined} href={href('collections/')}>Use cases</a>
    <a aria-current={route.type==='projects'?'page':undefined} href={href('projects/')}>Projects</a>
    <a aria-current={route.type==='about'?'page':undefined} href={href('about/')}>About</a>
   </nav>
   <div className="header-tools">
    <a href={href('saved/')} className="saved-nav" aria-label={`Saved resources (${saved.length})`}>☆<span>{saved.length}</span></a>
    {route.type!=='home'&&<button className="theme-toggle" onClick={toggleTheme} aria-label={dark?'Use light theme':'Use dark theme'}>{dark?'☀':'◐'}</button>}
    <External href={repo} className="github-link">GitHub</External>
   </div>
  </header>
  <main id="main" className={`main ${route.type==='home'?'home-main':''}`}>{content}</main>
  <footer className="footer">
   <div className="footer-top">
    <a className="brand" href={href()}>{route.type==='home'?<span className="brand-wordmark">AWESOME<br/>CODE VIDEO</span>:<><span className="brand-icon">{'<▶>'}</span><span>AWESOME<br/><b>CODE VIDEO</b></span></>}</a>
    <p>For people who make<br/>videos with code.</p>
    <div><a href={href('about/')}>Selection standard ↗</a><External href={`${repo}/issues/new/choose`}>Suggest a resource</External><External href={`${repo}/blob/main/README.zh-CN.md`}>中文清单</External></div>
   </div>
   <div className="footer-bottom"><span>AN INDEPENDENT, OPEN COLLECTION.</span><span>Catalog: CC0 · Upstream materials retain their own terms.</span><External href={repo}>Made to be shared</External></div>
   <PrivacyChoices base={base}/>
  </footer>
  <div className="sr-only" role="status">{saveStatus}</div>
 </div>;
}
