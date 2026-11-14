import React,{useEffect,useRef,useState} from 'react';
import {REEL_FONTS,REEL_FPS,REEL_FRAMES,REEL_HEIGHT,REEL_LISTING,REEL_SHOTS,REEL_STILL_FRAME,REEL_WIDTH,drawReelFrame,shotAt,timecode,wrapFrame} from './heroReel';

const STILL_SHOT=shotAt(REEL_STILL_FRAME).id;
const progressOf=(frame:number)=>(frame/(REEL_FRAMES-1)).toFixed(4);

/** The composed title frame as vectors: shown before fonts load and when JavaScript or Canvas is unavailable. */
function MotionPoster(){
 return <svg className="hero-motion-fallback" viewBox={`0 0 ${REEL_WIDTH} ${REEL_HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width={REEL_WIDTH} height={REEL_HEIGHT} fill="#0e0e10"/>
  <text x="480" y="300" textAnchor="middle" fontSize="118" fontWeight="700" fill="#f1eee7">Find ideas<tspan fill="#fcd228">.</tspan></text>
  <rect x="137" y="372" width="685" height="6" fill="#f1eee7" opacity=".16"/>
  <rect x="137" y="372" width="443" height="6" fill="#fcd228"/>
 </svg>;
}

function PlayIcon({paused}:{paused:boolean}){
 return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">{paused?<path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/>:<path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" fill="currentColor"/>}</svg>;
}

export function HeroMotion(){
 const host=useRef<HTMLDivElement>(null);
 const stage=useRef<HTMLDivElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const scrubber=useRef<HTMLInputElement>(null);
 const clock=useRef<HTMLSpanElement>(null);
 const pausedRef=useRef(false);
 const controls=useRef<{sync:()=>void,seek:(frame:number)=>void}>({sync(){},seek(){}});
 const [paused,setPaused]=useState(false);
 const [ready,setReady]=useState(false);
 const [running,setRunning]=useState(false);

 useEffect(()=>{
  const node=canvas.current;
  const container=host.current;
  const box=stage.current;
  const ctx=node?.getContext('2d',{alpha:false});
  if(!node||!container||!box||!ctx)return;
  let disposed=false;
  let drawable=false;
  let inView=typeof IntersectionObserver==='undefined';
  let request:number|null=null;
  let previousStamp:number|null=null;
  let shown=-1;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion rests on a fully composed frame instead of an empty opening.
  let elapsed=preference.matches?REEL_STILL_FRAME/REEL_FPS:0;
  pausedRef.current=preference.matches;
  setPaused(preference.matches);

  /** Draw the current frame and mirror it in the listing, the timeline and the clock. */
  function present(force=false){
   if(disposed||!drawable)return;
   const frame=wrapFrame(elapsed*REEL_FPS);
   if(frame===shown&&!force)return;
   shown=frame;
   ctx!.setTransform(node!.width/REEL_WIDTH,0,0,node!.height/REEL_HEIGHT,0,0);
   drawReelFrame(ctx!,frame);
   container!.dataset.shot=shotAt(frame).id;
   container!.style.setProperty('--reel-progress',progressOf(frame));
   if(scrubber.current)scrubber.current.value=String(frame);
   if(clock.current)clock.current.textContent=timecode(frame);
  }
  function shouldRun(){return drawable&&inView&&!document.hidden&&!pausedRef.current&&!disposed;}
  function tick(stamp:number){
   request=null;
   if(!shouldRun()){previousStamp=null;setRunning(false);return;}
   if(previousStamp!==null)elapsed=(elapsed+Math.min((stamp-previousStamp)/1000,.1))%(REEL_FRAMES/REEL_FPS);
   previousStamp=stamp;
   present();
   request=requestAnimationFrame(tick);
  }
  function sync(){
   if(disposed)return;
   const active=shouldRun();
   setRunning(active);
   if(!active){
    if(request!==null)cancelAnimationFrame(request);
    request=null;previousStamp=null;
    present();
   }else if(request===null){previousStamp=null;request=requestAnimationFrame(tick);}
  }
  function seek(frame:number){
   // Scrubbing holds the chosen frame; Play resumes from exactly there.
   elapsed=wrapFrame(frame)/REEL_FPS;
   pausedRef.current=true;setPaused(true);
   sync();
  }
  controls.current={sync,seek};
  function resize(){
   if(disposed)return;
   const rect=box!.getBoundingClientRect();
   const density=Math.min(window.devicePixelRatio||1,2);
   node!.width=Math.max(1,Math.round(rect.width*density));
   node!.height=Math.max(1,Math.round(rect.height*density));
   present(true);
  }
  function onPreference(){
   if(preference.matches)elapsed=REEL_STILL_FRAME/REEL_FPS;
   pausedRef.current=preference.matches;setPaused(preference.matches);sync();
  }
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   inView=entries.some(entry=>entry.isIntersecting);sync();
  },{threshold:0});
  const resizer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);
  observer?.observe(container);
  resizer?.observe(box);
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',sync);
  preference.addEventListener('change',onPreference);

  // Canvas text needs its fonts first; the vector poster stays up until they arrive.
  function start(){
   if(disposed||drawable)return;
   drawable=true;
   resize();
   setReady(true);
   sync();
  }
  const fonts=document.fonts?Promise.all(REEL_FONTS.map(font=>document.fonts.load(font))):Promise.resolve();
  const patience=window.setTimeout(start,2500);
  void fonts.catch(()=>{}).then(()=>{window.clearTimeout(patience);if(drawable)present(true);else start();});

  return()=>{
   disposed=true;
   window.clearTimeout(patience);
   if(request!==null)cancelAnimationFrame(request);
   observer?.disconnect();resizer?.disconnect();
   window.removeEventListener('resize',resize);
   document.removeEventListener('visibilitychange',sync);
   preference.removeEventListener('change',onPreference);
   controls.current={sync(){},seek(){}};
  };
 },[]);

 function toggle(){
  const next=!pausedRef.current;
  pausedRef.current=next;setPaused(next);controls.current.sync();
 }

 // Until the canvas is ready the poster is a still, so the control offers Play rather than Pause.
 const resting=paused||!ready;
 return <div ref={host} className="hero-motion" data-state={!ready?'loading':paused?'paused':running?'playing':'idle'} data-shot={STILL_SHOT} style={{'--reel-progress':progressOf(REEL_STILL_FRAME)} as React.CSSProperties}>
  <div className="reel-head" aria-hidden="true">
   <span className="reel-tab">reel.ts</span>
   <span className="reel-spec">{REEL_WIDTH} × {REEL_HEIGHT} · {REEL_FPS} fps</span>
  </div>
  <div className="reel-code" aria-hidden="true">
   {REEL_LISTING.map((line,index)=><div className="reel-line" data-reel-shot={line.shot} key={index}><span className="reel-no">{index+1}</span>{line.tokens.map((token,at)=><span className={token.tone?`reel-${token.tone}`:undefined} key={at}>{token.text}</span>)}</div>)}
  </div>
  <div ref={stage} className="reel-stage">
   <MotionPoster/>
   <canvas ref={canvas} className="hero-motion-canvas" width={REEL_WIDTH} height={REEL_HEIGHT} aria-hidden="true"/>
  </div>
  <div className="reel-transport">
   <button type="button" className="hero-motion-toggle" onClick={toggle} disabled={!ready} aria-label={resting?'Play hero animation':'Pause hero animation'}><PlayIcon paused={resting}/></button>
   <div className="reel-track">
    <div className="reel-shots" aria-hidden="true">{REEL_SHOTS.map(shot=><span key={shot.id} data-reel-shot={shot.id} style={{flexGrow:shot.frames}}>{shot.id}</span>)}</div>
    <input ref={scrubber} className="reel-scrubber" type="range" min={0} max={REEL_FRAMES-1} step={1} defaultValue={REEL_STILL_FRAME} disabled={!ready} aria-label="Scrub the hero animation, in frames" onChange={event=>controls.current.seek(Number(event.currentTarget.value))}/>
   </div>
   <span ref={clock} className="reel-clock" aria-hidden="true">{timecode(REEL_STILL_FRAME)}</span>
  </div>
 </div>;
}
