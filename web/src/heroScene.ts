/**
 * Procedural, asset-free hero film on a 30 s loop (timeline and geometry in heroModel.ts).
 * Code fragments drawn by heroTypography land in arc slots; here each slot reveals a live
 * generative screen. The screens fold into strips along a hollow play triangle, which turns once,
 * shrinks to a glowing point and opens into a 16:9 frame; it plays, and everything dissolves (t=30 equals t=0).
 * `drawCopyHalo` runs last: a cached feathered veil softly dims every layer beneath the HTML copy.
 */
import {drawHeroFilm} from './heroFilm';
import {LOOP,TAU,T,type P2,type Pose,type SafeRect,arriveTime,clamp01,collapseScale,defaultSafe,env,foldAmount,frameAmount,heroSlots,isCompact,loopTime,outlineAlpha,outlinePoint,outlineTrace,panelPose,pointGlow,ribbonPoint,screenRect,smooth,stripAlpha,videoAlpha} from './heroModel';

export const HERO_SCENE_WIDTH = 900;
export const HERO_SCENE_HEIGHT = 700;
/** `safe`: measured text boxes of the HTML copy in canvas CSS pixels (cached by HeroMotion). */
export type HeroSceneViewport = {width:number;height:number;safe?:readonly SafeRect[];safeRects?:readonly SafeRect[]};
const safeOf=(v:HeroSceneViewport|undefined,W:number,H:number):readonly SafeRect[]=>
 v?.safeRects?.length?v.safeRects:v?.safe?.length?v.safe:defaultSafe(W,H);

/** Put the brief light point in the measured gap between headline lines. */
function pointOrigin(W:number,H:number,safe:readonly SafeRect[]):P2{
 const heads=safe.filter(r=>r.kind==='headline').slice().sort((a,b)=>a.y-b.y);
 for(let i=1;i<heads.length;i++){
  const top=heads[i-1].y+heads[i-1].h,bottom=heads[i].y;
  if(bottom-top>=6)return {x:W*.5,y:(top+bottom)/2};
 }
 const bottom=Math.max(0,...heads.map(r=>r.y+r.h));
 const next=safe.filter(r=>r.kind!=='headline'&&r.y>bottom+6).sort((a,b)=>a.y-b.y)[0];
 if(next)return {x:W*.5,y:(bottom+next.y)/2};
 return {x:W*.5,y:H*.5};
}

const W_LOOP = TAU / LOOP; // integer multiples of this keep motion seamless
const GOLD = '#ffd84a';
const PALE = '#fff3c4';
/** Content kinds the output frame cycles through while it plays. */
const PLAYLIST=[0,2,1,4,3,5];
const SHOT_START=T.expand,SHOT_LEN=(T.dissolve-SHOT_START)/PLAYLIST.length;
const OUTLINE_SAMPLES=120;

function randomSource(seed:number) {
 let value=seed>>>0;
 return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}

