import React,{useCallback,useEffect,useRef,useState} from 'react';
import {HeroMotion} from './HeroMotion';
import {PrivacyChoices} from './PrivacyChoices';
import {getAnalyticsConsent,subscribeAnalytics,trackEvent,type AnalyticsPlacement} from './analytics';
import {abandonGalleryPlayback,resetPreview,toggleGalleryPlayback,type GalleryPlaybackState} from './galleryPlayback';
import {GALLERY_BATCH_SIZE,GALLERY_CATEGORY_IDS,createGalleryBrowseState,selectGalleryCategory,loadMoreGalleryItems,type GalleryCategory} from './galleryBrowsing';
import {fableSpotlight,fableSpotlightBlocks,fableSpotlightHomeItems,fableSpotlightItems,spotlightDuration,spotlightExcerpt,spotlightFrame,FABLE_SPOTLIGHT_HEADING,FABLE_SPOTLIGHT_PATH,type FableSpotlightItem} from './fableSpotlight';
import {resources,projects,evidence,repo,kindNames,kindGuides,coreCount,collections,projectFor,collectionsFor,palette,galleryLinks,filterResources,routeForPath,pageMeta,homePreviewGroups,featuredGalleryItems,previewSpecs,kindCount,videoOrientation,type VideoOrientation,isYouTubePreview,resolvePreview,type Resource} from './model';

export type SiteMeasurement={trackEvent:typeof trackEvent;getAnalyticsConsent:typeof getAnalyticsConsent;subscribeAnalytics:typeof subscribeAnalytics};
const defaultMeasurement:SiteMeasurement={trackEvent,getAnalyticsConsent,subscribeAnalytics};

