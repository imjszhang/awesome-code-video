import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {App,GalleryCard,type SiteMeasurement} from '../web/src/App';
import {createAnalytics,type AnalyticsRuntime} from '../web/src/analytics';
import {fableSpotlightItems} from '../web/src/fableSpotlight';
import {filterResources,resources} from '../web/src/model';

async function mount(path:string,render:(measurement:SiteMeasurement)=>React.ReactNode){
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://awesomecodevideo.com'+path});
 const values={window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history,localStorage:dom.window.localStorage,navigator:dom.window.navigator,Element:dom.window.Element,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,IS_REACT_ACT_ENVIRONMENT:true};
 const previous=new Map(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 const commands:unknown[][]=[];
 let consent='granted';
 const runtime:AnalyticsRuntime={href:()=>dom.window.location.href,referrer:()=>'',readConsent:()=>consent,writeConsent:value=>{consent=value;},command:(...args)=>{commands.push(args);},loadTag:()=>{},removeTag:()=>{},setDisabled:()=>{},reload:()=>{},listenForConsent:()=>()=>{}};
 const measurement=createAnalytics({enabled:'true',measurementId:'G-TEST123456',production:true},runtime);
 measurement.initializeAnalytics();
 const {createRoot}=await import('react-dom/client');
 const root=createRoot(dom.window.document.getElementById('root')!);
 // Cancel browser navigation after React's bubbling handler has observed the genuine activation.
 dom.window.document.addEventListener('click',event=>event.preventDefault());
 dom.window.document.addEventListener('auxclick',event=>event.preventDefault());
 await act(async()=>{root.render(render(measurement));});
 return {dom,measurement,events:(name:string)=>commands.filter(command=>command[0]==='event'&&command[1]===name),async close(){await act(async()=>root.unmount());dom.window.close();for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}};
}

test('real link activations count primary intent once and ignore right clicks',async()=>{
 const resource=resources[0];
 const path=`/resources/${resource.id}/`;
 const h=await mount(path,measurement=>React.createElement(App,{path,measurement}));
 try{
  const link=h.dom.window.document.querySelector('[data-primary-resource]')!;
  await act(async()=>{
   link.dispatchEvent(new h.dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0,ctrlKey:true}));
   link.dispatchEvent(new h.dom.window.MouseEvent('auxclick',{bubbles:true,cancelable:true,button:1}));
   link.dispatchEvent(new h.dom.window.MouseEvent('auxclick',{bubbles:true,cancelable:true,button:2}));
   link.dispatchEvent(new h.dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0,detail:0}));
  });
  assert.equal(h.events('open_resource').length,3);
  assert.equal(h.events('outbound_click').length,0);
  await act(async()=>{h.dom.window.document.querySelector('.github-link')!.dispatchEvent(new h.dom.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));});
  assert.equal(h.events('outbound_click').length,1);
  assert.equal(h.events('page_view').length,1);
 }finally{await h.close();}
});

test('copy only records success after the clipboard promise succeeds',async()=>{
 const path=`/resources/${resources[0].id}/`;
 const h=await mount(path,measurement=>React.createElement(App,{path,measurement}));
 try{
  let fail=true;
  Object.defineProperty(h.dom.window.navigator,'clipboard',{value:{writeText:async()=>{if(fail)throw new Error('Permission denied');}},configurable:true});
  const button=[...h.dom.window.document.querySelectorAll('button')].find(button=>button.textContent?.includes('Copy reuse brief'))!;
  await act(async()=>{button.click();});
  assert.equal(h.events('copy_reuse_brief').length,0);
  assert.match(h.dom.window.document.querySelector('.small-status')!.textContent!,/Clipboard unavailable/);
  fail=false;
  await act(async()=>{button.click();});
  assert.equal(h.events('copy_reuse_brief').length,1);
  assert.match(h.dom.window.document.querySelector('.small-status')!.textContent!,/notes copied/);
 }finally{await h.close();}
});

