import React,{useEffect,useRef,useState} from 'react';
import {createHeroRenderer,type HeroSceneViewport} from './heroScene';
import {createHeroTypography} from './heroTypography';

/** The peak of the 12–18 s act: triangle, selective gallery and projector shafts together. */
const STEADY_FRAME_SECONDS=15;

/** Gallery frame centres and tilts from heroScene at its 900 × 700 reference size. */
const POSTER_FRAMES:[number,number,number][]=[
 [327.6,595.3,-5.9],[129.6,493.6,-9.5],[54,329,0],[129.6,164.4,9.5],[327.6,62.7,5.9],
 [572.4,62.7,-5.9],[770.4,164.4,-9.5],[846,329,0],[770.4,493.6,9.5],[572.4,595.3,5.9],
];
const POSTER_TRIANGLE='780.5,329 321.5,594 321.5,64';
const POSTER_INNER='749.9,329 336.8,567.5 336.8,90.5';

/** The server-rendered view is also useful when JavaScript or Canvas is unavailable. */
function MotionPoster(){
 return <svg className="hero-motion-fallback" viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#fcd228">
   <ellipse cx="450" cy="329" rx="396" ry="280" strokeWidth=".6" opacity=".08"/>
   {POSTER_FRAMES.map(([x,y,r])=><g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x="-54" y="-34.5" width="108" height="69" fill="#000" strokeWidth=".9" opacity=".7"/>
    <path d="M-50 -10Q-25 -24 0 -10T50 -10M-50 4Q-25 -10 0 4T50 4" strokeWidth=".7" opacity=".35"/>
    <path d="M-57 -30.5V-37.5H-50M50 -37.5H57V-30.5M57 30.5V37.5H50M-50 37.5H-57V30.5" strokeWidth="1.4"/>
   </g>)}
   <polygon points={POSTER_TRIANGLE} strokeWidth="18" strokeLinejoin="round" opacity=".07"/>
   <polygon points={POSTER_TRIANGLE} strokeWidth="6" strokeLinejoin="round" opacity=".18"/>
   <polygon points={POSTER_TRIANGLE} strokeWidth="2.2" strokeLinejoin="round" opacity=".9"/>
   <polygon points={POSTER_INNER} strokeWidth=".7" opacity=".22"/>
  </g>
  <g fill="#fcd228" opacity=".85"><rect x="778" y="326.5" width="5" height="5"/><rect x="319" y="591.5" width="5" height="5"/><rect x="319" y="61.5" width="5" height="5"/></g>
  <g fill="#fcd228" opacity=".5"><rect x="230" y="545" width="3" height="3"/><rect x="262" y="520" width="2" height="2"/><rect x="205" y="140" width="3" height="3"/><rect x="250" y="110" width="2" height="2"/><rect x="690" y="420" width="3" height="3"/><rect x="660" y="235" width="2" height="2"/><rect x="560" y="520" width="2" height="2"/><rect x="520" y="150" width="2" height="2"/></g>
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
   const viewport={width,height};
   scene(elapsed,viewport);
   typography?.(ctx!,elapsed,viewport);
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
   const rect=container!.getBoundingClientRect();
   width=rect.width;height=rect.height;density=Math.min(window.devicePixelRatio||1,2);
   node!.width=Math.max(1,Math.round(width*density));
   node!.height=Math.max(1,Math.round(height*density));
   if(drawable)paint();
  }
  function onPreference(){
   if(preference.matches){
    elapsed=Math.max(elapsed,STEADY_FRAME_SECONDS);
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