function Arrow(){return <span aria-hidden="true">↗</span>}
/** The code-brackets-and-play mark, drawn inline so the header needs no icon font. */
function BrandMark(){return <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="13" fill="#fcd228"/><path d="m23 19.5-10.5 12.5 10.5 12.5m18-25 10.5 12.5-10.5 12.5" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="m28 23 12 9-12 9z" fill="#111"/></svg>}
function Visual({resource,hero=false}:{resource:Resource,hero?:boolean}){
 const theme=palette(resource);
 return <div className={`visual visual-${theme} ${hero?'visual-hero':''}`} aria-hidden="true">
  {theme==='paper'?<><div className="paper-sheet sheet-back"/><div className="paper-sheet sheet-front"><span>FIELD NOTES / 01</span><strong>{resource.id.includes('cut')?'CUT.\nLAYER.\nMOVE.':'Ideas,\nin motion.'}</strong><i>↗</i></div><div className="paper-stamp">MAKE IT<br/>YOUR OWN</div></>:
   theme==='map'?<><svg viewBox="0 0 400 240"><defs><pattern id={'grid-'+resource.id} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="currentColor" strokeOpacity=".13"/></pattern></defs><rect x="-400" width="1200" height="240" stroke="none" fill={`url(#grid-${resource.id})`}/><ellipse cx="200" cy="120" rx="100" ry="91"/><ellipse cx="200" cy="120" rx="50" ry="91"/><path d="M100 120h200M113 80h174M113 160h174M200 29v182"/><path className="route-path" d="M115 159Q165 38 270 81"/><circle cx="115" cy="159" r="5"/><circle cx="270" cy="81" r="6"/></svg><span className="coordinates">35.68° N → 139.69° E</span></>:
   theme==='pixel'?<><div className="pixel-stars">+ · + · + · +</div><div className="pixel-word">INSERT<br/><span>STORY_</span></div><div className="pixel-ground">▟▙ ▟▙ ▟▙ ▟▙ ▟▙ ▟▙ ▟▙</div><span className="pixel-label">PRESS PLAY TO BEGIN</span></>:
   theme==='chart'?<><span className="chart-label">A STORY IN NUMBERS</span><div className="chart-bars">{[30,52,43,74,90].map((h,i)=><i key={i} style={{height:h+'%'}}/> )}</div><span className="chart-caption">01 — 02 — 03 — 04 — 05</span></>:
   theme==='dark'?<><div className="wire-box"><div/><div/><div/></div><span className="dark-label">BUILD / FRAME / RENDER</span></>:
   <><div className="type-orbit"/><span className="type-kind">{kindNames[resource.kind]}</span><div className="type-word" data-fit={resource.name.length<=8?'short':resource.name.length<=14?'medium':resource.name.length<=22?'long':'longest'}>{resource.name}</div><span className="type-star">✳</span></>}
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

type PreviewPlaybackProps={activeId:string|null,playing:boolean,onToggle:(id:string)=>void,onPlayback:(id:string,playing:boolean)=>void,onVideo:(id:string,node:HTMLVideoElement|null,url?:string|null)=>void};
function upstreamLabel(resource:Resource){
 const preview=resolvePreview(resource);
 return preview.playable&&preview.url?'Upstream file':isYouTubePreview(resource)?'Watch on YouTube':preview.mode==='thumb_link'?'Upstream image':'Upstream page';
}
/**
 * The picture for a resource: a playable upstream demo, a linked upstream image or page, or the editorial cover.
 * Shared by the homepage gallery and the resource page so both follow the same playback and labelling rules.
 */
function PreviewFrame({resource,href,activeId,playing,onToggle,onPlayback,onVideo,measurement=defaultMeasurement,placement,fallbackHref,hero=false,editorialCaption}:PreviewPlaybackProps&{resource:Resource,href:(path?:string)=>string,measurement?:SiteMeasurement,placement:AnalyticsPlacement,fallbackHref?:string,hero?:boolean,editorialCaption?:string}){
 const {trackEvent}=measurement;
 const preview=resolvePreview(resource);
 const poster=preview.poster?.startsWith('/previews/')?href(preview.poster.slice(1)):preview.poster;
 const still=poster||preview.url;
 const canPlay=Boolean(preview.playable&&preview.url);
 // Scope the playback session by placement so Featured and the browse gallery can
 // host the same resource without sharing one <video> registry key.
 const playbackId=`${placement}:${resource.id}`;
 const previewDomId=`preview-${placement}-${resource.id.replaceAll('-','_')}`;
 const armed=canPlay&&activeId===playbackId;
 const showPause=armed&&playing;
 const previewStarted=useRef(false);
 useEffect(()=>{if(!armed)previewStarted.current=false;},[armed]);
 function previewPlaying(){onPlayback(playbackId,true);if(armed&&!previewStarted.current){previewStarted.current=true;trackEvent('preview_start',{...resourceParams(resource),placement});}}
 function previewEnded(){onPlayback(playbackId,false);if(previewStarted.current){trackEvent('preview_complete',{...resourceParams(resource),placement});previewStarted.current=false;}}
 const bind=useCallback((node:HTMLVideoElement|null)=>{onVideo(playbackId,node,preview.url);},[onVideo,playbackId,preview.url]);
 const media=canPlay?<>
  <button type="button" className={`preview-play${armed?' is-armed':''}`} aria-pressed={showPause} aria-controls={previewDomId} aria-label={`${showPause?'Pause':'Play'} upstream demo: ${resource.name}`} onClick={()=>onToggle(playbackId)}><span aria-hidden="true">{showPause?'Pause':'Play'}</span></button>
  {poster?<img className="preview-media preview-poster" src={poster} alt="" loading="lazy" decoding="async"/>:<Visual resource={resource} hero={hero}/>}
  <video id={previewDomId} ref={bind} className={`preview-media preview-player${armed?' is-armed':''}`} preload="none" poster={poster||undefined} playsInline referrerPolicy="no-referrer" tabIndex={armed?undefined:-1} controls={armed||undefined} aria-hidden={armed?undefined:true} onPlay={()=>onPlayback(playbackId,true)} onPlaying={previewPlaying} onEnded={previewEnded} onEmptied={()=>{previewStarted.current=false;}} onPause={()=>onPlayback(playbackId,false)}/>
 </>:!preview.degraded&&preview.mode==='thumb_link'&&still?<img className="preview-media preview-poster" src={still} alt="" loading="lazy" decoding="async"/>:!preview.degraded&&preview.mode==='embed'&&poster?<img className="preview-media preview-poster" src={poster} alt="" loading="lazy" decoding="async"/>:!preview.degraded&&preview.mode==='embed'?<div className="preview-embed"><span>UPSTREAM PAGE</span><b>Open the source page.</b></div>:<Visual resource={resource} hero={hero}/>;
 const target=preview.url||fallbackHref;
 const frame=canPlay||!target?<div className="art-link">{media}</div>:<a className="art-link" href={target} target={preview.url?'_blank':undefined} rel={preview.url?'noopener noreferrer':undefined} aria-label={`Open ${preview.mode==='embed'?'source page':'upstream preview'}: ${resource.name}`}>{media}</a>;
 return <div className="art-frame">{frame}<span className="art-caption">{preview.degraded&&editorialCaption?editorialCaption:preview.caption}</span></div>;
}


export function GalleryCard({resource,href,saved,onSave,activeId,playing,onToggle,onPlayback,onVideo,measurement=defaultMeasurement,placement='home_gallery'}:PreviewPlaybackProps&{resource:Resource,href:(path?:string)=>string,saved:boolean,onSave:(id:string)=>void,measurement?:SiteMeasurement,placement?:AnalyticsPlacement}){
 const preview=resolvePreview(resource);
 return <article className="resource-card gallery-card" data-resource-id={resource.id}>
  <PreviewFrame resource={resource} href={href} activeId={activeId} playing={playing} onToggle={onToggle} onPlayback={onPlayback} onVideo={onVideo} measurement={measurement} placement={placement} fallbackHref={href(`resources/${resource.id}/`)}/>
  <div className="card-body">
   <div className="card-kicker">
    <KindMeta resource={resource}/>
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
     {!preview.degraded&&preview.url?<External href={preview.url} className="preview-source">{upstreamLabel(resource)}</External>:null}
     <p className="preview-review">Source reviewed · {resource.review.reviewed_at}</p>
    </div>
   </details>
  </div>
 </article>;
}
type HomePlaybackControls={
 playback:GalleryPlaybackState;
 onVideo:(id:string,node:HTMLVideoElement|null,url?:string|null)=>void;
 onPlayback:(id:string,playing:boolean)=>void;
 toggle:(id:string)=>void;
 resetPlayback:()=>void;
};

function useHomePlayback():HomePlaybackControls{
 const videos=useRef(new Map<string,HTMLVideoElement>());
 const sources=useRef(new Map<string,string>());
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
 const toggle=useCallback((id:string)=>{
  const request=++playRequest.current;
  const result=toggleGalleryPlayback(playbackRef.current,id,videos.current,sources.current);
  playbackRef.current=result.state;
  setPlayback(result.state);
  void result.play?.catch(()=>{
   if(request!==playRequest.current)return;
   const next=abandonGalleryPlayback(playbackRef.current,id);
   playbackRef.current=next;
   setPlayback(next);
   const video=videos.current.get(id);
   if(video&&next.activeId!==id)resetPreview(video);
  });
 },[]);
 const resetPlayback=useCallback(()=>{
  ++playRequest.current;
  const previousId=playbackRef.current.activeId;
  const idle={activeId:null,playing:false};
  playbackRef.current=idle;
  setPlayback(idle);
  if(previousId){const previous=videos.current.get(previousId);if(previous)resetPreview(previous);}
 },[]);
 return {playback,onVideo,onPlayback,toggle,resetPlayback};
}

function FeaturedGallery({href,saved,onSave,measurement,playback}:{href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement,playback:HomePlaybackControls}){
 const items=featuredGalleryItems();
 const track=useRef<HTMLDivElement>(null);
 if(!items.length)return null;
 function step(direction:1|-1){
  const node=track.current;
  if(!node)return;
  const first=node.firstElementChild?.getBoundingClientRect().width;
  const calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollBy({left:direction*(first?(first+24)*2:node.clientWidth*.8),behavior:calm?'auto':'smooth'});
 }
 return <section className="featured-gallery" id="featured" aria-labelledby="featured-title">
  <header className="featured-heading">
   <div>
    <p className="eyebrow">Featured</p>
    <h2 id="featured-title">Look this cool. Steal the recipe.</h2>
   </div>
   <div className="featured-tools">
    <a href="#explore">Browse the full index <Arrow/></a>
    <div className="featured-steps">
     <button type="button" aria-label="Scroll featured demos back" onClick={()=>step(-1)}><span aria-hidden="true">←</span></button>
     <button type="button" aria-label="Scroll featured demos forward" onClick={()=>step(1)}><span aria-hidden="true">→</span></button>
    </div>
   </div>
  </header>
  <div className="featured-track" role="list" ref={track}>
   {items.map(resource=><div key={resource.id} className="featured-item" role="listitem"><GalleryCard resource={resource} href={href} saved={saved.includes(resource.id)} onSave={onSave} activeId={playback.playback.activeId} playing={playback.playback.playing} onToggle={playback.toggle} onPlayback={playback.onPlayback} onVideo={playback.onVideo} measurement={measurement} placement="home_featured"/></div>)}
  </div>
 </section>;
}

function SpotlightModal({item,onClose}:{item:FableSpotlightItem,onClose:()=>void}){
 const frame=spotlightFrame(item);
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{
  const node=video.current;
  if(!node)return;
  node.muted=true;
  node.src=item.video_url;
  node.controls=true;
  const pending=node.play();
  if(pending)void pending.catch(()=>{});
  function onKey(event:KeyboardEvent){if(event.key==='Escape')onClose();}
  window.addEventListener('keydown',onKey);
  return()=>{
   window.removeEventListener('keydown',onKey);
   node.pause();
   node.removeAttribute('src');
   try{node.load();}catch{/* The dialog may already be gone. */}
  };
 },[item.id,item.video_url,onClose]);
 return <div className="spotlight-modal" onClick={onClose}>
  <div className="spotlight-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="spotlight-modal-title" data-frame={frame} onClick={event=>event.stopPropagation()}>
   <button type="button" className="spotlight-modal-close" aria-label="Close" onClick={onClose}>Close</button>
   <div className="spotlight-modal-stage">
    <img className="preview-media preview-poster" src={item.preview} alt=""/>
    <video ref={video} className="preview-media preview-player is-armed" poster={item.preview} playsInline referrerPolicy="no-referrer" controls muted/>
   </div>
   <div className="spotlight-modal-copy">
    <p className="card-kicker">{`@${item.author}`}</p>
    <h2 id="spotlight-modal-title">{item.author_name}</h2>
    <p><time dateTime={item.created_at_utc}>{item.created_at_shanghai}</time></p>
    <p className="spotlight-modal-text">{item.text}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer">Original post<Arrow/></a>
   </div>
  </div>
 </div>;
}

