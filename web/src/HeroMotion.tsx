import React,{useEffect,useRef,useState} from 'react';
import {createHeroRenderer,drawCopyHalo,type HeroSceneViewport} from './heroScene';
import {createHeroTypography} from './heroTypography';
import {REDUCED_FRAME_SECONDS,type SafeRect} from './heroModel';

const STEADY_FRAME_SECONDS=REDUCED_FRAME_SECONDS;

/** Measure the visible HTML copy as individual text boxes, in canvas CSS pixels. */
function measureCopy(container:HTMLElement):SafeRect[]{
 const hero=container.closest('.brand-hero');
 if(!hero)return [];
 const origin=container.getBoundingClientRect(),out:SafeRect[]=[];
 const push=(r:DOMRect|DOMRectReadOnly,kind:SafeRect['kind'])=>{
  const x=r.left-origin.left,y=r.top-origin.top;
  if([x,y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0)out.push({x,y,w:r.width,h:r.height,kind});
 };
 const lines=(el:Element,kind:SafeRect['kind'])=>{
  const range=document.createRange();range.selectNodeContents(el);
  for(const r of Array.from(range.getClientRects()))push(r,kind);
  range.detach?.();
 };
 const eyebrow=hero.querySelector('.eyebrow');
 if(eyebrow)lines(eyebrow,'text');
 const h1=hero.querySelector('h1');
 if(h1){const spans=h1.querySelectorAll('span');if(spans.length)spans.forEach(s=>lines(s,'headline'));else lines(h1,'headline');}
 hero.querySelectorAll('.brand-hero-description').forEach(p=>lines(p,'text'));
 hero.querySelectorAll('.hero-actions a, .hero-actions button').forEach(b=>push(b.getBoundingClientRect(),'action'));
 return out;
}

/** Simplified PLAY triangle and widescreen frame for the static fallback. */
const POSTER_TRIANGLE='M200.6 62L699.4 350L200.6 638Z';
/** The centred 16:9 output screen (heroModel.screenRect at rest). */
const POSTER_SCREEN={x:72,y:137.5,w:756,h:425};

/** The server-rendered view is also useful when JavaScript or Canvas is unavailable. */
function MotionPoster(){
 return <svg className="hero-motion-fallback" viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#fcd228">
   <path d={POSTER_TRIANGLE} strokeWidth="1" strokeLinejoin="round" opacity=".22"/>
   <rect x={POSTER_SCREEN.x} y={POSTER_SCREEN.y} width={POSTER_SCREEN.w} height={POSTER_SCREEN.h} strokeWidth="10" opacity=".07"/>
   <rect x={POSTER_SCREEN.x} y={POSTER_SCREEN.y} width={POSTER_SCREEN.w} height={POSTER_SCREEN.h} strokeWidth="1.2" opacity=".7"/>
  </g>
  <g fill="#fcd228">
   <rect x="106" y="547.5" width="708" height="1" opacity=".2"/>
   <rect x="106" y="547" width="460" height="2" opacity=".75"/>
   <rect x="563.5" y="545.5" width="5" height="5"/>
   <path d="M86 543L95 548.5L86 554Z" opacity=".8"/>
  </g>
 </svg>;
}

export function HeroMotion(){
 const host=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const pausedRef=useRef(false);
 const synchronize=useRef<()=>void>(()=>{});
 const [paused,setPaused]=useState(false);
 const [ready,setReady]=useState(false);
 const [running,setRunning]=useState(false);

 useEffect(()=>{
  const node=canvas.current;
  const container=host.current;
  const ctx=node?.getContext('2d',{alpha:false});
  if(!node||!container||!ctx)return;
  let disposed=false;
  let drawable=false;
  let inView=typeof IntersectionObserver==='undefined';
  let frame:number|null=null;
  let previousStamp:number|null=null;
  let lastPaint=-Infinity;
  let width=0;
  let height=0;
  let density=1;
  // Cached copy boxes: measured only on resize/font/layout changes, never per frame.
  let safeRects:SafeRect[]=[];
  let typography:((ctx:CanvasRenderingContext2D,time:number,viewport?:HeroSceneViewport)=>void)|undefined;
  const scene=createHeroRenderer(ctx);
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion starts on a fully composed frame instead of an empty opening.
  let elapsed=preference.matches?STEADY_FRAME_SECONDS:0;
  pausedRef.current=preference.matches;
  setPaused(preference.matches);

  function paint(){
   if(disposed||!width||!height)return;
   ctx!.setTransform(1,0,0,1,0,0);
   ctx!.fillStyle='#000';
   ctx!.fillRect(0,0,node!.width,node!.height);
   ctx!.setTransform(density,0,0,density,0,0);
   const viewport:HeroSceneViewport={width,height,safeRects:safeRects.length?safeRects:undefined};
   scene(elapsed,viewport);
   typography?.(ctx!,elapsed,viewport);
   // Last: a cached feathered veil softens every mark beneath the HTML copy.
   drawCopyHalo(ctx!,elapsed,viewport);
  }
  function measure(){
   if(disposed)return;
   try{safeRects=measureCopy(container!);}catch{safeRects=[];}
  }
  function shouldRun(){return drawable&&inView&&!document.hidden&&!pausedRef.current&&!disposed;}
  function tick(stamp:number){
   frame=null;
   if(!shouldRun()){previousStamp=null;setRunning(false);return;}
   if(previousStamp!==null)elapsed+=Math.min((stamp-previousStamp)/1000,.1);
   previousStamp=stamp;
   if(stamp-lastPaint>=1000/30){paint();lastPaint=stamp;}
   frame=requestAnimationFrame(tick);
  }
  function sync(){
   if(disposed)return;
   const active=shouldRun();
   setRunning(active);
   if(!active){
    // Elapsed may have advanced past the last throttled paint; show that exact frame while stopped.
    if(frame!==null){cancelAnimationFrame(frame);if(drawable)paint();}
    frame=null;previousStamp=null;
   }
   else if(frame===null){previousStamp=null;lastPaint=-Infinity;frame=requestAnimationFrame(tick);}
  }
  synchronize.current=sync;
  function resize(){
   if(disposed)return;
   measure();
   const rect=container!.getBoundingClientRect();
   width=rect.width;height=rect.height;density=Math.min(window.devicePixelRatio||1,2);
   node!.width=Math.max(1,Math.round(width*density));
   node!.height=Math.max(1,Math.round(height*density));
   if(drawable)paint();
  }
  function onPreference(){
   if(preference.matches){
    elapsed=STEADY_FRAME_SECONDS;
    if(drawable)paint();
   }
   pausedRef.current=preference.matches;setPaused(preference.matches);sync();
  }
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   inView=entries.some(entry=>entry.isIntersecting);sync();
  },{threshold:0});
  const resizer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);
  observer?.observe(container);
  resizer?.observe(container);
  const heroNode=container.closest('.brand-hero');
  heroNode?.querySelectorAll('.eyebrow, h1, h1 span, .brand-hero-description, .hero-actions, .hero-actions .button').forEach(el=>resizer?.observe(el));
  void document.fonts?.ready.then(()=>{if(disposed)return;measure();if(drawable)paint();});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',sync);
  preference.addEventListener('change',onPreference);
  resize();

  // Only the decorative type waits for fonts; the code-drawn scene appears immediately.
  drawable=true;
  paint();
  setReady(true);
  sync();
  void document.fonts.load('400 13px "JetBrains Mono Variable"').then(()=>createHeroTypography()).then(draw=>{
   if(disposed)return;
   typography=draw;
   paint();
  }).catch(()=>{/* Keep the fully usable geometric scene if font preparation fails. */});

  return()=>{
   disposed=true;
   if(frame!==null)cancelAnimationFrame(frame);
   observer?.disconnect();resizer?.disconnect();
   window.removeEventListener('resize',resize);
   document.removeEventListener('visibilitychange',sync);
   preference.removeEventListener('change',onPreference);
   synchronize.current=()=>{};
  };
 },[]);

 function toggle(){
  const next=!pausedRef.current;
  pausedRef.current=next;setPaused(next);synchronize.current();
 }

 return <div ref={host} className="hero-motion" data-state={!ready?'loading':paused?'paused':running?'playing':'idle'}>
  <MotionPoster/>
  <canvas ref={canvas} className="hero-motion-canvas" width="900" height="700" aria-hidden="true"/>
  {ready&&<button type="button" className="hero-motion-toggle" onClick={toggle} aria-label={paused?'Play hero animation':'Pause hero animation'}><span aria-hidden="true">{paused?'▶':'Ⅱ'}</span>{paused?'Play':'Pause'}</button>}
 </div>;
}
