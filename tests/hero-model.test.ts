import assert from 'node:assert/strict';
import test from 'node:test';
import {collapseScale, frameAmount, heroSlots, outlinePoint, panelPose, pointGlow, screenRect, spinAngle, stripAlpha, stripPose, triangle, T, TAU, type P2} from '../web/src/heroModel';

const sizes=[[304,839],[390,772],[720,826],[760,826],[1280,600],[1280,820]];
const distance=(p:P2,q:P2)=>Math.hypot(p.x-q.x,p.y-q.y);
const centroid=(t:ReturnType<typeof triangle>)=>({x:(t.a.x+t.b.x+t.c.x)/3,y:(t.a.y+t.b.y+t.c.y)/3});
const signedArea=(points:P2[])=>points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2;

test('the assembled triangle turns exactly once, clockwise, easing in and out without reversing',()=>{
 assert.equal(spinAngle(T.triangle),0);
 assert.equal(spinAngle(T.spinEnd),TAU);
 assert.ok(T.triangle>=T.foldEnd&&T.spinEnd<=T.collapse,'the turn happens on the assembled triangle, before it shrinks');
 const dt=1/240;
 let previous=spinAngle(0);
 for(let t=dt;t<=30;t+=dt){
  const a=spinAngle(t);
  assert.ok(a>=previous-1e-12,`never turns back at ${t}`);
  assert.ok(a-previous<.02,`no jump at ${t}`);
  previous=a;
 }
 // Starts and stops smoothly: near-zero speed at both ends, fastest in the middle.
 const speed=(t:number)=>(spinAngle(t+1e-3)-spinAngle(t-1e-3))/2e-3;
 assert.ok(speed(T.triangle+.02)<.01&&speed(T.spinEnd-.02)<.01);
 assert.ok(speed((T.triangle+T.spinEnd)/2)>TAU/(T.spinEnd-T.triangle));
 // Canvas y points down, so a clockwise turn moves the apex (rightmost at rest) downward first.
 for(const [w,h] of sizes){
  const rest=triangle(w,h,T.triangle),early=triangle(w,h,T.triangle+.4);
  assert.ok(early.b.y>rest.b.y+.1,'apex swings down: clockwise');
  for(const key of ['a','b','c'] as const)assert.ok(distance(triangle(w,h,T.spinEnd)[key],rest[key])<1e-6,'a full 360° lands where it started');
  assert.ok(distance(triangle(w,h,(T.triangle+T.spinEnd)/2).b,rest.b)>rest.L*.5,'it visibly turns');
 }
});

test('the triangle collapses uniformly about its centre to a point, glows, and opens as the frame from the same centre',()=>{
 assert.equal(collapseScale(T.collapse),1);
 assert.equal(collapseScale(T.point),0);
 assert.equal(frameAmount(T.expand),0);
 assert.equal(frameAmount(T.play),1);
 assert.ok(T.collapse<T.point&&T.point<T.expand&&T.expand<T.play);
 for(let t=T.collapse;t<T.point;t+=1/240)assert.ok(collapseScale(t+1/240)<=collapseScale(t)+1e-12,'shrinks monotonically');
 for(let t=T.expand;t<T.play;t+=1/240)assert.ok(frameAmount(t+1/240)>=frameAmount(t)-1e-12,'opens monotonically');
 assert.ok(pointGlow(T.point+.15)>.9&&pointGlow(T.triangle)===0&&pointGlow(T.play)===0,'brief glow only around the point');
 for(const [w,h] of sizes){
  const rest=triangle(w,h,T.collapse),r=screenRect(w,h,T.play);
  for(const t of [T.collapse,17.4,17.8,18.1,T.point]){
   const tri=triangle(w,h,t),s=collapseScale(t),c=centroid(tri);
   assert.ok(distance(c,{x:w/2,y:h/2})<1e-6,'centre stays fixed');
   assert.ok(Math.abs(distance(tri.a,tri.b)-s*distance(rest.a,rest.b))<1e-6&&Math.abs(distance(tri.b,tri.c)-s*distance(rest.b,rest.c))<1e-6,'uniform scale, no stretch');
  }
  // A real point: the degenerate triangle is intended between the collapse and the expansion.
  for(const t of [T.point,(T.point+T.expand)/2,T.expand-1e-6]){
   const tri=triangle(w,h,t);
   assert.ok([tri.a,tri.b,tri.c].every(p=>distance(p,{x:w/2,y:h/2})<1e-6),`collapsed to the centre at ${t}`);
  }
  for(let i=0;i<120;i++){
   assert.ok(distance(outlinePoint(w,h,i/120,T.expand),{x:w/2,y:h/2})<1e-6,'frame starts as the same point');
   const p=outlinePoint(w,h,i/120,T.play);
   assert.ok(Math.min(Math.abs(p.x-(r.x-r.w/2)),Math.abs(p.x-(r.x+r.w/2)),Math.abs(p.y-(r.y-r.h/2)),Math.abs(p.y-(r.y+r.h/2)))<1e-6,'ends on the frame');
  }
  // The frame keeps its 16:9 proportion while it grows: no triangle stretched into a rectangle.
  for(const t of [18.8,19.3,19.9,20.3]){
   const pts=Array.from({length:4},(_,i)=>outlinePoint(w,h,[0,.5*r.w/(r.w+r.h),.5,.5+.5*r.w/(r.w+r.h)][i],t));
   const fw=distance(pts[0],pts[1]),fh=distance(pts[1],pts[2]);
   assert.ok(fw>0&&Math.abs(fw/fh-16/9)<.02,`16:9 while opening at ${t}`);
   assert.ok(pts.every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h),'within viewport');
  }
 }
});