function SpotlightCard({item,activeId,playing,onToggle,onPlayback,onVideo,onOpen}:{item:FableSpotlightItem,activeId:string|null,playing:boolean,onToggle:(id:string)=>void,onPlayback:(id:string,playing:boolean)=>void,onVideo:(id:string,node:HTMLVideoElement|null,url?:string|null)=>void,onOpen:()=>void}){
 const playbackId=`spotlight:${item.id}`;
 const previewDomId=`preview-spotlight-${item.id}`;
 const armed=activeId===playbackId;
 const showPause=armed&&playing;
 const bind=useCallback((node:HTMLVideoElement|null)=>{onVideo(playbackId,node,item.video_url);},[onVideo,playbackId,item.video_url]);
 const clock=spotlightDuration(item.duration_ms);
 const excerpt=spotlightExcerpt(item.text);
 return <article className="spotlight-card" data-spotlight-id={item.id} data-frame={spotlightFrame(item)} onClick={onOpen}>
  <div className="art-frame">
   <div className="art-link">
    <button type="button" className={`preview-play${armed?' is-armed':''}`} aria-pressed={showPause} aria-controls={previewDomId} aria-label={`${showPause?'Pause':'Play'} public post: ${item.author_name}`} onClick={event=>{event.stopPropagation();onToggle(playbackId);}}><span aria-hidden="true">{showPause?'Pause':'Play'}</span></button>
    <img className="preview-media preview-poster" src={item.preview} alt="" loading="lazy" decoding="async"/>
    <video id={previewDomId} ref={bind} className={`preview-media preview-player${armed?' is-armed':''}`} preload="none" poster={item.preview} playsInline referrerPolicy="no-referrer" tabIndex={armed?undefined:-1} controls={armed||undefined} aria-hidden={armed?undefined:true} onPlay={()=>onPlayback(playbackId,true)} onPlaying={()=>onPlayback(playbackId,true)} onEnded={()=>onPlayback(playbackId,false)} onPause={()=>onPlayback(playbackId,false)}/>
   </div>
   <span className="art-caption">Public post</span>
  </div>
  <div className="card-body">
   <p className="card-kicker"><span className="card-meta"><span>{`@${item.author}`}</span>{clock?<span className="card-spec">{clock}</span>:null}</span></p>
   <h3><button type="button" className="spotlight-open" onClick={event=>{event.stopPropagation();onOpen();}}>{item.author_name}<Arrow/></button></h3>
   {excerpt?<p>{excerpt}</p>:null}
  </div>
 </article>;
}

function SpotlightFrames({items,playback,heading}:{items:FableSpotlightItem[],playback:HomePlaybackControls,heading:'h2'|'h3'}){
 const Title=heading;
 const [openId,setOpenId]=useState<string|null>(null);
 const close=useCallback(()=>setOpenId(null),[]);
 const open=items.find(item=>item.id===openId)??null;
 return <>
  {fableSpotlightBlocks(items).map(block=><section key={block.frame} className="fable-frame" data-frame={block.frame} aria-labelledby={`fable-${heading}-${block.frame}`}>
   <Title id={`fable-${heading}-${block.frame}`} className="fable-frame-title">{block.label}</Title>
   <div className="fable-spotlight-grid">
    {block.items.map(item=><SpotlightCard key={item.id} item={item} activeId={playback.playback.activeId} playing={playback.playback.playing} onToggle={playback.toggle} onPlayback={playback.onPlayback} onVideo={playback.onVideo} onOpen={()=>setOpenId(item.id)}/>)}
   </div>
  </section>)}
  {open?<SpotlightModal item={open} onClose={close}/>:null}
 </>;
}

