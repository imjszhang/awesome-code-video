import {allPaths,collections,evidence,galleryLinks,kindNames,pageMeta,projects,repo,resources,routeForPath} from './model';

export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';
export type AnalyticsPlacement = 'home_gallery' | 'library' | 'collection' | 'project' | 'saved' | 'resource_detail' | 'header' | 'footer' | 'about' | 'hero' | 'source_panel' | 'review_sources' | 'gallery_preview';
type Category = 'video-gallery' | 'animated-examples' | 'other-resources';
type ResourceParameters = {resource_id:string;resource_kind?:string;project_id?:string;placement?:AnalyticsPlacement;destination_domain?:string};
export interface AnalyticsEvents {
  open_resource:ResourceParameters;
  copy_reuse_brief:ResourceParameters;
  save_resource:ResourceParameters;
  unsave_resource:ResourceParameters;
  select_resource:ResourceParameters;
  preview_start:ResourceParameters;
  preview_complete:ResourceParameters;
  outbound_click:{destination_domain:string;placement?:AnalyticsPlacement};
  suggest_resource_click:{placement?:AnalyticsPlacement;destination_domain?:string};
  gallery_category_select:{category:Category;placement?:AnalyticsPlacement};
  gallery_load_more:{category:Category;visible_count:number;placement?:AnalyticsPlacement};
  search_results_view:{result_count:number;query_length:number;has_query?:boolean;placement?:AnalyticsPlacement};
  filter_resources:{filter_name:'kind'|'project'|'use'|'sort'|'reset';filter_value?:string;result_count?:number;has_query?:boolean;placement?:AnalyticsPlacement};
}
export type AnalyticsAvailability = {available:boolean;reason:'ready'|'disabled'|'invalid_measurement_id'|'unapproved_origin'|'unavailable'};
export const ANALYTICS_CONSENT_KEY = 'acv:analytics-consent';
export const ANALYTICS_DENIED_COOKIE = 'acv_analytics_denied';
const defaultOrigin = 'https://awesomecodevideo.com';
const placements = new Set<AnalyticsPlacement>(['home_gallery','library','collection','project','saved','resource_detail','header','footer','about','hero','source_panel','review_sources','gallery_preview']);
const categories = new Set<Category>(['video-gallery','animated-examples','other-resources']);
const resourceById = new Map(resources.map(resource=>[resource.id,resource]));
const projectIds = new Set(projects.map(project=>project.id));
const collectionIds = new Set(collections.map(collection=>collection.id));
const knownPaths = new Set(allPaths().map(path=>'/'+path));
const resourceEvents = new Set(['open_resource','copy_reuse_brief','save_resource','unsave_resource','select_resource','preview_start','preview_complete']);
const knownDomains = new Set([repo,...resources.map(resource=>resource.url),...projects.map(project=>project.url),...evidence.map(source=>source.url),...Object.values(galleryLinks),...resources.flatMap(resource=>resource.preview?[resource.preview.url]:[])].flatMap(url=>{try{return [new URL(url).hostname.toLowerCase()];}catch{return [];}}));

function approvedOrigin(value:string):string|null {
  try {
    const url = new URL(value);
    if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||url.port||/^(localhost|127\.|0\.|\[::1\])/.test(url.hostname)||url.hostname.endsWith('.local'))return null;
    return url.origin;
  } catch {return null;}
}
function safePath(pathname:string):string {
  const path = pathname.endsWith('/')?pathname:pathname+'/';
  return knownPaths.has(path)?path:'/404/';
}
function safeReferrer(value:string,origin:string):string {
  if(!value)return '';
  try {
    const url = new URL(value);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return '';
    // External referral paths and every query/fragment are unnecessary for acquisition reporting.
    return url.origin===origin?origin+safePath(url.pathname):url.origin+'/';
  } catch {return '';}
}
const campaignSources = new Set(['google','bing','duckduckgo','yahoo','baidu','yandex','brave','github','x','twitter','linkedin','reddit','youtube','newsletter','email','facebook','instagram','tiktok','threads','bluesky','mastodon','producthunt','hackernews','devto','hashnode','chatgpt','perplexity','gemini','claude']);
const campaignMedia = new Set(['organic','referral','social','organic_social','email','newsletter','cpc','ppc','paid','paid_social','display','affiliate']);
const campaignFields = ['campaign_source','campaign_medium','campaign_name'] as const;

