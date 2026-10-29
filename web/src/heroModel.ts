/**
 * Shared geometry and timing for the hero film, so the code layer (heroTypography),
 * the screen layer (heroScene) and the base stage (heroFilm) agree on where every
 * panel is and when. Every visual is a pure function of loop time.
 *
 *  0–2   source code scrolls in the edge columns
 *  2–9   readable fragments detach (leaving gaps) and generate the arc screens one by one
 *  9–11  gallery hold
 * 11–14  the screens shrink, turn and flatten into strips along the three edges of a play triangle
 * 14–17  the assembled hollow PLAY triangle turns exactly once, clockwise, easing in and out
 * 17–18.3 it shrinks uniformly about its centre to a point; 18.3–18.6 the point glows
 * 18.6–20.5 the point opens into the 16:9 frame from the same centre
 * 20.5–26 the frame plays procedural video
 * 26–30  everything dissolves back to black (t=30 equals t=0)
 */
export const LOOP=30;
export const TAU=Math.PI*2;
export const T={
 codeIn:0,generate:2,generateEnd:9,fold:11,foldEnd:14,triangle:14,spinEnd:17,collapse:17,point:18.3,expand:18.6,play:20.5,dissolve:26,
} as const;
/** Reduced motion shows one composed frame: mid-playback, video framing the copy. */
export const REDUCED_FRAME_SECONDS=22;

export type P2={x:number;y:number};
export type Pose={x:number;y:number;w:number;h:number;rot:number;shear:number;near:number};
/** A measured text box of the HTML copy, in canvas CSS pixels. */
export type SafeRect={x:number;y:number;w:number;h:number;kind:'headline'|'text'|'action'};

export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const t=clamp01(v);return t*t*(3-2*t);};
/** Rises over [a, a+rise], falls over [b, b+fall]. */
export const env=(t:number,a:number,rise:number,b:number,fall:number)=>smooth((t-a)/rise)*(1-smooth((t-b)/fall));
export const loopTime=(seconds:number)=>{const s=Number.isFinite(seconds)?seconds:0;return((s%LOOP)+LOOP)%LOOP;};
/** Slow camera push, peak mid-loop, at rest at 0/30 s. */
export const cameraPush=(t:number)=>(1-Math.cos(t/LOOP*TAU))/2;
export const isCompact=(W:number)=>W<760;

/** Used only before the copy has been measured: an estimate of the centred text boxes. */
export function defaultSafe(W:number,H:number):SafeRect[]{
 const w=Math.min(W*.86,760);
 return [
  {x:W/2-w/2,y:H*.3,w,h:H*.2,kind:'headline'},
  {x:W/2-w*.4,y:H*.52,w:w*.8,h:H*.08,kind:'text'},
  {x:W/2-Math.min(W*.42,190),y:H*.63,w:Math.min(W*.84,380),h:52,kind:'action'},
 ];
}
/** Bounding box of all copy boxes, padded; flights route around it. */
export function copyBounds(safe:readonly SafeRect[],pad=14){
 let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;
 for(const s of safe){l=Math.min(l,s.x);t=Math.min(t,s.y);r=Math.max(r,s.x+s.w);b=Math.max(b,s.y+s.h);}
 return {left:l-pad,top:t-pad,right:r+pad,bottom:b+pad};
}

/** Arc slots: [position along the ribbon 0..1, generative content kind]. Ordered as they are generated. */
const DESKTOP_SLOTS:[number,number][]=[[.03,0],[.14,5],[.25,1],[.37,2],[.5,3],[.62,4],[.75,3],[.88,2]];
// Narrow screens: four panels in the corners, fed by the top and bottom code bands, clear of the copy.
const MOBILE_SLOTS:[number,number][]=[[0,0],[1,1],[2,2],[3,4]];
const MOBILE_SPOTS:[number,number,number][]=[[.25,.8,.12],[.27,.2,-.1],[.73,.2,.1],[.75,.8,-.12]];
export const heroSlots=(W:number)=>isCompact(W)?MOBILE_SLOTS:DESKTOP_SLOTS;
/** Which code column feeds panel i: -1 left (desktop) / top (narrow), 1 right / bottom. */
export function slotSide(W:number,i:number):-1|1{
 if(isCompact(W))return MOBILE_SPOTS[i][1]<.5?-1:1;
 return DESKTOP_SLOTS[i][0]<.45?-1:1;
}
/** Triangle edge (0 top-left→apex, 1 apex→bottom-left, 2 bottom-left→top-left) and place on it, per panel. */
const DESKTOP_STRIPS:[number,number,number][]=[[2,0,3],[2,1,3],[2,2,3],[0,0,3],[0,1,3],[0,2,3],[1,0,2],[1,1,2]];
const MOBILE_STRIPS:[number,number,number][]=[[2,1,2],[2,0,2],[0,0,1],[1,0,1]];