function FableSpotlightHome({href,playback}:{href:(path?:string)=>string,playback:HomePlaybackControls}){
 const items=fableSpotlightHomeItems();
 if(!items.length)return null;
 return <section className="fable-spotlight" id="fable-5-2" aria-labelledby="fable-spotlight-title">
  <header className="featured-heading">
   <div>
    <p className="eyebrow">{fableSpotlight.eyebrow}</p>
    <h2 id="fable-spotlight-title">{FABLE_SPOTLIGHT_HEADING}</h2>
    <p className="fable-spotlight-copy">{fableSpotlight.description}</p>
   </div>
   <div className="featured-tools">
    <a href={href(FABLE_SPOTLIGHT_PATH)}>{`All ${fableSpotlightItems().length} posts `}<Arrow/></a>
   </div>
  </header>
  <SpotlightFrames items={items} playback={playback} heading="h3"/>
 </section>;
}

function FableSpotlightPage({href}:{href:(path?:string)=>string}){
 const playback=useHomePlayback();
 const items=fableSpotlightItems();
 return <>
  <nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href()}>Home</a><span>/</span><span>{FABLE_SPOTLIGHT_HEADING}</span></nav>
  <Intro label={fableSpotlight.eyebrow} title={FABLE_SPOTLIGHT_HEADING} text={fableSpotlight.description}/>
  <section className="spotlight-index" aria-label={FABLE_SPOTLIGHT_HEADING}>
   <p className="spotlight-count">{`${items.length} public posts, newest first`}</p>
   <SpotlightFrames items={items} playback={playback} heading="h2"/>
  </section>
 </>;
}

