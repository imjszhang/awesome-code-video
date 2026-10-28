/**
 * Procedural, asset-free hero film on a 24 s loop, staged after work_dir/hero-play/concept.png.
 *  0–6  generative frames emerge from darkness along the curved film ribbon
 *  6–12 frames sweep aside, particles stream with momentum and assemble a hollow PLAY triangle
 * 12–18 full composition: triangle (one light sweep on lock-in), selective gallery, shafts, trails
 * 18–24 layers dissolve one after another back to black (t=24 equals t=0)
 * A slow camera push (peak at 12 s) and foreground parallax give depth; both are periodic.
 */
import {drawHeroFilm} from './heroFilm';

export const HERO_SCENE_WIDTH = 900;
export const HERO_SCENE_HEIGHT = 700;
export type HeroSceneViewport = {width:number;height:number};

const TAU = Math.PI * 2;
const LOOP = 24;
const W_LOOP = TAU / LOOP; // integer multiples of this keep motion seamless
const GOLD = '#ffd84a';
const PALE = '#fff3c4';
type P2 = {x:number;y:number};

function randomSource(seed:number) {
 let value=seed>>>0;
 return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}
function clamp01(v:number){return Math.max(0,Math.min(1,v));}
function smooth(v:number){const t=clamp01(v);return t*t*(3-2*t);}
/** Rises over [a, a+rise], falls over [b, b+fall]. */
function env(t:number,a:number,rise:number,b:number,fall:number){return smooth((t-a)/rise)*(1-smooth((t-b)/fall));}

// Gallery slots along the ribbon: [position 0..1, content kind, phase-3 visibility].
const SLOTS:[number,number,number][]=[[.03,0,1],[.14,5,.7],[.25,1,.4],[.37,2,.55],[.5,3,.2],[.62,4,.35],[.75,3,.45],[.88,2,.25]];