/** Only catalog routes and bounded marketing labels can leave the browser. Never send q or a 404 path. */
export function measurementContext(href:string,referrer:string,origin=defaultOrigin):Record<string,string> {
  let url:URL;
  try {url = new URL(href);}catch{url = new URL('/404/',origin);}
  const path = url.origin===origin?safePath(url.pathname):'/404/';
  const context:Record<string,string> = {
    page_location:origin+path,
    page_referrer:safeReferrer(referrer,origin),
    page_title:pageMeta(routeForPath(path)).title,
    page_type:routeForPath(path).type,
  };
  // Free text terms/content are deliberately excluded; source and medium use known labels.
  const source = url.searchParams.get('utm_source')?.toLowerCase();
  const medium = url.searchParams.get('utm_medium')?.toLowerCase();
  const campaign = url.searchParams.get('utm_campaign')?.toLowerCase();
  if(source&&campaignSources.has(source))context.campaign_source=source;
  if(medium&&campaignMedia.has(medium))context.campaign_medium=medium;
  if(campaign&&/^[a-z][a-z0-9_-]{0,63}$/.test(campaign)&&!/[0-9]{7,}/.test(campaign))context.campaign_name=campaign;
  return context;
}

type EventValue = string|number|boolean;
function eventParameters(name:keyof AnalyticsEvents,input:unknown):Record<string,EventValue>|null {
  if(!input||typeof input!=='object')return null;
  const raw = input as Record<string,unknown>;
  const output:Record<string,EventValue> = {};
  if(typeof raw.placement==='string'&&placements.has(raw.placement as AnalyticsPlacement))output.placement=raw.placement;
  if(resourceEvents.has(name)){
    const resource = typeof raw.resource_id==='string'?resourceById.get(raw.resource_id):undefined;
    if(!resource)return null;
    output.resource_id=resource.id;
    output.resource_kind=resource.kind;
    output.project_id=resource.project_id;
  } else if(name==='outbound_click'||name==='suggest_resource_click'){
    if(name==='outbound_click'&&(typeof raw.destination_domain!=='string'||!knownDomains.has(raw.destination_domain.toLowerCase())))return null;
  } else if(name==='gallery_category_select'||name==='gallery_load_more'){
    if(typeof raw.category!=='string'||!categories.has(raw.category as Category))return null;
    output.category=raw.category;
    if(name==='gallery_load_more'){
      if(typeof raw.visible_count!=='number'||!Number.isFinite(raw.visible_count)||raw.visible_count<0)return null;
      output.visible_count=Math.min(resources.length,Math.floor(raw.visible_count));
    }
  } else if(name==='search_results_view'){
    if(typeof raw.result_count!=='number'||!Number.isFinite(raw.result_count)||raw.result_count<0||typeof raw.query_length!=='number'||!Number.isFinite(raw.query_length)||raw.query_length<0)return null;
    output.result_count=Math.min(resources.length,Math.floor(raw.result_count));
    output.query_length=Math.min(200,Math.floor(raw.query_length));
    output.has_query=raw.query_length>0;
  } else if(name==='filter_resources'){
    const filter=raw.filter_name,value=raw.filter_value??'';
    if(typeof value!=='string')return null;
    const valid = filter==='kind'?(value===''||Object.hasOwn(kindNames,value)):filter==='project'?(value===''||projectIds.has(value)):filter==='use'?(value===''||collectionIds.has(value)):filter==='sort'?['curated','name'].includes(value):filter==='reset'?value==='':false;
    if(!valid||typeof filter!=='string')return null;
    output.filter_name=filter;
    output.filter_value=value;
    if(typeof raw.result_count==='number'&&Number.isFinite(raw.result_count)&&raw.result_count>=0)output.result_count=Math.min(resources.length,Math.floor(raw.result_count));
    if(typeof raw.has_query==='boolean')output.has_query=raw.has_query;
  } else {return null;}
  if(typeof raw.destination_domain==='string'&&knownDomains.has(raw.destination_domain.toLowerCase()))output.destination_domain=raw.destination_domain.toLowerCase();
  return output;
}