function HomeGallery({href,saved,onSave,measurement,playback}:{href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement,playback:HomePlaybackControls}){
 const {trackEvent}=measurement;
 const {resetPlayback,playback:playbackState,onVideo,onPlayback,toggle}=playback;
 const tabs=useRef(new Map<GalleryCategory,HTMLButtonElement>());
 const grid=useRef<HTMLDivElement>(null);
 const revealIndex=useRef<number|null>(null);
 const [browse,setBrowse]=useState(createGalleryBrowseState);
 const [orientation,setOrientation]=useState<VideoOrientation>('landscape');
 const activate=useCallback((category:GalleryCategory)=>{
  resetPlayback();
  revealIndex.current=null;
  setBrowse(current=>selectGalleryCategory(current,category));
 },[resetPlayback]);
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
     <div className={`card-grid ${section.id==='video-gallery'?`gallery-${orientation}`:''}`} ref={grid}>{visible.map(resource=><GalleryCard key={resource.id} resource={resource} href={href} saved={saved.includes(resource.id)} onSave={onSave} activeId={playbackState.activeId} playing={playbackState.playing} onToggle={toggle} onPlayback={onPlayback} onVideo={onVideo} measurement={measurement} placement="home_gallery"/>)}</div>
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

/** The catalog's three kinds of starting point, and how much of the film each one already builds. */
const startPaths=[
 {id:'film',name:'Films & scenes',title:'Start from a finished cut.',text:'A complete, editable project. Story, scene code and timing already work. Bring your own copy, assets and brand.',built:[true,true,true,true,true],status:'Timeline: complete',links:[{kind:'film',unit:'films'},{kind:'scene',unit:'scenes'}]},
 {id:'shot',name:'Shot recipes',title:'Drop in one good move.',text:'A single shot or motion: a reveal, a camera push, a chart that draws itself. Wire it into the timeline you already have.',built:[false,false,true,false,false],status:'Timeline: one shot',links:[{kind:'shot',unit:'shot recipes'},{kind:'preset',unit:'map presets'}]},
 {id:'style',name:'Visual styles',title:'Hand over the art direction.',text:'A written specification for a look: palette, type and motion rules. Give it to your coding agent, then build the scenes to match.',built:[false,false,false,false,false],status:'Timeline: yours to build',links:[{kind:'style',unit:'visual styles'}]},
];
function StartPaths({href}:{href:(path?:string)=>string}){
 return <section className="start-paths" aria-labelledby="start-title">
  <header className="start-heading">
   <div><p className="eyebrow">Three ways to start</p><h2 id="start-title">Pick how much is already built.</h2></div>
   <p>Every entry is one of three kinds of starting point. They look alike in a gallery, and ask for very different amounts of work.</p>
  </header>
  <ol className="start-grid">
   {startPaths.map((path,index)=><li key={path.id} className="start-card">
    <p className="start-kind"><span>{String(index+1).padStart(2,'0')}</span>{path.name}</p>
    <svg className="start-timeline" viewBox="0 0 220 22" aria-hidden="true" focusable="false">{path.built.map((built,at)=><rect key={at} className={built?'is-built':undefined} x={at*45+.75} y=".75" width="38.5" height="20.5" rx="3"/>)}</svg>
    <p className="start-status">{path.status}</p>
    <h3>{path.title}</h3>
    <p className="start-text">{path.text}</p>
    <p className="start-links">{path.links.map(link=><a key={link.kind} href={href(`library/?kind=${link.kind}`)}>{kindCount(link.kind)} {link.unit} <Arrow/></a>)}</p>
   </li>)}
  </ol>
 </section>;
}

function HomeMediaSections({href,saved,onSave,measurement,playback}:{href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement,playback:HomePlaybackControls}){
 return <>
  <FeaturedGallery href={href} saved={saved} onSave={onSave} measurement={measurement} playback={playback}/>
  <StartPaths href={href}/>
  <section className="motion-index" id="explore" aria-labelledby="index-title">
   <header className="index-heading"><div><p className="eyebrow">The motion index</p><h2 id="index-title">Find a frame. Make it yours.</h2></div><a href={href('library/')}>Search all {resources.length} resources <Arrow/></a></header>
   <HomeGallery href={href} saved={saved} onSave={onSave} measurement={measurement} playback={playback}/>
  </section>
 </>;
}

function HomeSpotlightAndMedia({href,saved,onSave,measurement}:{href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement}){
 const playback=useHomePlayback();
 return <>
  <FableSpotlightHome href={href} playback={playback}/>
  <HomeMediaSections href={href} saved={saved} onSave={onSave} measurement={measurement} playback={playback}/>
 </>;
}

type PageProps={href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void,measurement:SiteMeasurement};
function Intro({label,title,text}:{label:string,title:string,text:string}){return <section className="page-intro"><p className="eyebrow">{label}</p><h1>{title}</h1><p className="intro-copy">{text}</p></section>}
/** Kind, then the measured running time and frame size of the preview file when known. */
function KindMeta({resource}:{resource:Resource}){return <span className="card-meta"><span>{kindNames[resource.kind]}</span>{previewSpecs(resource).map(spec=><span className="card-spec" key={spec}>{spec}</span>)}</span>}
/** The still a browse card rests on: the bundled frame, or the upstream image itself. Null keeps the editorial cover. */
export function coverStill(resource:Resource,href:(path?:string)=>string):{src:string,caption:string}|null{
 const preview=resolvePreview(resource);
 if(preview.degraded)return null;
 const poster=preview.poster?.startsWith('/previews/')?href(preview.poster.slice(1)):preview.poster;
 const src=poster||(preview.mode==='thumb_link'?preview.url:null);
 return src?{src,caption:preview.caption}:null;
}
/** Browse card for the library, use cases, projects and saved list. It shows a still and links to the resource; playback lives on the resource page. */
function ResourceCard({resource:r,href,saved,onSave}:{resource:Resource,href:(path?:string)=>string,saved:boolean,onSave:(id:string)=>void}){
 const still=coverStill(r,href);
 return <article className="resource-card" data-resource-id={r.id}><div className="art-frame"><a className="art-link" href={href(`resources/${r.id}/`)} tabIndex={-1} aria-hidden="true">{still?<img className="preview-media preview-poster" src={still.src} alt="" loading="lazy" decoding="async"/>:<Visual resource={r}/>}</a><span className="art-caption">{still?still.caption:'EDITORIAL COVER'}</span></div><div className="card-body"><div className="card-kicker"><KindMeta resource={r}/><button className={`save-button ${saved?'is-saved':''}`} aria-label={`${saved?'Unsave':'Save'} ${r.name}`} aria-pressed={saved} onClick={()=>onSave(r.id)}>{saved?'★':'☆'}</button></div><h3><a href={href(`resources/${r.id}/`)}>{r.name}<Arrow/></a></h3><p>{r.description}</p><div className="card-foot"><span>{projectFor(r).name}</span><span>Source reviewed</span></div></div></article>;
}
function CardGrid({items,href,saved,onSave}:{items:Resource[],href:(path?:string)=>string,saved:string[],onSave:(id:string)=>void}){return <div className="card-grid">{items.map(r=><ResourceCard key={r.id} resource={r} href={href} saved={saved.includes(r.id)} onSave={onSave}/>)}</div>}
function Library({href,saved,onSave,measurement}:PageProps){
 const {trackEvent,getAnalyticsConsent,subscribeAnalytics}=measurement;
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
 return <><Intro label="THE RESOURCE INDEX" title="Find your starting frame." text="A complete film, one good shot, or a whole new visual language. Find the source. Make it yours."/><div className="library-layout"><aside className="filters"><div className="filter-heading"><h2>FILTER THE INDEX</h2><button onClick={clear}>Reset</button></div><label>Resource type<select value={filters.kind} onChange={e=>change('kind',e.target.value)}><option value="">All types</option>{Object.entries(kindNames).map(([id,name])=><option key={id} value={id}>{name} ({resources.filter(r=>r.kind===id).length})</option>)}</select></label><label>What are you making?<select value={filters.use} onChange={e=>change('use',e.target.value)}><option value="">All use cases</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Source project<select value={filters.project} onChange={e=>change('project',e.target.value)}><option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="filter-note"><span>GOOD TO KNOW</span><p>A style is a specification. A shot is a building block. A film is an editable project.</p><a href={href('about/')}>Read the selection guide →</a></div></aside><div className="library-results"><form className="search-box" onSubmit={e=>{e.preventDefault();recordSearch(filters);}} role="search"><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m13 13 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><input type="search" aria-label="Search resources" placeholder="Try paper, maps, captions, Remotion…" value={filters.q} onChange={e=>change('q',e.target.value)}/></form><div className="results-toolbar"><p aria-live="polite"><b>{result.length}</b> resources{filters.q?` for “${filters.q}”`:''}</p><label>Sort<select aria-label="Sort resources" value={filters.sort} onChange={e=>change('sort',e.target.value)}><option value="curated">{filters.q?'Relevance':'Curated order'}</option><option value="name">Name A–Z</option></select></label></div>{result.length?<CardGrid items={result} href={href} saved={saved} onSave={onSave}/>:<div className="empty"><strong>No matching frames.</strong><p>Try a broader search or remove a filter.</p><button className="button" onClick={clear}>Clear all filters ↗</button></div>}<noscript>Enable JavaScript to use search and filters. All resources are listed below and have standalone detail pages.</noscript></div></div></>;
}
function ResourceDetail({id,href,saved,onSave,measurement}:PageProps&{id:string}){
 const {trackEvent}=measurement;
 const playback=useHomePlayback();
 const r=resources.find(r=>r.id===id)!;const p=projectFor(r);const sources=evidence.filter(s=>r.evidence_ids.includes(s.id));const themes=collectionsFor(r);const [copied,setCopied]=useState(false);const [copyError,setCopyError]=useState('');
 const preview=resolvePreview(r);
 async function copy(){try{await navigator.clipboard.writeText(`${r.name}\n${r.url}\n\n${r.description}\n\nResource type: ${kindNames[r.kind]}. ${kindGuides[r.kind]}\nSource reviewed: ${r.review.reviewed_at}. Render tested: ${r.review.render_tested?'yes':'no'}. Check upstream licenses and dependencies before reuse.`);setCopied(true);setCopyError('');trackEvent('copy_reuse_brief',{...resourceParams(r),placement:'source_panel'});}catch{setCopyError('Clipboard unavailable. Select and copy the source link and reuse notes below.');}}
 const related=resources.filter(x=>x.id!==r.id&&(x.project_id===r.project_id || themes.some(c=>c.ids.includes(x.id)))).slice(0,3);
 return <><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('library/')}>Library</a><span>/</span><a href={href(`projects/${p.id}/`)}>{p.name}</a><span>/</span><span>{r.name}</span></nav><div className="detail-layout"><div className="detail-main"><figure className="detail-art"><PreviewFrame resource={r} href={href} activeId={playback.playback.activeId} playing={playback.playback.playing} onToggle={playback.toggle} onPlayback={playback.onPlayback} onVideo={playback.onVideo} measurement={measurement} placement="resource_detail" hero editorialCaption="EDITORIAL COVER — NOT AN UPSTREAM RENDER"/><figcaption className="detail-credit">{preview.degraded?'An original title card in this site’s own style. It is not a screenshot or an upstream render.':<>{preview.detail} {preview.playable?'Playback starts muted. ':null}{preview.license}. {preview.attribution}{preview.url?<> <External href={preview.url} className="preview-source">{upstreamLabel(r)}</External></>:null}</>}</figcaption></figure><div className="detail-title"><span className="tag"><KindMeta resource={r}/></span><h1>{r.name}</h1><p>{r.description}</p></div><section className="prose-block"><h2>What you’re reusing</h2><p>{kindGuides[r.kind]}</p>{themes.length>0&&<><h3>A good starting point for</h3><div className="topic-links">{themes.map(c=><a key={c.id} href={href(`collections/${c.id}/`)}>{c.name} ↗</a>)}</div><small>Use-case recommendations are editorial assessments.</small></>}</section><section className="prose-block"><h2>Make it your own</h2><ol className="steps"><li><b>Inspect the actual source.</b><p>Open the linked artifact and its project instructions. Check the required runtime, inputs, and upstream terms.</p></li><li><b>Adapt the content and visual direction.</b><p>Use the replacement notes above. Bring your own copy, data, assets, and branding; match the timing to your story.</p></li><li><b>Preview, render, and review.</b><p>Follow the upstream render workflow. Check framing, typography, audio, and output before publishing.</p></li></ol></section><section className="prose-block" id="sources"><h2>Review & sources <span className="count-small">{sources.length}</span></h2><p>Source and documentation review is separate from installation and render testing.</p>{sources.map(s=><details key={s.id}><summary>{s.title}<span>{s.checked_at}</span></summary><p>{s.notes}</p><External href={s.url}>Read reviewed source</External></details>)}</section></div><aside className="detail-sidebar"><div className="source-panel"><p className="eyebrow">START WITH THE SOURCE</p><h2>Build on this.</h2><External href={r.url} className="button primary" primaryResource={r.id}>{r.kind==='style'?'Open style specification':r.kind==='collection'?'Open related list':'Open original resource'}</External>{galleryLinks[r.project_id]&&<External href={galleryLinks[r.project_id]} className="button">Upstream demo gallery</External>}<button className="button" onClick={copy}>{copied?'Copied ✓':'Copy reuse brief'}<span aria-hidden="true">⧉</span></button><button className="text-button" aria-pressed={saved.includes(r.id)} onClick={()=>onSave(r.id)}>{saved.includes(r.id)?'★ Saved on this device':'☆ Save for later'}</button><span role="status" className="small-status">{copied?'Source link and reuse notes copied.':copyError}</span><dl><dt>Source project</dt><dd><a href={href(`projects/${p.id}/`)}>{p.name} ↗</a></dd><dt>Resource type</dt><dd>{kindNames[r.kind]}</dd><dt>Reviewed</dt><dd>{r.review.reviewed_at}</dd><dt>Render tested</dt><dd>{r.review.render_tested?'Yes':'Not tested'}</dd></dl><p className="license-note">Code, footage, fonts, audio, and dependencies retain their own terms. Check upstream licenses for your use.</p></div></aside></div>{related.length>0&&<section className="section"><div className="section-heading"><h2>Keep exploring.</h2><a href={href('library/')}>The full index ↗</a></div><CardGrid items={related} href={href} saved={saved} onSave={onSave}/></section>}</>;
}