test('search hydrates silently, commits once, and cancels pending work on withdrawal',async()=>{
 const h=await mount('/library/?q=paper',measurement=>React.createElement(App,{path:"/library/",measurement}));
 try{
  const input=h.dom.window.document.querySelector('input[type=search]')! as HTMLInputElement;
  assert.equal(input.value,'paper');
  assert.equal(h.events('search_results_view').length,0);
  const type=async(value:string)=>{await act(async()=>{Object.getOwnPropertyDescriptor(h.dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));});};
  await type('maps');
  assert.equal(h.dom.window.document.querySelector('.results-toolbar b')!.textContent,String(filterResources({q:'maps'}).length));
  await act(async()=>{h.dom.window.document.querySelector('form[role=search]')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true}));});
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,650));});
  assert.equal(h.events('search_results_view').length,1,'Enter cancels the pending debounce');
  await type('paper@example.com');
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,650));});
  assert.equal(h.events('search_results_view').length,2);
  assert.doesNotMatch(JSON.stringify(h.events('search_results_view')),/paper@example|\?q=/);
  await type('unfinished');
  await act(async()=>{h.measurement.setAnalyticsConsent('denied');});
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,650));h.measurement.setAnalyticsConsent('granted');});
  assert.equal(h.events('search_results_view').length,2,'No pre-withdrawal search is replayed');
  assert.equal(h.events('page_view').length,1,'Search/history changes do not create page views');
 }finally{await h.close();}
});

test('library tag query keeps untagged resources out only after a real stack or genre choice',async()=>{
 const h=await mount('/library/?stack=fable-5-2,html,threejs&genre=explainer&source=remotion&method=game',measurement=>React.createElement(App,{path:'/library/',measurement}));
 try{
  const doc=h.dom.window.document;
  const count=()=>doc.querySelector('.results-toolbar b')!.textContent;
  const expected=filterResources({stack:'threejs,html',genre:'explainer'});
  assert.equal(count(),String(expected.length));
  assert.equal(h.dom.window.location.search.includes('fable-5-2'),false);
  assert.equal(h.dom.window.location.search.includes('source='),false);
  assert.equal(h.dom.window.location.search.includes('method='),false);
  const box=(name:string,value:string)=>doc.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
  assert.equal(box('stack','html').checked,true);
  assert.equal(box('stack','threejs').checked,true);
  assert.equal(box('stack','remotion').checked,false);
  assert.equal(box('genre','explainer').checked,true);
  assert.equal(doc.querySelector('input[value="fable-5-2"]'),null);
  assert.equal(doc.querySelector('input[value="source"]'),null);
  assert.equal(doc.querySelector('input[value="method"]'),null);
  assert.equal(doc.querySelector('input[value="blender"]'),null);
  assert.equal((doc.querySelector('input[aria-describedby="package-filter-note"]') as HTMLInputElement).disabled,true);
  assert.deepEqual([...doc.querySelectorAll('[data-resource-id]')].map(node=>node.getAttribute('data-resource-id')),expected.map(resource=>resource.id));
  await act(async()=>{box('genre','explainer').click();});
  assert.equal(count(),String(filterResources({stack:'threejs,html'}).length));
  assert.equal(h.dom.window.location.search.includes('genre='),false);
  const genreEvents=h.events('filter_resources').map(event=>event[2] as {filter_name?:string,filter_value?:string});
  assert.equal(genreEvents.some(event=>event.filter_name==='genre'&&event.filter_value===''),true);
  assert.equal(genreEvents.some(event=>String(event.filter_value).includes('fable-5-2')),false);
 }finally{await h.close();}
 const spotlight=await mount('/spotlight/fable-5-2/',measurement=>React.createElement(App,{path:'/spotlight/fable-5-2/',measurement}));
 try{
  assert.equal(spotlight.dom.window.document.querySelector('.filter-tags'),null);
  assert.equal(spotlight.dom.window.document.querySelector('input[name="stack"]'),null);
  assert.equal(spotlight.dom.window.document.querySelectorAll('.spotlight-card').length,fableSpotlightItems().length);
 }finally{await spotlight.close();}
});

test('native video counts actual playing and completion, not play attempts or resumes',async()=>{
 const resource=resources.find(resource=>resource.preview?.kind==='video')!;
 const h=await mount('/',measurement=>React.createElement(GalleryCard,{resource,href:(path='')=>'/'+path,saved:false,onSave:()=>{},activeId:`home_gallery:${resource.id}`,playing:true,onToggle:()=>{},onPlayback:()=>{},onVideo:()=>{},measurement}));
 try{
  const video=h.dom.window.document.querySelector('video')!;
  const dispatch=async(name:string)=>{await act(async()=>{video.dispatchEvent(new h.dom.window.Event(name,{bubbles:true}));});};
  await dispatch('play');
  assert.equal(h.events('preview_start').length,0);
  await dispatch('playing');
  await dispatch('pause');
  await dispatch('playing');
  assert.equal(h.events('preview_start').length,1);
  await dispatch('ended');
  assert.equal(h.events('preview_complete').length,1);
  await dispatch('playing');
  assert.equal(h.events('preview_start').length,2,'A genuine replay starts a new viewing');
 }finally{await h.close();}
});