/** Character flight: each glyph of a fragment leaves STAGGER s after the previous one and flies FLIGHT s. */
export const FLIGHT=1.3;
export const STAGGER=.035;
export const MAX_FRAGMENT=16;
export const detachTime=(i:number,n:number)=>T.generate+.15+i*4.9/n;
export const arriveTime=(i:number,n:number)=>detachTime(i,n)+FLIGHT+STAGGER*(MAX_FRAGMENT-1);
/** 0 on the arc, 1 flattened onto its triangle edge; staggered, and every panel has landed by T.triangle. */
export const foldAmount=(i:number,n:number,t:number)=>smooth((t-T.fold-i*.9/n)/2.1);
/** Strips ride the turn, then hand over to the clean outline before it collapses. */
export const stripAlpha=(t:number)=>1-smooth((t-15.9)/1.1);
export const outlineTrace=(t:number)=>smooth((t-12.2)/1.8);
export const outlineAlpha=(t:number)=>smooth((t-12.2)/1.4)*(1-smooth((t-T.dissolve)/3.2));
/** Quintic ease: speed and acceleration both start and end at 0. */
const ease5=(v:number)=>{const k=clamp01(v);return k*k*k*(k*(6*k-15)+10);};
/** Clockwise turn (canvas y points down): 0 until T.triangle, exactly TAU from T.spinEnd, never decreasing. */
export const spinAngle=(t:number)=>TAU*ease5((t-T.triangle)/(T.spinEnd-T.triangle));
/** Uniform size of the triangle: 1, then exactly 0 (a point) from T.point. */
export const collapseScale=(t:number)=>1-ease5((t-T.collapse)/(T.point-T.collapse));
/** The brief luminous point between the collapse and the expansion. */
export const pointGlow=(t:number)=>env(t,T.point-.4,.4,T.expand,.5);
/** 0 a point, 1 the widescreen frame, opening from the triangle's centre. */
export const frameAmount=(t:number)=>ease5((t-T.expand)/(T.play-T.expand));
/** The picture inside the frame grows in while it opens, plays, then dissolves. */
export const videoAlpha=(t:number)=>smooth((t-T.expand-.15)/1.4)*(1-smooth((t-T.dissolve)/3));

const nearness=(s:number)=>clamp01(1-s*1.6)+.4*clamp01((s-.75)*3);

/** Ribbon: lower-left foreground, over the upper edge, down the right side. Foreground drifts outward with the push. */
export function ribbonPoint(W:number,H:number,s:number,t:number):P2{
 const compact=isCompact(W),par=.05*cameraPush(t);
 const th=.8*Math.PI+s*1.25*Math.PI;
 const x=W*.5+W*(compact?.5:.47)*Math.cos(th),y=H*(compact?.5:.52)+H*(compact?.38:.44)*Math.sin(th);
 const k=par*nearness(s);
 return {x:x+(x-W*.5)*k,y:y+(y-H*.48)*k};
}

/** The final 16:9 frame. Large enough that the HTML copy reads as its title card. */
export function screenRect(W:number,H:number,t:number){
 const push=1+.02*smooth((t-T.play)/6);
 const w=(isCompact(W)?Math.min(W*.94,H*.9*16/9):Math.min(H*.7*16/9,W*.86))*push,h=w*9/16;
 return {x:W*.5,y:H*.5,w,h};
}

/**
 * The resting PLAY triangle: equilateral, vertical left edge, apex to the right, centroid at the
 * viewport centre. Its circumcircle stays 12 px inside the viewport, so the full turn fits on phones.
 */
const VERTEX_ANGLES=[-TAU/3,0,TAU/3];
function restTriangle(W:number,H:number){
 const L=Math.min(H*.9,W*(isCompact(W)?1.02:.68),Math.sqrt(3)*(Math.min(W,H)/2-12));
 return {cx:W*.5,cy:H*.5,R:L/Math.sqrt(3),L};
}
/** The PLAY triangle at time t, turned and scaled about its centre. Strips and outline share this one shape. */
export function triangle(W:number,H:number,t:number){
 const r=restTriangle(W,H),th=spinAngle(t),s=collapseScale(t);
 const [a,b,c]=VERTEX_ANGLES.map(v=>({x:r.cx+s*r.R*Math.cos(v+th),y:r.cy+s*r.R*Math.sin(v+th)}));
 return {a,b,c,L:r.L*s};
}
const lerp=(p:P2,q:P2,k:number):P2=>({x:p.x+(q.x-p.x)*k,y:p.y+(q.y-p.y)*k});
/**
 * One point of the outline at perimeter parameter u (0..1), clockwise from the top-left vertex or
 * corner. Before T.expand it is the triangle; from then on the frame, whose points move straight
 * out from the shared centre as it grows, so the picture opens out of the point.
 */