export function createHeroRenderer(ctx:CanvasRenderingContext2D):(timeSeconds:number,viewport?:HeroSceneViewport)=>void {
 const rnd=randomSource(73019);
 // All seeds are fixed once; frames only evaluate closed-form motion.
 const stars=Array.from({length:600},()=>({r:Math.pow(rnd(),.7),a:rnd()*TAU,s:rnd()}));
 const outline:P2[]=Array.from({length:OUTLINE_SAMPLES+1},()=>({x:0,y:0}));

 let W=1,H=1,origin:P2={x:0,y:0};
 function dot(x:number,y:number,size:number,alpha:number){
  if(alpha<=.01)return;
  ctx.globalAlpha=Math.min(1,alpha);ctx.fillRect(x-size/2,y-size/2,size,size);
 }
 // Each frame's image is generated live from time, not faded from a still.
 function content(kind:number,w:number,h:number,ph:number,light:number,fine:number,cinema=false){
  ctx.fillStyle=GOLD;ctx.strokeStyle=GOLD;
  if(kind===0){ // dotted wave terrain in perspective: rows widen toward the viewer, lit crests
   const cols=Math.round(40*fine),rows=Math.round(18*fine);
   for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const u=i/(cols-1),v=j/(rows-1),z=Math.sin(u*6+ph*3+v*2)*Math.cos(v*3-ph*2);
    const c=(z+1)*.5,spread=.7+.45*v;
    ctx.fillStyle=c>.82?PALE:GOLD;
    dot((u-.5)*w*spread,(v-.45)*h*.8-z*h*.2,(.7+1.3*c)*(.6+.6*v)*(cinema?1.4:1),light*(.18+.85*c*c)*(.35+.65*v));
   }
  }else if(kind===1){ // rotating torus of rings, dense near side lit
   const spin=ph*2,seg=Math.round(36*fine),ringN=Math.round(16*fine);
   for(let j=0;j<ringN;j++)for(let i=0;i<seg;i++){
    const a=i/seg*TAU,b=j/ringN*TAU+spin,R=.32,r=.15;
    const x=(R+r*Math.cos(b))*Math.cos(a),y=(R+r*Math.cos(b))*Math.sin(a)*.42+r*Math.sin(b)*.6;
    const lit=(1+Math.cos(b))*.5*(.6+.4*Math.sin(a));
    ctx.fillStyle=lit>.8?PALE:GOLD;
    dot(x*w,y*h*1.6,(.9+lit*.9)*(cinema?1.4:1),light*(.12+.8*lit));
   }
  }else if(kind===2){ // winding particle galaxy with a pale core
   const count=cinema?stars.length:150;
   for(let i=0;i<count;i++){
    const s=stars[i];
    const a=(cinema?(i%3)*TAU/3+(s.a/TAU-.5)*.7:s.a)+s.r*6-ph*(1+(1-s.r)*2),rr=s.r*.46;
    ctx.fillStyle=s.r<.15?PALE:GOLD;
    dot(Math.cos(a)*rr*w,Math.sin(a)*rr*h*(cinema?1.55:.7),(.9+s.s)*(cinema?1.45:1),light*(1-s.r*.55));
   }
  }else if(kind===3){ // voxels flying in and settling into a block
   const k=smooth(.5+.5*Math.sin(ph*2));
   ctx.lineWidth=.7;
   for(let i=0;i<30;i++){
    const gx=(i%6-2.5)*.07,gy=(Math.floor(i/6)-2)*.11,m=stars[i];
    const x=gx+(1-k)*(m.r-.5)*.8,y=gy+(1-k)*(m.s-.5)*.6;
    const q=w*.06,o=q*.3;
    // Shaded cube: lit face fill, offset top/side edge for volume.
    ctx.globalAlpha=light*(.1+.3*k*m.s);ctx.fillRect(x*w-q/2,y*h-q/2,q,q);
    ctx.globalAlpha=light*(.25+.5*k);ctx.strokeRect(x*w-q/2,y*h-q/2,q,q);
    ctx.beginPath();ctx.moveTo(x*w-q/2,y*h-q/2);ctx.lineTo(x*w-q/2+o,y*h-q/2-o);ctx.lineTo(x*w+q/2+o,y*h-q/2-o);ctx.lineTo(x*w+q/2+o,y*h+q/2-o);ctx.lineTo(x*w+q/2,y*h+q/2);
    ctx.globalAlpha=light*(.15+.3*k);ctx.stroke();
   }
  }else if(kind===4){ // perspective wireframe surface: rows and columns, a lit mesh
   ctx.lineWidth=.6;
   for(let i=0;i<=12;i++){
    ctx.globalAlpha=light*.14;ctx.beginPath();
    for(let j=0;j<=10;j++){
     const u=i/12,v=j/10,z=Math.sin(u*5-ph*2+v*3)*.5+Math.sin(u*11+ph*3)*.15;
     const sx=(u-.5)*w*(.6+.4*v),sy=(v-.5)*h*.7-z*h*.2;
     j?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);
    }
    ctx.stroke();
   }
   for(let j=0;j<12;j++){
    ctx.globalAlpha=light*(.14+.05*j);ctx.beginPath();
    for(let i=0;i<=24;i++){
     const u=i/24,v=j/11,z=Math.sin(u*5-ph*2+v*3)*.5+Math.sin(u*11+ph*3)*.15;
     const sx=(u-.5)*w*(.6+.4*v),sy=(v-.5)*h*.7-z*h*.2;
     i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);
    }
    ctx.stroke();
   }
  }else{ // nested orbit rings with satellites
   ctx.lineWidth=.6;
   for(let r=1;r<=4;r++){
    const rx=w*.1*r,ry=h*.07*r,a=ph*(5-r)*(r%2?1:-1);
    ctx.globalAlpha=light*.2;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.stroke();
    ctx.fillStyle=r===1?PALE:GOLD;
    dot(Math.cos(a)*rx,Math.sin(a)*ry,2.2,light*.8);
   }
  }
 }
 /**
  * A generated screen. `reveal` wipes its image in from the bottom as the code lands;
  * `flat` (0..1) is how far it has folded into a triangle strip: its picture compresses
  * with it and the registration ticks retract, so the strip still carries its content.
  */
 function frame(pose:Pose,kind:number,alpha:number,ph:number,reveal:number,fine:number,flat:number){
  if(alpha<=.01)return;
  const {w,h}=pose;
  // Far frames recede: dimmer, so one depth layer reads as focal.
  const a=alpha*(.5+.6*pose.near);
  ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.rot);
  // Perspective: frames shear along the ribbon like panels on a curved strip.
  ctx.transform(1,pose.shear,0,1,0,0);
  ctx.save();ctx.beginPath();ctx.rect(-w/2,h/2-h*reveal,w,h*reveal);ctx.clip();
  // Volumetric screen: warm light pooled at the lower centre, as if lit from inside.
  const glow=ctx.createRadialGradient(0,h*.25,0,0,h*.25,w*.7);
  glow.addColorStop(0,'rgba(255,190,60,.16)');glow.addColorStop(1,'rgba(255,190,60,0)');
  ctx.globalAlpha=Math.min(1,a);ctx.fillStyle=glow;ctx.fillRect(-w/2,-h/2,w,h);
  content(kind,w,h,ph,a*(1.15+.4*flat),fine*(1-.4*flat));
  ctx.restore();
  // The wipe's leading edge: a pale scanline where the code is being rendered.
  if(reveal<1){ctx.globalAlpha=a*.8;ctx.fillStyle=PALE;ctx.fillRect(-w/2,h/2-h*reveal-1,w,2);}
  // Edge bloom then a crisp rim; the bottom edge (the ribbon side) is brightest.
  ctx.strokeStyle=GOLD;
  ctx.globalAlpha=a*.1;ctx.lineWidth=6*(1-flat)+2;ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.globalAlpha=a*.85;ctx.lineWidth=1.2;ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.globalAlpha=a*.5*(1-flat);ctx.fillStyle=PALE;ctx.fillRect(-w/2,h/2-1,w,2);
  ctx.globalAlpha=a*.15*(1-flat);ctx.fillStyle=GOLD;ctx.fillRect(-w/2,h/2-4,w,8);
  // Corner registration ticks retract as the panel flattens.
  const tick=a*(1-flat);
  if(tick>.01){
   ctx.globalAlpha=tick;ctx.lineWidth=1.4;ctx.beginPath();
   for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const cx=sx*(w/2+3),cy=sy*(h/2+3),k=Math.min(8,w*.06);
    ctx.moveTo(cx,cy-sy*k);ctx.lineTo(cx,cy);ctx.lineTo(cx-sx*k,cy);
   }
   ctx.stroke();
  }
  ctx.restore();
 }
 /** Samples the outline once per frame (turning triangle, or the opening widescreen frame). */
 function sampleOutline(t:number){
  for(let i=0;i<=OUTLINE_SAMPLES;i++){const p=outlinePoint(W,H,i/OUTLINE_SAMPLES,t,origin);outline[i].x=p.x;outline[i].y=p.y;}
 }
 function tracePath(upto:number,scale:number){
  const cx=W*.5,cy=H*.5,n=Math.max(1,Math.round(upto*OUTLINE_SAMPLES));
  ctx.beginPath();
  for(let i=0;i<=n;i++){const p=outline[i],x=cx+(p.x-cx)*scale,y=cy+(p.y-cy)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  if(n>=OUTLINE_SAMPLES)ctx.closePath();
 }
 /** The picture inside the opening frame: shots crossfade and keep animating. */
 function video(t:number,ph:number,alpha:number){
  const c=screenRect(W,H,t),fine=isCompact(W)?1.15:1.8;
  const f=Math.max(0,t-SHOT_START)/SHOT_LEN;
  const cur=Math.min(PLAYLIST.length-1,Math.floor(f)),mix=smooth((f-cur)/.3);
  ctx.save();tracePath(1,1);ctx.clip();
  ctx.translate(c.x,c.y+c.h*.06);
  if(cur>0&&mix<1)content(PLAYLIST[cur-1],c.w,c.h*1.1,ph*1.5,alpha*(1-mix),fine,true);
  content(PLAYLIST[cur],c.w,c.h*1.1,ph*1.5,alpha*(cur>0?mix:1),fine,true);
  ctx.restore();
 }
 /**
  * One continuous outline: traced in as a triangle, turned, collapsed to a point, then the frame's
  * rim growing out of it. `k` is how far the frame has opened (0 while it is still the triangle).
  */
 function drawOutline(t:number,alpha:number,k:number){
  const trace=outlineTrace(t),tri=t<T.expand?1:0,size=tri?collapseScale(t):k;
  ctx.strokeStyle=GOLD;ctx.lineJoin='round';
  // Bloom, crisp rim, and two inner parallel rails (concept) on the triangle; widths shrink with
  // the shape so the collapse ends in the point's glow rather than a stroked blob.
  const lwScale=.25+.75*size;
  for(const [lw,al,scale] of [[10,.07,1],[1.4,.85,1],[1,.32*tri,.965],[1,.16*tri,.93]]){
   if(al*alpha<.01)continue;
   ctx.lineWidth=lw*lwScale;ctx.globalAlpha=alpha*al;tracePath(trace,scale);ctx.stroke();
  }
  // The tracing head glows while the outline draws itself in.
  if(trace<1){const p=outline[Math.round(trace*OUTLINE_SAMPLES)];ctx.fillStyle=PALE;dot(p.x,p.y,3,alpha);ctx.fillStyle=GOLD;dot(p.x,p.y,10,alpha*.15);}
  // The luminous point: a pale core with a soft gold halo, swelling as the triangle vanishes into it.
  const glow=pointGlow(t)*alpha;
  if(glow>.01){
   const cx=origin.x,cy=origin.y,r=Math.min(W,H)*.06*(.6+.4*glow);
   const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
   g.addColorStop(0,'rgba(255,243,196,.9)');g.addColorStop(.18,'rgba(255,216,74,.45)');g.addColorStop(1,'rgba(255,216,74,0)');
   ctx.globalAlpha=glow;ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,2*r,2*r);
   ctx.fillStyle=PALE;dot(cx,cy,3,glow);
  }
  // Vertex nodes on the triangle; film sprocket ticks once it is a frame.
  const nodes=alpha*tri*size*trace;
  if(nodes>.01){ctx.fillStyle=PALE;for(const u of [0,1/3,2/3]){const p=outline[Math.round(u*OUTLINE_SAMPLES)];dot(p.x,p.y,4,nodes*.8);}}
  const sprocket=alpha*smooth((k-.85)/.15);
  if(sprocket>.01){
   const c=screenRect(W,H,t),x0=c.x-c.w/2,y0=c.y-c.h/2,n=Math.round(c.w/28),sw=Math.min(9,c.w/n*.4);
   ctx.fillStyle=GOLD;ctx.globalAlpha=sprocket*.2;
   for(let i=0;i<n;i++){const sx=x0+(i+.5)*c.w/n-sw/2;ctx.fillRect(sx,y0-9,sw,4);ctx.fillRect(sx,y0+c.h+5,sw,4);}
   // Playback progress along the frame's bottom rim.
   const prog=clamp01((t-T.play)/(T.dissolve-T.play));
   ctx.globalAlpha=sprocket*.7;ctx.fillStyle=PALE;ctx.fillRect(x0,y0+c.h-3,c.w*prog,2);
  }
 }
 return(timeSeconds:number,viewport?:HeroSceneViewport)=>{
  W=viewport?.width??HERO_SCENE_WIDTH;H=viewport?.height??HERO_SCENE_HEIGHT;
  const compact=isCompact(W);
  origin=pointOrigin(W,H,safeOf(viewport,W,H));
  const t=loopTime(timeSeconds),ph=t*W_LOOP;
  drawHeroFilm(ctx,timeSeconds,W,H);
  ctx.save();
  // No hard exclusions: lit marks flow under the copy and drawCopyHalo's feathered veil attenuates them.
  ctx.globalCompositeOperation='lighter';

  // Ribbon track: draws itself in, stays as a hairline with a soft halo, leaves as the panels fold.
  const reveal=smooth(t/3),track=env(t,0,1.6,T.fold,2.5);
  if(track>.01){
   ctx.strokeStyle=GOLD;
   for(const [off,lw,al] of [[0,5,.05],[0,1,.3],[.018,1,.14]]){
    ctx.lineWidth=lw;ctx.globalAlpha=track*al;ctx.beginPath();
    for(let i=0;i<=120;i++){const p=ribbonPoint(W,H,i/120*reveal,t);const y=p.y+off*H;i?ctx.lineTo(p.x,y):ctx.moveTo(p.x,y);}
    ctx.stroke();
   }
   if(reveal<1){const p=ribbonPoint(W,H,reveal,t);ctx.fillStyle=PALE;dot(p.x,p.y,3,track*.9);ctx.fillStyle=GOLD;dot(p.x,p.y,9,track*.12);}
  }

  // Screens: an empty slot waits on the arc, the code lands and wipes its image in, then the
  // panel folds onto its triangle edge. Later slots draw first so the foreground stays on top.
  const slots=heroSlots(W),n=slots.length,fine=compact?.7:1,strips=stripAlpha(t);
  if(strips>.01)for(let i=n-1;i>=0;i--){
   const arrive=arriveTime(i,n),pose=panelPose(W,H,i,t);
   const born=smooth((t-arrive+.4)/.5),wipe=smooth((t-arrive+.3)/.9);
   // Waiting slot: faint corner ticks only, from 1 s until its screen arrives.
   const wait=env(t,1,1.2,arrive-.3,.6)*.35;
   if(wait>.01&&born<.05){
    ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.rot);ctx.transform(1,pose.shear,0,1,0,0);
    ctx.strokeStyle=GOLD;ctx.lineWidth=1;ctx.globalAlpha=wait;ctx.beginPath();
    for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
     const cx=sx*pose.w/2,cy=sy*pose.h/2,q=Math.min(10,pose.w*.08);
     ctx.moveTo(cx,cy-sy*q);ctx.lineTo(cx,cy);ctx.lineTo(cx-sx*q,cy);
    }
    ctx.stroke();ctx.restore();
   }
   frame(pose,slots[i][1],born*strips*.9,ph+i,wipe,fine,foldAmount(i,n,t));
   // Landing pulse: a brief rim flare expanding off the screen as its code arrives.
   const pulse=env(t,arrive-.1,.15,arrive+.1,.5);
   if(pulse>.01){
    const g=1+.12*smooth((t-arrive+.1)/.6);
    ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.rot);ctx.transform(1,pose.shear,0,1,0,0);
    ctx.strokeStyle=PALE;ctx.lineWidth=1.5;ctx.globalAlpha=pulse*.6;
    ctx.strokeRect(-pose.w*g/2,-pose.h*g/2,pose.w*g,pose.h*g);ctx.restore();
   }
  }

  const line=outlineAlpha(t);
  if(line>.01){
   const k=frameAmount(t);
   sampleOutline(t);
   const pic=videoAlpha(t);
   if(pic>.01)video(t,ph,pic);
   drawOutline(t,line,k);
  }

  ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';

  // Vignette keeps edges deep black, so the lit layer reads against strong contrast.
  const unit=Math.min(W,H*1.35);
  const vg=ctx.createRadialGradient(W*.5,H*.48,unit*.35,W*.5,H*.48,Math.hypot(W,H)*.6);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 };
}

