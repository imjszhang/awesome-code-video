import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {App,GalleryCard,type SiteMeasurement} from '../web/src/App';
import {createAnalytics,type AnalyticsRuntime} from '../web/src/analytics';
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

test('native video counts actual playing and completion, not play attempts or resumes',async()=>{
 const resource=resources.find(resource=>resource.preview?.kind==='video')!;
 const h=await mount('/',measurement=>React.createElement(GalleryCard,{resource,href:(path='')=>'/'+path,saved:false,onSave:()=>{},activeId:resource.id,playing:true,onToggle:()=>{},onPlayback:()=>{},onVideo:()=>{},measurement}));
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