export function outlinePoint(W:number,H:number,u:number,t:number,origin:P2={x:W*.5,y:H*.5}):P2{
 const p=((u%1)+1)%1;
 if(t<T.expand){
  const {a,b,c}=triangle(W,H,t),v=[a,b,c],e=Math.min(2,Math.floor(p*3));
  const q=lerp(v[e],v[(e+1)%3],p*3-e),move=1-collapseScale(t);
  return {x:q.x+(origin.x-W*.5)*move,y:q.y+(origin.y-H*.5)*move};
 }
 const r=screenRect(W,H,t),k=frameAmount(t),w=r.w*k,h=r.h*k,x0=origin.x+(r.x-origin.x)*k-w/2,y0=origin.y+(r.y-origin.y)*k-h/2,d=p*2*(w+h);
 if(d<w)return {x:x0+d,y:y0};
 if(d<w+h)return {x:x0+w,y:y0+d-w};
 if(d<2*w+h)return {x:x0+w-(d-w-h),y:y0+h};
 return {x:x0,y:y0+h-(d-2*w-h)};
}

function arcPose(W:number,H:number,i:number,t:number):Pose{
 if(isCompact(W)){
  const [sx,sy,r]=MOBILE_SPOTS[i],w=W*.24;
  return {x:W*sx,y:H*sy,w,h:w*.64,rot:r,shear:r*.3,near:.6};
 }
 const s=heroSlots(W)[i][0];
 const p=ribbonPoint(W,H,s,t),q=ribbonPoint(W,H,s+.01,t);
 const ang=Math.atan2(q.y-p.y,q.x-p.x),unit=Math.min(W,H*1.35);
 const near=nearness(s);
 // Strong depth scale: the lower-left foreground panels are monumental, like the concept.
 const depth=(.55+1.05*Math.pow(clamp01(1-s*1.6),1.3)+.2*clamp01((s-.75)*3))*(1+.05*cameraPush(t)*near*.8);
 const w=unit*.24*depth,h=w*.64;
 return {x:p.x,y:p.y-h*.55,w,h,rot:ang*.35,shear:Math.sin(ang)*.12,near};
}
/**
 * Panel i's strip on its triangle edge at time t: its own segment, so strips never overlap, riding
 * the turning triangle. `rot` is the resting edge angle plus the spin itself, so it never wraps.
 */
const stripEdge=(W:number,i:number)=>(isCompact(W)?MOBILE_STRIPS:DESKTOP_STRIPS)[i];
/** Edge e runs from vertex e to vertex e+1, perpendicular to their bisector; wrapped to (-π, π]. */
const restAngle=(edge:number)=>{const a=VERTEX_ANGLES[edge]+TAU/6+Math.PI/2;return Math.atan2(Math.sin(a),Math.cos(a));};
export function stripPose(W:number,H:number,i:number,t:number):Pose{
 const [edge,j,m]=stripEdge(W,i);
 const tri=triangle(W,H,t),v=[tri.a,tri.b,tri.c],p=v[edge],q=v[(edge+1)%3];
 const mid=lerp(p,q,(j+.5)/m),len=Math.hypot(q.x-p.x,q.y-p.y)/m*.84;
 return {x:mid.x,y:mid.y,w:len,h:Math.max(7,tri.L*.03),rot:restAngle(edge)+spinAngle(t),shear:0,near:1};
}

/** Panel i: on the arc, then folding along a curved path onto its triangle edge. */
export function panelPose(W:number,H:number,i:number,t:number):Pose{
 const a=arcPose(W,H,i,t),k=foldAmount(i,heroSlots(W).length,t);
 if(k<=0)return a;
 const s=stripPose(W,H,i,t),j=1-k;
 // Strips are symmetric under a half turn: take the shorter rotation, but pick the half-turn
 // branch once (from the resting strip and the arc pose at fold start) so the moving target
 // only adds a bounded, continuous turn and can never jump by π mid-flight.
 const rest=restAngle(stripEdge(W,i)[0]),ref=arcPose(W,H,i,T.fold).rot;
 const flip=Math.PI*Math.round((ref-rest)/Math.PI),rot=s.rot+flip;
 // Bow outward from the centre so panels sweep around the copy, not across it.
 const mx=(a.x+s.x)/2,my=(a.y+s.y)/2,ox=mx-W*.5,oy=my-H*.5,on=Math.hypot(ox,oy)||1,bow=Math.min(W,H)*.12;
 const cx=mx+ox/on*bow,cy=my+oy/on*bow;
 // Height flattens faster than width shrinks: the panel reads as turning edge-on.
 const kh=smooth(k*1.25);
 return {
  x:j*j*a.x+2*j*k*cx+k*k*s.x,y:j*j*a.y+2*j*k*cy+k*k*s.y,
  w:a.w+(s.w-a.w)*k,h:a.h+(s.h-a.h)*kh,rot:a.rot+(rot-a.rot)*k,shear:a.shear*j,near:a.near+(1-a.near)*k,
 };
}
