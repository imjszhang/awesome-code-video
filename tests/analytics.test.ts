import test from 'node:test';
import assert from 'node:assert/strict';
import {ANALYTICS_CONSENT_KEY,ANALYTICS_DENIED_COOKIE,createAnalytics,createBrowserConsentStorage,measurementContext,type AnalyticsEnvironment,type AnalyticsEvents,type AnalyticsRuntime} from '../web/src/analytics';
import {resources} from '../web/src/model';

const production:AnalyticsEnvironment={enabled:'true',measurementId:'G-TEST123456',production:true};
function fixture(environment:AnalyticsEnvironment=production,stored:string|null=null){
  const state={stored,href:'https://awesomecodevideo.com/library/',referrer:'https://www.google.com/search?q=private',commands:[] as unknown[][],scripts:[] as string[],disabled:[] as boolean[],reloads:0,removals:0,cleared:0,writeFails:false,readFails:false,commandFails:false,loadFails:false,storageListener:()=>{}};
  const runtime:AnalyticsRuntime={
    href:()=>state.href,referrer:()=>state.referrer,
    readConsent:()=>{if(state.readFails)throw Error('Storage unavailable');return state.stored;},
    writeConsent:consent=>{if(state.writeFails)throw Error('Storage unavailable');state.stored=consent;},
    command:(...args)=>{if(state.commandFails)throw Error('Blocked');state.commands.push(args);},
    loadTag:id=>{if(state.loadFails)throw Error('Blocked');state.scripts.push(id);},
    removeTag:()=>{state.removals++;},setDisabled:(_id,value)=>state.disabled.push(value),
    clearPending:()=>{state.cleared++;},
    reload:()=>{state.reloads++;},
    listenForConsent:listener=>{state.storageListener=listener;return ()=>{};},
  };
  const analytics=createAnalytics(environment,runtime);
  const events=(name?:string)=>state.commands.filter(command=>command[0]==='event'&&(!name||command[1]===name));
  return {state,runtime,analytics,events};
}

function browserPreferences(initial='granted'){
  const state={local:new Map([[ANALYTICS_CONSENT_KEY,initial]]),session:new Map<string,string>(),cookies:new Map<string,string>(),localWriteFails:false,localRemoveFails:false,sessionFails:false,cookieWriteFails:false};
  const stores={
    localStorage:()=>({getItem:(key:string)=>state.local.get(key)??null,setItem:(key:string,value:string)=>{if(state.localWriteFails)throw Error('Read-only localStorage');state.local.set(key,value);},removeItem:(key:string)=>{if(state.localRemoveFails)throw Error('Read-only localStorage');state.local.delete(key);}}),
    sessionStorage:()=>({getItem:(key:string)=>state.session.get(key)??null,setItem:(key:string,value:string)=>{if(state.sessionFails)throw Error('Blocked sessionStorage');state.session.set(key,value);},removeItem:(key:string)=>{if(state.sessionFails)throw Error('Blocked sessionStorage');state.session.delete(key);}}),
    readCookie:()=>[...state.cookies].map(([key,value])=>`${key}=${value}`).join('; '),
    writeCookie:(value:string)=>{
      if(state.cookieWriteFails)return; // Browsers may silently ignore a blocked cookie write.
      const [pair]=value.split(';'),[key,item]=pair.split('=');
      if(value.includes('Max-Age=0'))state.cookies.delete(key);else state.cookies.set(key,item);
    },
  };
  function controller(){
    const control=fixture();
    // Each navigation has a new adapter/controller but the same actual browser stores.
    const preferences=createBrowserConsentStorage(stores);
    control.runtime.readConsent=preferences.readConsent;
    control.runtime.writeConsent=preferences.writeConsent;
    return control;
  }
  return {state,controller};
}