export interface AnalyticsEnvironment {enabled?:string;measurementId?:string;siteOrigin?:string;production?:boolean}
type PreferenceStorage = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export interface BrowserConsentStorage {
  localStorage():PreferenceStorage;
  sessionStorage():PreferenceStorage;
  readCookie():string;
  writeCookie(value:string):void;
}
/** A first-party preference cookie can preserve refusal when an old localStorage grant is unwritable. */
export function createBrowserConsentStorage(browser:BrowserConsentStorage){
  function stored(storage:()=>PreferenceStorage){try{return storage().getItem(ANALYTICS_CONSENT_KEY);}catch{return null;}}
  function cookieDenied(){try{return browser.readCookie().split(';').some(value=>value.trim()===ANALYTICS_DENIED_COOKIE+'=1');}catch{return false;}}
  function readConsent():string|null {
    // Refusal wins over any stale grant, including a per-tab fallback left after a failed write.
    if(cookieDenied())return 'denied';
    const local=stored(browser.localStorage),session=stored(browser.sessionStorage);
    if(local==='denied'||session==='denied')return 'denied';
    return local==='granted'||session==='granted'?'granted':null;
  }
  function writeConsent(choice:'granted'|'denied'):boolean {
    if(choice==='denied'){
      try{browser.localStorage().setItem(ANALYTICS_CONSENT_KEY,'denied');}catch{}
      // Removal may still succeed when quota/policy prevents replacing a stored value.
      if(stored(browser.localStorage)!=='denied')try{browser.localStorage().removeItem(ANALYTICS_CONSENT_KEY);}catch{}
      try{browser.writeCookie(`${ANALYTICS_DENIED_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);}catch{}
      if(!cookieDenied()&&stored(browser.localStorage)!=='denied'){
        try{browser.sessionStorage().setItem(ANALYTICS_CONSENT_KEY,'denied');}catch{}
      }
    }else{
      // A fresh explicit acceptance may clear refusals; a blocked removal still wins on read-back.
      try{browser.writeCookie(`${ANALYTICS_DENIED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`);}catch{}
      try{browser.sessionStorage().removeItem(ANALYTICS_CONSENT_KEY);}catch{}
      try{browser.localStorage().setItem(ANALYTICS_CONSENT_KEY,'granted');}catch{}
      if(stored(browser.localStorage)!=='granted'){
        try{browser.localStorage().removeItem(ANALYTICS_CONSENT_KEY);}catch{}
        try{browser.sessionStorage().setItem(ANALYTICS_CONSENT_KEY,'granted');}catch{}
      }
    }
    // Session storage alone cannot preserve a refusal in a new tab or after browser restart.
    // A removed stale grant is safe, but still does not remember the user's choice.
    const durable=choice==='denied'?(cookieDenied()||stored(browser.localStorage)==='denied'):stored(browser.localStorage)==='granted';
    return durable&&readConsent()===choice;
  }
  return {readConsent,writeConsent};
}
/** The small runtime boundary makes consent and emitted payloads testable without a live Google request. */
export interface AnalyticsRuntime {
  href():string;
  referrer():string;
  readConsent():string|null;
  writeConsent(consent:'granted'|'denied'):boolean|void;
  command(...args:unknown[]):void;
  loadTag(measurementId:string):void;
  removeTag():void;
  clearPending?():void;
  setDisabled(measurementId:string,disabled:boolean):void;
  reload():void;
  listenForConsent(listener:()=>void):()=>void;
}

export function createAnalytics(environment:AnalyticsEnvironment,runtime:AnalyticsRuntime|null){
  const origin=approvedOrigin(environment.siteOrigin||defaultOrigin);
  const id=environment.measurementId||'';
  let initialized=false,tagStarted=false,stopped=false,pageViewSent=false,consent:AnalyticsConsent='unknown';
  const listeners=new Set<()=>void>();
  const landingCampaign:Record<string,string>={};
  function availability():AnalyticsAvailability{
    if(!runtime)return {available:false,reason:'unavailable'};
    if(environment.enabled!=='true'||environment.production!==true)return {available:false,reason:'disabled'};
    if(!/^G-[A-Z0-9]{6,20}$/.test(id))return {available:false,reason:'invalid_measurement_id'};
    try {if(!origin||new URL(runtime.href()).origin!==origin)return {available:false,reason:'unapproved_origin'};}
    catch{return {available:false,reason:'unapproved_origin'};}
    return {available:true,reason:'ready'};
  }
  function readConsent():AnalyticsConsent{
    try {const value=runtime?.readConsent();return value==='granted'||value==='denied'?value:'unknown';}
    catch{return 'unknown';}
  }
  function notify(){for(const listener of listeners){try{listener();}catch{/* An observer must not break privacy choices. */}}}
  function context(){
    const page=measurementContext(runtime!.href(),runtime!.referrer(),origin!);
    // Search may replace the query before consent. Keep only the vetted landing campaign
    // in document memory; page location and referrer still describe the current page.
    for(const key of campaignFields)delete page[key];
    return {...page,...landingCampaign};
  }
  function start(){
    if(!runtime||consent!=='granted'||!availability().available||tagStarted||stopped)return;
    try{
      const page=context();
      runtime.setDisabled(id,false);
      runtime.command('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      runtime.command('js',new Date());
      runtime.command('set',{...page,allow_google_signals:false,allow_ad_personalization_signals:false});
      runtime.command('config',id,{...page,send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
      tagStarted=true;
      if(!pageViewSent){
        runtime.command('event','page_view',{...page,send_to:id});
        pageViewSent=true;
        if(page.page_type==='notfound')runtime.command('event','not_found',{...page,send_to:id});
      }
      runtime.loadTag(id);
    }catch{
      stopped=true;
      try{runtime.setDisabled(id,true);}catch{}
      try{runtime.clearPending?.();}catch{}
      try{runtime.removeTag();}catch{}
    }
  }
  function stop(allowReload=true){
    if(!runtime||!tagStarted||stopped)return;
    stopped=true;
    // Basic consent mode: send no consent-update ping after denial. Already in-flight requests
    // cannot be recalled; disable this destination and remove timers through a safe reload.
    try{runtime.setDisabled(id,true);}catch{}
    try{runtime.clearPending?.();}catch{}
    try{runtime.removeTag();}catch{}
    // A failed write can leave an old grant in storage. Reloading then would start collection again.
    if(allowReload&&readConsent()==='denied')try{runtime.reload();}catch{}
  }
  function initialize(activate=true){
    if(initialized)return;
    initialized=true;
    if(runtime&&origin&&availability().available)try{
      const landing=measurementContext(runtime.href(),'',origin);
      for(const key of campaignFields)if(landing[key])landingCampaign[key]=landing[key];
    }catch{/* Unavailable context must not interfere with consent or the website. */}
    consent=readConsent();
    try{runtime?.listenForConsent(()=>{
        const next=readConsent();
        if(next===consent)return;
        consent=next;
        if(consent==='granted')start();else stop();
        notify();
      });}catch{}
    if(activate)start();
  }
  return {
    initializeAnalytics:()=>initialize(),
    getAnalyticsAvailability:availability,
    getAnalyticsConsent:():AnalyticsConsent=>initialized?consent:readConsent(),
    subscribeAnalytics(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
    setAnalyticsConsent(next:'granted'|'denied'):boolean{
      if(next!=='granted'&&next!=='denied')return false;
      initialize(false);
      consent=next;
      let writeResult:boolean|void;
      try{writeResult=runtime?.writeConsent(next);}catch{writeResult=false;}
      const persistedConsent=readConsent();
      const persisted=writeResult!==false&&persistedConsent===next;
      // Never reactivate a tag while a refusal fallback could not be cleared.
      if(next==='granted'&&(persistedConsent==='denied'||(stopped&&!persisted)))consent='denied';
      if(consent==='granted'){
        // A previously loaded tag is restarted only in a fresh document with persisted consent.
        if(stopped&&persisted){try{runtime?.reload();}catch{}}
        else start();
      }else stop(persisted);
      notify();
      return persisted;
    },
    trackEvent<Name extends keyof AnalyticsEvents>(name:Name,params:AnalyticsEvents[Name]):boolean{
      if(!runtime||consent!=='granted'||!tagStarted||stopped||!availability().available)return false;
      // Cookie fallback changes have no storage event; check again before every custom send.
      if(readConsent()==='denied'){consent='denied';stop();notify();return false;}
      const safe=eventParameters(name,params);
      if(!safe)return false;
      try{runtime.command('event',name,{...safe,...context(),send_to:id});return true;}
      catch{return false;}
    },
  };
}

type AnalyticsWindow = Window & typeof globalThis & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;[key:`ga-disable-${string}`]:boolean|undefined};
function browserRuntime():AnalyticsRuntime|null {
  if(typeof window==='undefined'||typeof document==='undefined')return null;
  const browser=window as AnalyticsWindow;
  const preferences=createBrowserConsentStorage({localStorage:()=>browser.localStorage,sessionStorage:()=>browser.sessionStorage,readCookie:()=>document.cookie,writeCookie:value=>{document.cookie=value;}});
  let consentChannel:BroadcastChannel|undefined;
  const command=(...args:unknown[])=>{
    browser.dataLayer??=[];
    browser.gtag??=function(){browser.dataLayer!.push(arguments);};
    browser.gtag(...args);
  };
  return {
    href:()=>browser.location.href,
    referrer:()=>document.referrer,
    readConsent:preferences.readConsent,
    writeConsent:choice=>{const persisted=preferences.writeConsent(choice);try{consentChannel?.postMessage('changed');}catch{}return persisted;},
    command,
    loadTag:id=>{
      if(document.getElementById('acv-google-analytics'))return;
      const script=document.createElement('script');
      script.id='acv-google-analytics';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
      document.head.appendChild(script);
    },
    removeTag:()=>document.getElementById('acv-google-analytics')?.remove(),
    clearPending:()=>{browser.dataLayer?.splice(0);browser.gtag=()=>{};},
    setDisabled:(id,disabled)=>{browser[`ga-disable-${id}`]=disabled;},
    reload:()=>browser.location.reload(),
    listenForConsent:listener=>{
      const handle=(event:StorageEvent)=>{if(event.key===ANALYTICS_CONSENT_KEY||event.key===null)listener();};
      const visible=()=>{if(document.visibilityState==='visible')listener();};
      browser.addEventListener('storage',handle);
      browser.addEventListener('focus',listener);
      browser.addEventListener('pageshow',listener);
      document.addEventListener('visibilitychange',visible);
      try{consentChannel=new BroadcastChannel(ANALYTICS_CONSENT_KEY);consentChannel.addEventListener('message',listener);}catch{}
      return ()=>{browser.removeEventListener('storage',handle);browser.removeEventListener('focus',listener);browser.removeEventListener('pageshow',listener);document.removeEventListener('visibilitychange',visible);consentChannel?.close();};
    },
  };
}
const environment=import.meta.env;
const analytics=createAnalytics({enabled:environment?.VITE_ANALYTICS_ENABLED,measurementId:environment?.VITE_GA_MEASUREMENT_ID,siteOrigin:environment?.VITE_ANALYTICS_SITE_ORIGIN,production:environment?.PROD},browserRuntime());
export const initializeAnalytics=analytics.initializeAnalytics;
export const getAnalyticsConsent=analytics.getAnalyticsConsent;
export const getAnalyticsAvailability=analytics.getAnalyticsAvailability;
export const setAnalyticsConsent=analytics.setAnalyticsConsent;
export const subscribeAnalytics=analytics.subscribeAnalytics;
export const trackEvent=analytics.trackEvent;