/** Veil grid cell in CSS px; the bilinear upscale of this coarse mask is the feather itself. */
const VEIL_CELL=4;
/** Per copy kind: [core clearance px, falloff px, peak dimming]. Broad falloff, no edge. */
const VEIL:Record<SafeRect['kind'],readonly [number,number,number]>={headline:[6,120,.9],text:[4,70,.85],action:[2,44,.65]};
/** Overall cap: stacked lines never merge into an opaque pocket, so motion still reads through. */
const VEIL_CAP=.84;
let veilCache:{key:string;mask:HTMLCanvasElement|null}|undefined;

/**
 * Black alpha mask: each copy box contributes a smooth distance falloff (rounded by the box
 * distance metric), merged as 1-Π(1-a) so overlapping lines blend without seams or creases.
 * Rebuilt only when the viewport or measured rects change.
 */
function copyVeil(W:number,H:number,safe:readonly SafeRect[]):HTMLCanvasElement|null{
 const key=`${W}x${H}|`+safe.map(r=>`${r.kind[0]}${r.x|0},${r.y|0},${r.w|0},${r.h|0}`).join(';');
 if(veilCache?.key===key)return veilCache.mask;
 let mask:HTMLCanvasElement|null=null;
 try{
  const gw=Math.ceil(W/VEIL_CELL)+1,gh=Math.ceil(H/VEIL_CELL)+1;
  mask=document.createElement('canvas');mask.width=gw;mask.height=gh;
  const mc=mask.getContext('2d');
  if(!mc)throw new Error('no 2d');
  const img=mc.createImageData(gw,gh),px=img.data;
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){
   const x=(i+.5)*VEIL_CELL,y=(j+.5)*VEIL_CELL;
   let clear=1;
   for(const r of safe){
    const [core,fall,peak]=VEIL[r.kind];
    const dx=Math.max(Math.abs(x-r.x-r.w/2)-r.w/2,0),dy=Math.max(Math.abs(y-r.y-r.h/2)-r.h/2,0);
    const d=Math.hypot(dx,dy)-core;
    if(d<fall)clear*=1-peak*(1-smooth(d/fall));
   }
   px[(j*gw+i)*4+3]=Math.round(VEIL_CAP*(1-clear)*255);
  }
  mc.putImageData(img,0,0);
 }catch{mask=null;}
 veilCache={key,mask};
 return mask;
}