test('no command, script, or deferred interaction before affirmative consent',()=>{
  const {analytics,state,events}=fixture();
  analytics.initializeAnalytics();
  assert.equal(analytics.getAnalyticsConsent(),'unknown');
  assert.equal(analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
  analytics.setAnalyticsConsent('denied');
  assert.deepEqual(state.commands,[]);
  assert.deepEqual(state.scripts,[]);
  analytics.setAnalyticsConsent('granted');
  assert.equal(state.scripts.length,1);
  assert.equal(events('page_view').length,1);
  assert.equal(events('open_resource').length,0,'Pre-consent interaction is discarded rather than replayed');
  analytics.initializeAnalytics();
  analytics.setAnalyticsConsent('granted');
  state.href='https://awesomecodevideo.com/library/?q=private#other-resources';
  assert.equal(analytics.trackEvent('search_results_view',{query_length:7,result_count:0}),true);
  assert.equal(events('page_view').length,1,'Query/hash changes and repeated initialization do not create views');
  const config=state.commands.find(command=>command[0]==='config')![2] as Record<string,unknown>;
  assert.equal(config.send_page_view,false);
  assert.equal(config.allow_google_signals,false);
});

test('disabled, preview, invalid IDs, and unapproved origins fail closed',()=>{
  for(const environment of [{...production,enabled:'false'},{...production,production:false},{...production,measurementId:undefined},{...production,measurementId:'G-bad'},{...production,siteOrigin:'https://example.com/path'}]){
    const {analytics,state}=fixture(environment,'granted');
    analytics.initializeAnalytics();
    assert.equal(analytics.getAnalyticsAvailability().available,false);
    assert.deepEqual(state.commands,[]);
    assert.deepEqual(state.scripts,[]);
  }
  for(const origin of ['http://awesomecodevideo.com','https://preview.example.com','http://localhost:5173','https://awesomecodevideo.com.evil.example']){
    const {analytics,state}=fixture(production,'granted');state.href=origin+'/';analytics.initializeAnalytics();
    assert.equal(analytics.getAnalyticsAvailability().reason,'unapproved_origin');
    assert.deepEqual(state.commands,[]);
  }
  assert.equal(createAnalytics(production,null).getAnalyticsAvailability().reason,'unavailable');
});

test('page context strips queries, fragments, credentials, and unknown path text',()=>{
  const context=measurementContext('https://awesomecodevideo.com/library/?q=alice%40example.com&token=secret#private','https://www.google.com/search?q=alice%40example.com');
  assert.equal(context.page_location,'https://awesomecodevideo.com/library/');
  assert.equal(context.page_referrer,'https://www.google.com/');
  assert.equal(context.page_type,'library');
  assert(!JSON.stringify(context).includes('alice'));
  const missing=measurementContext('https://awesomecodevideo.com/users/alice@example.com?secret=yes','https://awesomecodevideo.com/unknown/private?email=secret');
  assert.equal(missing.page_location,'https://awesomecodevideo.com/404/');
  assert.equal(missing.page_referrer,'https://awesomecodevideo.com/404/');
  assert.equal(missing.page_type,'notfound');
  assert(!JSON.stringify(missing).includes('alice'));
  assert.equal(measurementContext('https://awesomecodevideo.com/','https://person:password@example.com/private').page_referrer,'');
});

test('only bounded campaign attributes survive and search terms never do',()=>{
  const valid=measurementContext('https://awesomecodevideo.com/?utm_source=github&utm_medium=referral&utm_campaign=launch-2026&utm_term=private&utm_content=email@example.com','');
  assert.equal(valid.campaign_source,'github');assert.equal(valid.campaign_medium,'referral');assert.equal(valid.campaign_name,'launch-2026');
  assert.equal(valid.page_location,'https://awesomecodevideo.com/');
  assert.equal(valid.campaign_term,undefined);assert.equal(valid.campaign_content,undefined);
  const invalid=measurementContext('https://awesomecodevideo.com/?utm_source=alice@example.com&utm_medium=unknown&utm_campaign=1234567890','');
  assert.equal(invalid.campaign_source,undefined);assert.equal(invalid.campaign_medium,undefined);assert.equal(invalid.campaign_name,undefined);
});

test('every custom event uses sanitized context and runtime catalog allowlists',()=>{
  const {analytics,state,events}=fixture(production,'granted');
  state.href='https://awesomecodevideo.com/library/?q=private@example.com';
  analytics.initializeAnalytics();
  const resource=resources[0];
  assert.equal(analytics.trackEvent('open_resource',{resource_id:resource.id,resource_kind:'private@example.com',project_id:'private@example.com',placement:'resource_detail',page_location:state.href,search_term:'private@example.com'} as AnalyticsEvents['open_resource']),true);
  const payload=events('open_resource')[0][2] as Record<string,unknown>;
  assert.equal(payload.resource_kind,resource.kind);assert.equal(payload.project_id,resource.project_id);
  assert.equal(payload.page_location,'https://awesomecodevideo.com/library/');
  assert.equal(payload.search_term,undefined);
  assert.equal(analytics.trackEvent('open_resource',{resource_id:'private@example.com'}),false);
  assert.equal(analytics.trackEvent('outbound_click',{destination_domain:'private.example.com'}),false);
  assert.equal(analytics.trackEvent('filter_resources',{filter_name:'project',filter_value:'private@example.com'}),false);
  assert.equal(analytics.trackEvent('filter_resources',{filter_name:'sort',filter_value:'name',result_count:3}),true);
  assert(!JSON.stringify(state.commands).includes('private@example.com'));
});

test('persisted grants start once, withdrawal disables the tag without a new Google command',()=>{
  const {analytics,state,events}=fixture(production,'granted');
  let notifications=0;const unsubscribe=analytics.subscribeAnalytics(()=>notifications++);
  analytics.initializeAnalytics();
  assert.equal(events('page_view').length,1);
  const before=state.commands.length;
  analytics.setAnalyticsConsent('denied');
  assert.equal(state.stored,'denied');assert.deepEqual(state.disabled,[false,true]);
  assert.equal(state.reloads,1);assert.equal(state.removals,1);
  assert.equal(state.cleared,1);assert.equal(state.commands.length,before);
  assert.equal(analytics.getAnalyticsConsent(),'denied');
  assert.equal(analytics.trackEvent('save_resource',{resource_id:resources[0].id}),false);
  assert.equal(events('save_resource').length,0);assert.equal(notifications,1);
  unsubscribe();analytics.setAnalyticsConsent('denied');assert.equal(notifications,1);
  const fresh=fixture(production,state.stored);fresh.analytics.initializeAnalytics();assert.deepEqual(fresh.state.commands,[]);
});

test('an explicit denial before initialization never briefly activates an old stored grant',()=>{
  const {analytics,state}=fixture(production,'granted');
  analytics.setAnalyticsConsent('denied');
  assert.deepEqual(state.commands,[]);assert.deepEqual(state.scripts,[]);
  assert.equal(state.stored,'denied');
});

test('failed withdrawal storage never reloads into an old grant',()=>{
  const {analytics,state,events}=fixture(production,'granted');analytics.initializeAnalytics();state.writeFails=true;
  assert.equal(analytics.setAnalyticsConsent('denied'),false);
  assert.equal(state.stored,'granted');assert.equal(state.reloads,0);assert.equal(analytics.getAnalyticsConsent(),'denied');
  assert.deepEqual(state.disabled,[false,true]);
  assert.equal(analytics.trackEvent('copy_reuse_brief',{resource_id:resources[0].id}),false);
  assert.equal(events('copy_reuse_brief').length,0);
});

test('a denied cookie overrides an unwritable stale grant after a new document loads',()=>{
  const browser=browserPreferences();
  browser.state.localWriteFails=true;browser.state.localRemoveFails=true;browser.state.sessionFails=true;
  const first=browser.controller();first.analytics.initializeAnalytics();
  assert.equal(first.events('page_view').length,1);
  assert.equal(first.analytics.setAnalyticsConsent('denied'),true);
  assert.equal(browser.state.local.get(ANALYTICS_CONSENT_KEY),'granted','Regression fixture retains the stale original grant');
  assert.equal(browser.state.cookies.get(ANALYTICS_DENIED_COOKIE),'1');
  const next=browser.controller();next.analytics.initializeAnalytics();
  assert.equal(next.analytics.getAnalyticsConsent(),'denied');
  assert.deepEqual(next.state.commands,[]);assert.deepEqual(next.state.scripts,[]);
  assert.equal(next.analytics.setAnalyticsConsent('granted'),true,'Fresh explicit acceptance clears the refusal cookie');
  assert.equal(browser.state.cookies.has(ANALYTICS_DENIED_COOKIE),false);
  assert.equal(next.events('page_view').length,1);
});

test('session refusal and stale-grant removal each protect navigation when cookies are blocked',()=>{
  const session=browserPreferences();session.state.localWriteFails=true;session.state.localRemoveFails=true;session.state.cookieWriteFails=true;
  const first=session.controller();first.analytics.initializeAnalytics();
  assert.equal(first.analytics.setAnalyticsConsent('denied'),false,'A session-only refusal is not reported as durable');
  assert.equal(first.state.reloads,0,'Keep the persistence warning visible');
  const next=session.controller();next.analytics.initializeAnalytics();
  assert.equal(next.analytics.getAnalyticsConsent(),'denied');assert.deepEqual(next.state.scripts,[]);

  const removal=browserPreferences();removal.state.localWriteFails=true;removal.state.cookieWriteFails=true;removal.state.sessionFails=true;
  const old=removal.controller();old.analytics.initializeAnalytics();
  assert.equal(old.analytics.setAnalyticsConsent('denied'),false,'The refusal itself was not saved, although deleting the stale grant prevents auto-start');
  assert.equal(removal.state.local.has(ANALYTICS_CONSENT_KEY),false);
  const fresh=removal.controller();fresh.analytics.initializeAnalytics();
  assert.equal(fresh.analytics.getAnalyticsConsent(),'unknown');assert.deepEqual(fresh.state.scripts,[]);
});

test('total browser persistence failure is reported and never triggers an unsafe automatic reload',()=>{
  const browser=browserPreferences();browser.state.localWriteFails=true;browser.state.localRemoveFails=true;browser.state.sessionFails=true;browser.state.cookieWriteFails=true;
  const page=browser.controller();page.analytics.initializeAnalytics();
  assert.equal(page.analytics.setAnalyticsConsent('denied'),false);
  assert.equal(page.analytics.getAnalyticsConsent(),'denied');assert.equal(page.state.reloads,0);
  assert.equal(page.analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
});

test('a refusal cookie that cannot be cleared prevents reactivation after acceptance fails to persist',()=>{
  const browser=browserPreferences('denied');browser.state.cookies.set(ANALYTICS_DENIED_COOKIE,'1');browser.state.cookieWriteFails=true;
  const page=browser.controller();page.analytics.initializeAnalytics();
  assert.equal(page.analytics.setAnalyticsConsent('granted'),false);
  assert.equal(page.analytics.getAnalyticsConsent(),'denied');assert.deepEqual(page.state.scripts,[]);
});

test('an already-open page rechecks a cookie-only refusal before sending another custom event',()=>{
  const browser=browserPreferences();browser.state.localWriteFails=true;browser.state.localRemoveFails=true;browser.state.sessionFails=true;
  const first=browser.controller(),other=browser.controller();first.analytics.initializeAnalytics();other.analytics.initializeAnalytics();
  const before=first.state.commands.length;
  other.analytics.setAnalyticsConsent('denied');
  assert.equal(first.analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
  assert.equal(first.analytics.getAnalyticsConsent(),'denied');assert.equal(first.state.commands.length,before);
  assert.deepEqual(first.state.disabled,[false,true]);
});

test('another tab withdrawing consent immediately stops this document',()=>{
  const {analytics,state}=fixture(production,'granted');analytics.initializeAnalytics();
  state.stored='denied';state.storageListener();
  assert.equal(analytics.getAnalyticsConsent(),'denied');assert.equal(state.reloads,1);
  assert.equal(analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
});

test('missing pages emit one sanitized diagnostic and never the requested private path',()=>{
  const {analytics,state,events}=fixture(production,'granted');state.href='https://awesomecodevideo.com/private/alice@example.com?token=secret';
  analytics.initializeAnalytics();analytics.initializeAnalytics();
  assert.equal(events('not_found').length,1);assert.equal(events('page_view').length,1);
  assert.equal((events('not_found')[0][2] as Record<string,unknown>).page_location,'https://awesomecodevideo.com/404/');
  assert(!JSON.stringify(state.commands).includes('alice'));
});

test('blocked storage, tag loading, or transport never breaks the website',()=>{
  const blockedStorage=fixture(production,'granted');blockedStorage.state.readFails=true;
  assert.doesNotThrow(()=>blockedStorage.analytics.initializeAnalytics());assert.deepEqual(blockedStorage.state.commands,[]);
  const blockedTag=fixture(production,'granted');blockedTag.state.loadFails=true;
  assert.doesNotThrow(()=>blockedTag.analytics.initializeAnalytics());
  assert.equal(blockedTag.analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
  const blockedTransport=fixture(production,'granted');blockedTransport.state.commandFails=true;
  assert.doesNotThrow(()=>blockedTransport.analytics.initializeAnalytics());
  assert.doesNotThrow(()=>blockedTransport.analytics.setAnalyticsConsent('denied'));
  assert.equal(blockedTransport.analytics.trackEvent('open_resource',{resource_id:resources[0].id}),false);
});