export function App({path,base='/',measurement=defaultMeasurement}:{path:string,base?:string,measurement?:SiteMeasurement}){
 const {trackEvent,getAnalyticsConsent,subscribeAnalytics}=measurement;
 const route=routeForPath(path,base);const href=(s='')=>base+s;
 const [saved,setSaved]=useState<string[]>([]);const [saveStatus,setSaveStatus]=useState('');
 const [menu,setMenu]=useState(false);
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem('acv:saved')||'[]');if(Array.isArray(data))setSaved(data.filter((id:unknown)=>typeof id==='string'&&resources.some(r=>r.id===id)));}catch{}document.title=pageMeta(route).title;},[]);
 function toggleSave(id:string){const resource=resources.find(r=>r.id===id);if(!resource)return;const next=saved.includes(id)?saved.filter(s=>s!==id):[...saved,id];setSaved(next);trackEvent(next.includes(id)?'save_resource':'unsave_resource',{...resourceParams(resource),placement:route.type==='resource'?'resource_detail':route.type==='home'?'home_gallery':route.type==='collection'?'collection':route.type==='project'?'project':route.type==='saved'?'saved':'library'});try{localStorage.setItem('acv:saved',JSON.stringify(next));setSaveStatus(next.includes(id)?'Saved on this device.':'Removed from saved resources.');}catch{setSaveStatus('Saved for this visit. Browser storage is unavailable.');}}
 function CollectionCards(){return <div className="collection-grid">{collections.map((c,i)=><a className="collection-card" key={c.id} href={href(`collections/${c.id}/`)}><span className="collection-num">0{i+1} / {c.ids.length} RESOURCES</span><strong className="collection-symbol">{c.symbol}</strong><h3>{c.name}<Arrow/></h3><p>{c.caption}</p></a>)}</div>}
 function Projects(){return <><Intro label="THE PEOPLE & CODE BEHIND THE FRAMES" title="Good work has a source." text="Each project can contain many reusable resources. Explore the selected examples, then continue with the original creators."/><div className="project-list">{projects.map((p,i)=><a href={href(`projects/${p.id}/`)} className="project-row" key={p.id}><span className="project-index">{String(i+1).padStart(2,'0')}</span><div><h2>{p.name}</h2><p>{new URL(p.url).hostname}{'github' in p&&p.github?' / '+p.github.full_name:''}</p></div><span>{(count=>`${count} ${count===1?'resource':'resources'}`)(resources.filter(r=>r.project_id===p.id).length)}</span><Arrow/></a>)}</div></>}
 function About(){return <><Intro label="CURATED, WITH CONTEXT" title="Know what you’re getting." text="An independent collection of reusable parts for making videos with code. Specific artifacts, useful context, and a path back to the source."/><div className="about-grid"><section className="prose-block"><h2>One index. Different starting points.</h2>{Object.entries(kindNames).map(([k,n])=><div className="kind-definition" key={k}><h3>{n}</h3><p>{kindGuides[k]}</p></div>)}</section><div><section className="prose-block"><h2>Our selection standard</h2><p>We look for an identifiable source file, example, configuration, implementation recipe, or reusable style specification. A preview alone is not an editable template.</p><p>Descriptions explain the look, the likely use, and the adaptation work. A source review does not promise installation success, render quality, or unrestricted commercial use.</p><p>The collection was researched and drafted with AI assistance. Sources and review dates stay attached to individual resources. The catalog is CC0; upstream materials keep their own licenses.</p><External href={`${repo}/blob/main/docs/selection.md`}>Full selection notes</External></section><section className="prose-block yellow-panel"><h2>Found a good starting point?</h2><p>Suggest a specific resource, tell us what can be reused, and link to its source and terms.</p><External href={`${repo}/issues/new/choose`} className="button primary">Suggest a resource</External><p><External href={`${repo}/blob/main/contributing.md`}>Contribution guidelines</External></p></section><section className="prose-block"><h2>About the covers</h2><p>Where a reviewed preview exists, a card shows it: a still frame from the upstream demo video, or the upstream image or page thumbnail, labeled Upstream demo or Preview. Most stills are bundled with this site; a few images load from their original host. A resource without a reviewed preview gets an original title card labeled Editorial cover. It is not a screenshot, footage, or a verified reproduction. On the homepage and on a resource’s own page, choose Play on an upstream demo to watch it here; the video file loads from its original host only then. Playback starts muted, and the player controls can unmute it. Videos never autoplay. Animated images may move when loaded. A preview is not a local render test.</p><div id="privacy"><h3>Your privacy choices</h3><p>Search runs in your browser. Saved resources and your analytics choice stay on this device. No account is required.</p><p>When optional analytics is available and you accept it, Google Analytics receives page visits and actions such as opening a resource, saving a resource or playing a preview. These events can include resource and project identifiers. Analytics uses cookies to understand visits. We do not send your free-text searches, copied content or saved-resource list to Google.</p><p>You can decline or withdraw analytics through Analytics choices in the footer. Analytics does not load before you accept, and actions taken before acceptance are not replayed. Withdrawing stops future collection; it does not erase data already sent. See <External href="https://policies.google.com/privacy">Google’s privacy policy</External>.</p><p>Preview images and videos may connect to their original providers, which receive normal web request information. Our website host may also keep access logs. These requests are separate from optional analytics. The site does not connect to a rendering service.</p></div></section></div></div></>}
 const page:PageProps={href,saved,onSave:toggleSave,measurement};
 const cards={href,saved,onSave:toggleSave};
 let content:React.ReactNode;
 if(route.type==='home')content=<>
  <section className="brand-hero" aria-labelledby="home-title">
   <div className="brand-hero-copy">
    <p className="eyebrow">A field guide to code-driven video</p>
    <h1 id="home-title"><span className="hero-code">Good code<i>.</i></span><span className="hero-video">Great video.</span></h1>
    <p className="brand-hero-description">A curated index of {resources.length} resources for making video with code: editable films, shot recipes and visual styles. Watch the result, open the source, see what you can reuse.</p>
    <div className="hero-actions">
     <a className="button primary" href="#explore">Browse the index <span aria-hidden="true">↓</span></a>
     <External className="button secondary" href={repo}>View on GitHub</External>
    </div>
   </div>
   <figure className="brand-hero-art">
    <HeroMotion/>
    <figcaption>A six-second loop, drawn in your browser one frame at a time. No video file. Drag the playhead.</figcaption>
   </figure>
  </section>
  <div className="home-content">
  <section className="collection-signal" aria-label="The collection in numbers">
   <ul className="signal-stats">
    <li><b>{resources.length}</b><span>curated resources</span></li>
    <li><b>{kindCount('film','scene')}</b><span>films &amp; scenes</span></li>
    <li><b>{kindCount('shot','preset')}</b><span>shots &amp; presets</span></li>
    <li><b>{kindCount('style')}</b><span>visual styles</span></li>
    <li><b>{projects.length}</b><span>source projects</span></li>
   </ul>
  </section>
  <HomeSpotlightAndMedia href={href} saved={saved} onSave={toggleSave} measurement={measurement}/>
  <section className="use-case-band" aria-labelledby="use-case-title">
   <div className="use-case-intro"><div><p className="eyebrow">A direction for every idea</p><h2 id="use-case-title">Start with a story.</h2></div><p>A launch, an explanation, a journey. Find the right tools for the thing you want to say.</p></div>
   <CollectionCards/>
  </section>
  <section className="editorial-note" aria-labelledby="editorial-title">
   <div className="editorial-lead"><p className="eyebrow">Curated, with context</p><h2 id="editorial-title">Borrow a technique.<br/>Build something new.</h2><a href={href('about/')}>Our selection standard <Arrow/></a></div>
   <ol className="editorial-points">
    <li><b>A source you can open</b><p>Each entry points at the thing itself, whether a project folder, a scene, a recipe or a style file, and at the people who made it.</p></li>
    <li><b>Plain reuse notes</b><p>What it looks like, what it suits, and which parts you will need to replace or rebuild yourself.</p></li>
    <li><b>An honest status</b><p>Sources and licenses are reviewed and dated. A preview is not a render test, and we say so.</p></li>
   </ol>
  </section>
  </div>
 </>;