/**
 * Drawn after every lit layer (including the code typography): a cached feathered veil that
 * attenuates whatever flows beneath the copy, deepening slightly as the film brightens, and a
 * faint warm halo framing the headline. Deterministic in time; no per-frame DOM reads.
 */
export function drawCopyHalo(ctx:CanvasRenderingContext2D,timeSeconds:number,viewport:HeroSceneViewport){
 const W=viewport.width,H=viewport.height,safe=safeOf(viewport,W,H);
 const t=loopTime(timeSeconds);
 const lit=clamp01(.25+.75*Math.max(stripAlpha(t)*smooth((t-T.generate)/3),outlineAlpha(t)));
 ctx.save();
 ctx.globalCompositeOperation='source-over';
 const mask=copyVeil(W,H,safe);
 if(mask){
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=.85+.15*lit;
  ctx.drawImage(mask,0,0,mask.width*VEIL_CELL,mask.height*VEIL_CELL);
  ctx.globalAlpha=1;
 }else for(const r of safe){
  // Fallback without an offscreen canvas: soft elliptical gradients only, never solid fills.
  const [,fall,peak]=VEIL[r.kind];
  ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);ctx.scale(r.w/2+fall,r.h/2+fall);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  const a=peak*VEIL_CAP;
  g.addColorStop(0,`rgba(0,0,0,${a.toFixed(3)})`);g.addColorStop(.55,`rgba(0,0,0,${(a*.6).toFixed(3)})`);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
  ctx.restore();
 }
 const point=pointOrigin(W,H,safe),pulse=pointGlow(t);
 if(pulse>.01&&!safe.some(r=>point.x>=r.x-2&&point.x<=r.x+r.w+2&&point.y>=r.y-2&&point.y<=r.y+r.h+2)){
  ctx.globalAlpha=pulse*.9;ctx.fillStyle=PALE;ctx.beginPath();ctx.arc(point.x,point.y,1.8,0,TAU);ctx.fill();ctx.globalAlpha=1;
 }
 // Warm halo: a ring of light around the headline block, transparent at its centre.
 const heads=safe.filter(r=>r.kind==='headline');
 if(heads.length){
  let l=Infinity,tp=Infinity,rt=-Infinity,b=-Infinity;
  for(const r of heads){l=Math.min(l,r.x);tp=Math.min(tp,r.y);rt=Math.max(rt,r.x+r.w);b=Math.max(b,r.y+r.h);}
  const cx=(l+rt)/2,cy=(tp+b)/2,rx=(rt-l)/2*1.5+40,ry=(b-tp)/2*1.9+40;
  ctx.globalCompositeOperation='lighter';
  ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  const a=(.075*lit).toFixed(3);
  g.addColorStop(0,'rgba(255,190,60,0)');g.addColorStop(.6,'rgba(255,190,60,0)');
  g.addColorStop(.8,`rgba(255,190,60,${a})`);g.addColorStop(1,'rgba(255,190,60,0)');
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);
  ctx.restore();
 }
 ctx.restore();
}