export function createHeroRenderer(ctx:CanvasRenderingContext2D):(timeSeconds:number,viewport?:HeroSceneViewport)=>void {
 const rnd=randomSource(73019);
 // All seeds are fixed once; frames only evaluate closed-form motion.
 const motes=Array.from({length:900},()=>({u:rnd(),lane:rnd(),a:rnd()*TAU,r:.3+rnd()*.9,ph:rnd()*TAU,s:rnd(),c:rnd()-.5}));
 const stars=Array.from({length:150},()=>({r:Math.pow(rnd(),.7),a:rnd()*TAU,s:rnd()}));
 const trail=Array.from({length:26},()=>({u:rnd(),s:rnd(),k:1+Math.floor(rnd()*2)}));
 const comets=Array.from({length:5},()=>({u:rnd(),off:rnd()*.03}));

 let W=1,H=1,unit=1,compact=false,par=0;
 let tri:P2[]=[];
 // Ribbon: lower-left foreground, over the upper edge, down the right side.
 // Foreground parts drift outward more during the camera push (parallax).
 const nearness=(s:number)=>clamp01(1-s*1.6)+.4*clamp01((s-.75)*3);
 const ribbon=(s:number):P2=>{
  const th=.8*Math.PI+s*1.25*Math.PI;
  const x=W*.5+W*(compact?.5:.47)*Math.cos(th),y=H*.52+H*.44*Math.sin(th);
  const k=par*nearness(s);
  return {x:x+(x-W*.5)*k,y:y+(y-H*.48)*k};
 };
 // Keeps the centre (HTML heading) from carrying bright marks.
 function quiet(p:P2){
  const d=Math.hypot((p.x-W*.5)/(W*.5),(p.y-H*.48)/(H*.5)*1.3);
  return .25+.75*smooth((d-.2)/.4);
 }
 function dot(x:number,y:number,size:number,alpha:number){
  if(alpha<=.01)return;
  ctx.globalAlpha=Math.min(1,alpha);ctx.fillRect(x-size/2,y-size/2,size,size);
 }
 function triPoint(u:number,inset:number):P2{
  const e=Math.floor(u*3)%3,f=u*3-Math.floor(u*3),a=tri[e],b=tri[(e+1)%3];
  const c={x:(tri[0].x+tri[1].x+tri[2].x)/3,y:(tri[0].y+tri[1].y+tri[2].y)/3};
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
  return {x:c.x+(x-c.x)*(1-inset),y:c.y+(y-c.y)*(1-inset)};
 }
 function triPath(inset:number){
  ctx.beginPath();
  for(let i=0;i<=3;i++){const p=triPoint((i%3)/3,inset);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}
 }
 // Each frame's image is generated live from time, not faded from a still.
 function content(kind:number,w:number,h:number,ph:number,light:number,fine:number){
  ctx.fillStyle=GOLD;ctx.strokeStyle=GOLD;
  if(kind===0){ // dotted wave terrain in perspective: dense, rows widen toward the viewer, lit crests
   const cols=Math.round(40*fine),rows=Math.round(18*fine);
   for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const u=i/(cols-1),v=j/(rows-1),z=Math.sin(u*6+ph*3+v*2)*Math.cos(v*3-ph*2);
    const c=(z+1)*.5,spread=.7+.45*v;
    ctx.fillStyle=c>.82?PALE:GOLD;
    dot((u-.5)*w*spread,(v-.45)*h*.8-z*h*.2,(.7+1.3*c)*(.6+.6*v),light*(.18+.85*c*c)*(.35+.65*v));
   }
  }else if(kind===1){ // rotating torus of rings, dense near side lit
   const spin=ph*2,seg=Math.round(36*fine),ringN=Math.round(16*fine);
   for(let j=0;j<ringN;j++)for(let i=0;i<seg;i++){
    const a=i/seg*TAU,b=j/ringN*TAU+spin,R=.32,r=.15;
    const x=(R+r*Math.cos(b))*Math.cos(a),y=(R+r*Math.cos(b))*Math.sin(a)*.42+r*Math.sin(b)*.6;
    const lit=(1+Math.cos(b))*.5*(.6+.4*Math.sin(a));
    ctx.fillStyle=lit>.8?PALE:GOLD;
    dot(x*w,y*h*1.6,.9+lit*.9,light*(.12+.8*lit));
   }
  }else if(kind===2){ // winding particle galaxy with a pale core
   for(const s of stars){
    const a=s.a+s.r*5-ph*(1+(1-s.r)*2),rr=s.r*.46;
    ctx.fillStyle=s.r<.15?PALE:GOLD;
    dot(Math.cos(a)*rr*w,Math.sin(a)*rr*h*.7,.9+s.s,light*(1-s.r*.7));
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
 function frame(s:number,kind:number,alpha:number,ph:number){
  if(alpha<=.01)return;
  const p=ribbon(s),q=ribbon(s+.01);
  const ang=Math.atan2(q.y-p.y,q.x-p.x);
  // Foreground (lower left) frames are larger and grow with the camera push.
  const near=nearness(s);
  // Strong depth scale: the lower-left foreground panels are monumental, like the concept.
  const depth=(.55+1.05*Math.pow(clamp01(1-s*1.6),1.3)+.2*clamp01((s-.75)*3))*(1+par*near*.8);
  const w=unit*.24*depth*(compact?.8:1),h=w*.64;
  // Far frames recede: dimmer, so one depth layer reads as focal.
  const a=alpha*quiet(p)*(.5+.6*near);
  const fine=compact?.7:1;
  ctx.save();ctx.translate(p.x,p.y-h*.55);ctx.rotate(ang*.35);
  // Perspective: frames shear along the ribbon like panels on a curved strip.
  ctx.transform(1,Math.sin(ang)*.12,0,1,0,0);
  ctx.save();ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip();
  // Volumetric screen: warm light pooled at the lower centre, as if lit from inside.
  const glow=ctx.createRadialGradient(0,h*.25,0,0,h*.25,w*.7);
  glow.addColorStop(0,'rgba(255,190,60,.16)');glow.addColorStop(1,'rgba(255,190,60,0)');
  ctx.globalAlpha=Math.min(1,a);ctx.fillStyle=glow;ctx.fillRect(-w/2,-h/2,w,h);
  content(kind,w,h,ph,a*1.15,fine);
  ctx.restore();
  // Edge bloom then a crisp rim; the bottom edge (the ribbon side) is brightest.
  ctx.strokeStyle=GOLD;
  ctx.globalAlpha=a*.1;ctx.lineWidth=6;ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.globalAlpha=a*.85;ctx.lineWidth=1.2;ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.globalAlpha=a*.5;ctx.fillStyle=PALE;ctx.fillRect(-w/2,h/2-1,w,2);
  ctx.globalAlpha=a*.15;ctx.fillStyle=GOLD;ctx.fillRect(-w/2,h/2-4,w,8);
  // Corner registration ticks.
  ctx.globalAlpha=a;ctx.lineWidth=1.4;ctx.beginPath();
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
   const cx=sx*(w/2+3),cy=sy*(h/2+3),k=Math.min(8,w*.06);
   ctx.moveTo(cx,cy-sy*k);ctx.lineTo(cx,cy);ctx.lineTo(cx-sx*k,cy);
  }
  ctx.stroke();
  ctx.restore();
 }
 // Particle flight: a curved (quadratic) path with ease-out arrival and a damped settle,
 // so motes accelerate off the ribbon, carry momentum and overshoot slightly into place.
 type Mote=typeof motes[number];
 function flight(m:Mote,t:number,ph:number):{x:number;y:number;k:number;gone:number}{
  const raw=clamp01((t-6.3-m.s*2.2)/3.2);
  const k=1-Math.pow(1-raw,3);
  const gone=smooth((t-20-m.s*1.6)/2.4);
  const src=ribbon(m.u),dst=triPoint(m.u,m.lane*m.lane*.06);
  const mx=(src.x+dst.x)/2,my=(src.y+dst.y)/2,dx=dst.x-src.x,dy=dst.y-src.y;
  const cx=mx-dy*m.c*.9,cy=my+dx*m.c*.9;
  const i=1-k;
  let x=i*i*src.x+2*i*k*cx+k*k*dst.x,y=i*i*src.y+2*i*k*cy+k*k*dst.y;
  // Damped overshoot along the direction of travel once arrived.
  const settle=raw>=1?Math.exp(-(t-9.5-m.s*2.2)*2.2)*Math.sin((t-9.5)*9+m.ph):0;
  const len=Math.hypot(dx,dy)||1;
  x+=dx/len*settle*unit*.012;y+=dy/len*settle*unit*.012;
  // Pre-launch drift along the ribbon, and outward scatter on dissolve with a gentle curl.
  const wob=unit*.03*(1-k)*Math.sin(ph*3+m.ph);
  const out=gone*unit*.14*m.r,ca=m.a+gone*1.2*m.c;
  x+=Math.cos(m.a)*wob+Math.cos(ca)*out;y+=Math.sin(m.a)*wob+Math.sin(ca)*out-gone*gone*unit*.03;
  return {x,y,k:raw>0?Math.max(k,.02):0,gone};
 }
 return(timeSeconds:number,viewport?:HeroSceneViewport)=>{
  W=viewport?.width??HERO_SCENE_WIDTH;H=viewport?.height??HERO_SCENE_HEIGHT;
  compact=W<640;
  const t=((timeSeconds%LOOP)+LOOP)%LOOP,ph=t*W_LOOP;
  // Camera push: periodic, peaks at 12 s, back to rest at 0/24 s.
  const push=(1-Math.cos(ph))/2;
  par=.05*push;
  drawHeroFilm(ctx,timeSeconds,W,H);
  unit=Math.min(W,H*1.35);
  // Monumental hollow triangle, slightly right of centre so the heading sits inside it.
  const tw=unit*(compact?.42:.5)*(1+.035*push),cx=W*.5+tw*.08,cy=H*.48;
  tri=[{x:cx-tw*.45,y:cy-tw*.62},{x:cx+tw*.6,y:cy},{x:cx-tw*.45,y:cy+tw*.62}];
  ctx.save();
  ctx.globalCompositeOperation='lighter';

  // Ribbon track: draws itself in, stays as a hairline with a soft halo, leaves near the end.
  const reveal=smooth(t/4),track=env(t,0,2,20,2.5);
  if(track>.01){
   ctx.strokeStyle=GOLD;
   for(const [off,lw,al] of [[0,5,.05],[0,1,.3],[.018,1,.14]]){
    ctx.lineWidth=lw;ctx.globalAlpha=track*al;ctx.beginPath();
    for(let i=0;i<=120;i++){const p=ribbon(i/120*reveal);const y=p.y+off*H;i?ctx.lineTo(p.x,y):ctx.moveTo(p.x,y);}
    ctx.stroke();
   }
   // The drawing head of the ribbon glows while it is being revealed.
   if(reveal<1){const p=ribbon(reveal);ctx.fillStyle=PALE;dot(p.x,p.y,3,track*.9);ctx.fillStyle=GOLD;dot(p.x,p.y,9,track*.12);}
  }

  // Gallery: dominant in act 1, swept aside and dimmed in act 2, selective in act 3.
  const sweep=smooth((t-6)/3);
  SLOTS.forEach(([s,kind,vis],i)=>{
   if(compact&&i%2)return;
   const born=env(t,.4+i*.55,1.6,18.3+i*.28,1.4);
   const shift=s<.5?-.06*sweep*(1-s*2):.06*sweep*(s-.5)*2;
   const strength=(1-sweep)+sweep*vis*(.2+.3*smooth((t-12)/2));
   frame(s+shift,kind,born*strength*.9,ph+i);
  });

  // Particles: energy streaks while in flight (velocity from a short time step), dots once settled.
  const n=compact?300:motes.length;
  ctx.lineCap='round';
  for(let i=0;i<n;i++){
   const m=motes[i];
   const f=flight(m,t,ph);
   if(f.k<=.01)continue;
   const alpha=(.25+.5*f.k)*(1-f.gone)*(.7+.3*Math.sin(ph*4+m.ph));
   if(alpha<=.01)continue;
   const moving=f.k<.97||f.gone>.01;
   ctx.fillStyle=m.s>.92?PALE:GOLD;
   if(moving){
    const b=flight(m,t-.14,ph);
    const sp=Math.hypot(f.x-b.x,f.y-b.y);
    if(sp>1.5){
     ctx.strokeStyle=m.s>.92?PALE:GOLD;ctx.lineWidth=.6+m.r*.6;
     ctx.globalAlpha=Math.min(1,alpha*.6);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(f.x,f.y);ctx.stroke();
    }
   }
   dot(f.x,f.y,.9+m.r*.9,alpha);
  }
  ctx.lineCap='butt';

  // Triangle: soft bloom underlay, then the clean triple outline; strongest during act 3.
  const line=env(t,10.5,2,19.5,2);
  if(line>.01){
   ctx.strokeStyle=GOLD;ctx.lineJoin='round';
   [[0,16,.035],[0,6,.08]].forEach(([inset,lw,al])=>{ctx.lineWidth=lw;ctx.globalAlpha=line*al;triPath(inset);ctx.stroke();});
   [[0,1.6,.75],[.03,.8,.35],[.06,.6,.2]].forEach(([inset,lw,al])=>{ctx.lineWidth=lw;ctx.globalAlpha=line*al;triPath(inset);ctx.stroke();});
   // Lock-in light sweep: one narrow pale band crosses the outline once (12.2–13.6 s).
   const lock=clamp01((t-12.2)/1.4);
   if(lock>0&&lock<1){
    const x0=tri[0].x-tw*.2,x1=tri[1].x+tw*.2,bx=x0+(x1-x0)*smooth(lock);
    const g=ctx.createLinearGradient(bx-tw*.12,0,bx+tw*.12,0);
    g.addColorStop(0,'rgba(255,243,196,0)');g.addColorStop(.5,'rgba(255,243,196,1)');g.addColorStop(1,'rgba(255,243,196,0)');
    ctx.strokeStyle=g;ctx.globalAlpha=line*.55*Math.sin(Math.PI*lock);
    ctx.lineWidth=2.4;triPath(0);ctx.stroke();
    ctx.lineWidth=8;ctx.globalAlpha*=.18;triPath(0);ctx.stroke();
    ctx.strokeStyle=GOLD;
   }
   // Vertex nodes.
   ctx.fillStyle=PALE;
   for(const v of tri){dot(v.x,v.y,4,line*.85);}
   ctx.fillStyle=GOLD;
   for(const v of tri){dot(v.x,v.y,12,line*.08);}
   // A spark with a fading tail runs the perimeter once per act.
   const head=((t-10.5)/6)%1;
   for(let j=0;j<10;j++){
    const sp=triPoint(((head-j*.006)%1+1)%1,0);
    ctx.fillStyle=j?GOLD:PALE;dot(sp.x,sp.y,j?2.2:3,line*.9*(1-j/10));
   }
  }

  // Gold trails along the lower-right ribbon in act 3: comet streaks plus small riding cubes.
  const tr=env(t,12,2,19,2);
  if(tr>.01){
   ctx.lineCap='round';
   for(const c of compact?comets.slice(0,3):comets){
    const u=(c.u+t/LOOP*2)%1,fade=Math.sin(Math.PI*u);
    for(let j=0;j<14;j++){
     const a=ribbon(.75+.25*Math.max(0,u-j*.012)),b=ribbon(.75+.25*Math.max(0,u-(j+1)*.012));
     ctx.strokeStyle=j?GOLD:PALE;ctx.lineWidth=2-j*.12;
     ctx.globalAlpha=tr*fade*.5*(1-j/14)*quiet(a);
     ctx.beginPath();ctx.moveTo(a.x,a.y+H*c.off);ctx.lineTo(b.x,b.y+H*c.off);ctx.stroke();
    }
   }
   ctx.lineCap='butt';
   ctx.strokeStyle=GOLD;ctx.lineWidth=.8;
   for(const d of compact?trail.slice(0,10):trail){
    const u=(d.u+t/LOOP*d.k)%1,p=ribbon(.75+.25*u);
    const q=3+d.s*6;
    ctx.globalAlpha=tr*Math.sin(Math.PI*u)*.5*quiet(p);
    ctx.strokeRect(p.x-q/2,p.y+H*.02*d.s-q/2,q,q);
   }
  }
  ctx.restore();
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';

  // Vignette keeps edges deep black, so the lit layer reads against strong contrast.
  const vg=ctx.createRadialGradient(W*.5,H*.48,unit*.35,W*.5,H*.48,Math.hypot(W,H)*.6);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 };
}