else if(route.type==='library')content=<Library {...page}/>;
 else if(route.type==='resource')content=<ResourceDetail id={route.id} {...page}/>;
 else if(route.type==='projects')content=<Projects/>;
 else if(route.type==='project'){const p=projects.find(p=>p.id===route.id)!;content=<><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('projects/')}>Projects</a><span>/</span><span>{p.name}</span></nav><Intro label="SOURCE PROJECT" title={p.name} text="Selected reusable resources from this project, with specific artifact links and review notes."/><div className="page-actions"><External href={p.url} className="button primary">Visit original project</External><a href={href('projects/')}>All projects →</a></div><CardGrid {...cards} items={resources.filter(r=>r.project_id===p.id)}/></>}
 else if(route.type==='collections')content=<><Intro label="START WITH YOUR STORY" title="A direction for every idea." text="Curated paths through the library. Pick the kind of video you want to make, then find a useful starting point."/><CollectionCards/></>;
 else if(route.type==='collection'){const c=collections.find(c=>c.id===route.id)!;content=<><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={href('collections/')}>Use cases</a><span>/</span><span>{c.name}</span></nav><Intro label="CURATED USE CASE" title={c.name} text={c.description}/><div className="collection-banner"><span>{c.symbol}</span><p>{c.caption}</p><b>{c.ids.length} starting points</b></div><CardGrid {...cards} items={c.ids.map(id=>resources.find(r=>r.id===id)!)}/></>}
 else if(route.type==='spotlight')content=<FableSpotlightPage href={href}/>;
 else if(route.type==='about')content=<About/>;
 else if(route.type==='saved')content=<><Intro label="YOUR SHORTLIST" title="Keep the good stuff." text="Resources you saved in this browser. No account required; clearing browser storage removes this list."/>{saved.length?<CardGrid {...cards} items={resources.filter(r=>saved.includes(r.id))}/>:<div className="empty"><strong>Your next idea is out there.</strong><p>Use the star on a resource to save it here.</p><a className="button primary" href={href('library/')}>Explore the library ↗</a></div>}</>;
 else content=<><Intro label="404 / FRAME NOT FOUND" title="This shot is missing." text="The page may have moved, or the address may be incorrect."/><a className="button primary" href={href('library/')}>Back to the library ↗</a></>;
 function trackLink(event:React.MouseEvent<HTMLDivElement>){
  if(event.defaultPrevented||(event.type==='click'?event.button!==0:event.button!==1))return;
  const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
  if(!anchor)return;
  const placement=anchor.closest('header')?'header':anchor.closest('footer')?'footer':anchor.closest('.brand-hero')?'hero':anchor.closest('#sources')?'review_sources':anchor.closest('.source-panel')?'source_panel':anchor.closest('.preview-details')?'gallery_preview':anchor.closest('.fable-spotlight')?'home_spotlight':anchor.closest('.spotlight-index')?'spotlight':anchor.closest('.featured-gallery')?'home_featured':route.type==='home'?'home_gallery':route.type==='spotlight'?'spotlight':route.type==='resource'?'resource_detail':route.type==='collection'?'collection':route.type==='project'?'project':route.type==='saved'?'saved':route.type==='about'?'about':'library';
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
    <BrandMark/><span className="brand-wordmark">Awesome Code Video</span>
   </a>
   <button className="menu-toggle" aria-expanded={menu} aria-controls="site-navigation" onClick={()=>setMenu(!menu)}>Menu {menu?'−':'+'}</button>
   <nav id="site-navigation" className={menu?'open':''} aria-label="Main navigation">
    <a aria-current={route.type==='library'?'page':route.type==='resource'?'true':undefined} href={href('library/')}>Library</a>
    <a aria-current={route.type==='collections'?'page':route.type==='collection'?'true':undefined} href={href('collections/')}>Use cases</a>
    <a aria-current={route.type==='projects'?'page':route.type==='project'?'true':undefined} href={href('projects/')}>Projects</a>
    <a aria-current={route.type==='about'?'page':undefined} href={href('about/')}>About</a>
   </nav>
   <div className="header-tools">
    <a href={href('saved/')} className="saved-nav" aria-current={route.type==='saved'?'page':undefined} aria-label={`Saved resources (${saved.length})`}>☆<span>{saved.length}</span></a>
    <External href={repo} className="github-link">GitHub</External>
   </div>
  </header>
  <main id="main" className={`main ${route.type==='home'?'home-main':''}`}>{content}</main>
  <footer className="footer">
   <div className="footer-top">
    <a className="brand" href={href()}><BrandMark/><span className="brand-wordmark">Awesome Code Video</span></a>
    <p>For people who make<br/>videos with code.</p>
    <div><a href={href('about/')}>Selection standard ↗</a><External href={`${repo}/issues/new/choose`}>Suggest a resource</External><External href={`${repo}/blob/main/README.zh-CN.md`}>中文清单</External></div>
   </div>
   <div className="footer-bottom"><span>AN INDEPENDENT, OPEN COLLECTION.</span><span>Catalog: CC0 · Upstream materials retain their own terms.</span><External href={repo}>Made to be shared</External></div>
   <PrivacyChoices base={base}/>
  </footer>
  <div className="sr-only" role="status">{saveStatus}</div>
 </div>;
}