test('the outline is a closed, clockwise, finite shape that moves continuously through every phase',()=>{
 for(const [w,h] of sizes){
  const n=60,dt=1/120,shape=(t:number)=>Array.from({length:n},(_,i)=>outlinePoint(w,h,i/n,t));
  let previous=shape(12);
  for(let t=12+dt;t<=T.play+.5;t+=dt){
   const points=shape(t);
   assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
   assert.deepEqual(outlinePoint(w,h,1,t),points[0]);
   const area=signedArea(points);
   assert.ok(area>=-1e-6,`clockwise on screen (positive in y-down coordinates) at ${w}px / ${t}`);
   points.forEach((p,i)=>assert.ok(distance(p,previous[i])<Math.hypot(w,h)*.02,`continuous at ${w}px / ${t} / ${i}`));
   previous=points;
  }
 }
});

test('the turning triangle stays in frame and its panels move continuously into it',()=>{
 for(const [w,h] of sizes){
  const slots=heroSlots(w);
  let previous=slots.map((_,i)=>panelPose(w,h,i,10.4));
  let priorTriangle=triangle(w,h,10.4);
  for(let frame=1;frame<=(T.expand-10.4)*60;frame++){
   const t=10.4+frame/60,tri=triangle(w,h,t),vertices=[tri.a,tri.b,tri.c];
   assert.ok(vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=7&&p.x<=w-7&&p.y>=7&&p.y<=h-7),`triangle within viewport at ${w}px / ${t}`);
   for(const key of ['a','b','c'] as const)assert.ok(distance(tri[key],priorTriangle[key])<Math.hypot(w,h)*.025,`continuous triangle at ${w}px / ${t}`);
   previous=slots.map((_,i)=>{
    const pose=panelPose(w,h,i,t),old=previous[i];
    // Strips (faded out by 17 s) shrink with the triangle and reach zero length only at the point.
    assert.ok(Object.values(pose).every(Number.isFinite)&&pose.h>0&&(t<T.point?pose.w>0:pose.w>=0));
    if(t>=T.point)assert.ok(pose.w<1e-9&&stripAlpha(t)===0,'collapsed strips are already hidden');
    assert.ok(distance(pose,old)<Math.hypot(w,h)*.025,`continuous panel centre at ${w}px / ${t} / ${i}`);
    assert.ok(Math.abs(pose.rot-old.rot)<.1,`no angle branch jump at ${w}px / ${t} / ${i}`);
    return pose;
   });
   priorTriangle=tri;
  }
 }
});

test('fully gathered screens stay attached and aligned with the turning triangle edges',()=>{
 for(const [w,h] of sizes)for(const t of [T.triangle,14.6,15.3,15.9,16.5]){
  const tri=triangle(w,h,t),vertices=[tri.a,tri.b,tri.c];
  heroSlots(w).forEach((_,i)=>{
   const strip=stripPose(w,h,i,t),panel=panelPose(w,h,i,t);
   assert.ok(distance(panel,strip)<1e-6);
   assert.ok(Math.abs(panel.w-strip.w)<1e-6&&Math.abs(panel.h-strip.h)<1e-6);
   assert.ok(Math.abs(Math.sin(panel.rot-strip.rot))<1e-6,'panel and strip share an axis');
   const endpoints=[-1,1].map(sign=>({x:strip.x+sign*strip.w/2*Math.cos(strip.rot),y:strip.y+sign*strip.w/2*Math.sin(strip.rot)}));
   assert.ok(vertices.some((a,j)=>{
    const b=vertices[(j+1)%3],dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    return endpoints.every(p=>{
     const projection=((p.x-a.x)*dx+(p.y-a.y)*dy)/length2;
     return Math.abs((p.x-a.x)*dy-(p.y-a.y)*dx)<1e-5&&projection>=0&&projection<=1;
    });
   }),'both strip ends lie on the same triangle edge');
  });
 }
});
