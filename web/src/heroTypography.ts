import type {HeroSceneViewport} from './heroScene';
import {FLIGHT,LOOP,MAX_FRAGMENT,STAGGER,T,TAU,arriveTime,clamp01,copyBounds,defaultSafe,detachTime,heroSlots,isCompact,loopTime,panelPose,slotSide,smooth} from './heroModel';

/**
 * Scrolling source columns at the hero's edges: real lines of code with line
 * numbers and restrained gold/ivory syntax colour, streaming upward like an
 * editor while the scene plays. Over 2–9 s one fragment per arc slot detaches
 * from its live row (which lights up first), character by character, leaving a
 * gap in the source; each character flies a curved path around the HTML copy
 * into its slot and becomes a lit pixel as the slot's screen renders (heroScene).
 * Everything is a closed-form function of time (30 s period), so pause, reduced
 * motion and offscreen resume land on exactly the frame the shared `elapsed`
 * clock describes. Tokens are prepared once and fragments once per viewport;
 * frames only do arithmetic and fillText.
 *
 *  0–2   columns slide in from the edges, new lines type in at the bottom
 *  2–9   fragments leave the inner columns for the arc slots
 * 11–20  columns dim as the panels fold into the triangle, it turns, collapses and opens as the frame
 * 24–28  columns drift outward and recede before the dissolve (t=30 equals t=0)
 */

const LEFT_SOURCE=`import {compose, sequence} from './motion';
// scene.ts — one idea, many frames
export const scene = compose({
  palette: ['#ffd84a', '#000'],
  duration: 30,
  fps: 30,
});
const orbit = (t) => Math.sin(t * 0.26);
const ribbon = path.arc(0.8, 2.05);
for (const frame of ribbon.frames(10)) {
  frame.draw(gallery.next());
  frame.depth = 1 - frame.index * 0.1;
}
scene.at(2, () => {
  for (const slot of ribbon.slots) slot.render(code);
});
scene.at(11, () => gallery.fold(play.edges));
scene.at(14, () => play.turn(1).collapse().open(screen));
// every frame becomes one moving image
const output = screen.play(gallery.shots);
scene.layer(output, {aspect: 16 / 9});
export function frame(t) {
  const push = (1 - Math.cos(t)) / 2;
  camera.zoom(1 + push * 0.035);
  return scene.render(t, orbit(t));
}
scene.at(26, () => scene.dissolve());
scene.loop();`;
const RIGHT_SOURCE=`// render.ts — source becomes motion
export const film = {
  source: imagination,
  duration: Infinity,
};
type Frame = {time: number, light: number};
function render(scene, time) {
  const path = trace(scene.ribbon, time);
  const light = 0.6 + 0.4 * glow(time);
  return compose(scene, path, light);
}
const torus = mesh.torus(0.32, 0.15);
torus.spin(time * 2);
const waves = grid(40, 18).map(wave);
const galaxy = spiral(150, {arms: 2});
export async function* play(idea) {
  const story = await idea.sequence();
  for (const shot of story) {
    yield render(shot, clock.now());
  }
}
// idea → sequence → motion
const trail = comets(5).along(ribbon);
trail.fade(0.5);
film.render();`;

type Kind=0|1|2|3|4|5;
// keyword, identifier, literal, comment, punctuation, line number
const COLORS=['#ffd84a','#efe4c4','#fff3c4','#8f7a45','#b49a55','#6e5d33'];
type Token={text:string;col:number;kind:Kind};
const TOKEN=/(\/\/.*$)|('[^']*')|(\b\d+(?:\.\d+)?\b)|(\b(?:import|export|from|const|let|type|function|async|await|yield|return|for|of|new)\b)|(=>|[{}()[\];,.:=+*\/<>-])|([\w#$]+|→|—)|(\s+)|(.)/g;
function tokenize(source:string):Token[][]{
 return source.split('\n').map(line=>{
  const out:Token[]=[];
  for(const m of line.matchAll(TOKEN)){
   if(m[7])continue;
   const kind:Kind=m[1]?3:m[2]||m[3]?2:m[4]?0:m[5]?4:1;
   out.push({text:m[0],col:m.index??0,kind});
  }
  return out;
 });
}

/** One detaching character: its source cell and its landing spot in a slot's local frame. */
type Glyph={ch:string;col:number;kind:Kind;lx:number;ly:number;bend:number};
type Fragment={column:number;row:number;slot:number;start:number;glyphs:Glyph[]};
/** A detached glyph stays out of its source row until the columns have faded. */
const GAP_END=29.5;

type Column={x:number;top:number;bottom:number;width:number;size:number;alpha:number;cycles:number;source:number;offset:number;edge:-1|1;inner:boolean};
/** Desktop: a far, small outer strip and a near inner column per side. Narrow: top and bottom bands. */
function layoutColumns(width:number,height:number):Column[]{
 if(isCompact(width)){
  const m=16,w=width-m*2;
  return [
   {x:m,top:height*.015,bottom:height*.13,width:w,size:10,alpha:.3,cycles:1,source:0,offset:7,edge:-1,inner:false},
   {x:m,top:height*.885,bottom:height*.985,width:w,size:10,alpha:.22,cycles:1,source:1,offset:3,edge:1,inner:false},
  ];
 }
 const margin=Math.max(24,Math.min(48,width*.03));
 const top=height*.12,bottom=height*.9;
 const side=Math.min(330,width*.235);
 const wide=width>=1100;
 const nearW=wide?side*.64:side,farW=side-nearW-12;
 // The first two columns are the inner ones that feed the slots (left, right).
 const cols:Column[]=[
  {x:margin+(wide?farW+12:0),top,bottom,width:nearW,size:12.5,alpha:.62,cycles:2,source:0,offset:0,edge:-1,inner:true},
  {x:width-margin-side,top,bottom,width:nearW,size:12.5,alpha:.58,cycles:2,source:1,offset:11,edge:1,inner:true},
 ];
 if(wide)cols.push(
  {x:margin,top:top+30,bottom:bottom-30,width:farW,size:10,alpha:.26,cycles:1,source:1,offset:17,edge:-1,inner:false},
  {x:width-margin-farW,top:top+30,bottom:bottom-30,width:farW,size:10,alpha:.24,cycles:1,source:0,offset:5,edge:1,inner:false},
 );
 return cols;
}

/** Keep a flight in a shared edge band; corner routes pass around the HTML copy. */
type Box={left:number;right:number;top:number;bottom:number};
function flightPoint(sx:number,sy:number,tx:number,ty:number,bend:number,p:number,box:Box){
 const {left,right,top,bottom}=box,width=left+right,height=top+bottom;
 const dx=tx-sx,dy=ty-sy;
 let cx=(sx+tx)/2-dy*bend,cy=(sy+ty)/2+dx*bend;
 if(sx<=left&&tx<=left)cx=Math.min(cx,left-8);
 else if(sx>=right&&tx>=right)cx=Math.max(cx,right+8);
 else if(sy<=top&&ty<=top)cy=Math.min(cy,top-8);
 else if(sy>=bottom&&ty>=bottom)cy=Math.max(cy,bottom+8);
 else {
  // With no shared edge band, turn at an outer corner. Each leg stays outside one
  // side of the protected rectangle, and its velocity eases to zero at the turn.
  const corner=ty<=top||ty>=bottom
   ?{x:sx<width*.5?Math.min(sx,left-8):Math.max(sx,right+8),y:ty}
   :{x:tx,y:sy<height*.5?Math.min(sy,top-8):Math.max(sy,bottom+8)};
  if(p<.5){const k=smooth(p*2);return {x:sx+(corner.x-sx)*k,y:sy+(corner.y-sy)*k};}
  const k=smooth((p-.5)*2);return {x:corner.x+(tx-corner.x)*k,y:corner.y+(ty-corner.y)*k};
 }
 const q=1-p;
 return {x:q*q*sx+2*q*p*cx+p*p*tx,y:q*q*sy+2*q*p*cy+p*p*ty};
}

/** Kept async for the public API; font loading is awaited by the caller before this resolves. */
export async function createHeroTypography():Promise<(ctx:CanvasRenderingContext2D,timeSeconds:number,viewport?:HeroSceneViewport)=>void>{
 const sources=[tokenize(LEFT_SOURCE),tokenize(RIGHT_SOURCE)];
 const charWidths=new Map<number,number>();
 const fonts=new Map<number,string>();
 const fontFor=(size:number)=>{let f=fonts.get(size);if(!f){f=`400 ${size}px "JetBrains Mono Variable", monospace`;fonts.set(size,f);}return f;};
 const presenceAt=(t:number)=>smooth(t/1.6)*(1-smooth((t-24)/4));
 /** Column state as a pure function of loop time, shared by row drawing and flight sources. */
 function columnAt(c:Column,cw:number,t:number){
  const L=sources[c.source].length,lh=Math.round(c.size*1.6),cycle=L*lh,u=t/LOOP;
  // Speed rises toward the 12 s climax; the integral is periodic, so wrapping is seamless.
  const pos=cycle*(c.cycles*u-.55*c.cycles*Math.sin(u*TAU)/TAU)+c.offset*lh;
  // Enter from and recede toward the nearest edge, the far strip moving less.
  const x0=c.x+(1-presenceAt(t))*(c.inner?36:18)*c.edge;
  return {lh,pos,x0,textX:x0+cw*3.6};
 }
 const NONE:Fragment[]=[];
 let fragmentCache:{key:string;columns:Column[];fragments:Fragment[];byColumn:Map<number,Fragment[]>[]}|undefined;
 /** The same clipping, feather and typing rules used to draw the source row. */
 function visibleCell(c:Column,cw:number,row:number,col:number,lineLength:number,t:number){
  const {lh,pos,x0,textX}=columnAt(c,cw,t),y=c.top+row*lh-pos+lh*.5;
  const feather=Math.min(70,(c.bottom-c.top)*.3),x=textX+col*cw;
  const fade=smooth((y-c.top)/feather)*smooth((c.bottom-y)/feather);
  const visible=Math.floor(clamp01((c.bottom-feather*.4-y)/(lh*2.2))*lineLength);
  return col<visible&&x>=x0+2&&x+cw<=x0+c.width-2&&
   y-c.size*.6>=c.top&&y+c.size*.6<=c.bottom&&fade>=.45&&
   clamp01((x0+c.width-x)/(c.width*.22))>=.35;
 }
 /** Columns and fragments depend only on the viewport, so they are rebuilt only on resize. */
 function prepare(ctx:CanvasRenderingContext2D,width:number,height:number):Column[]{
  const key=`${width}x${height}`;
  if(fragmentCache?.key===key)return fragmentCache.columns;
  const columns=layoutColumns(width,height);
  for(const c of columns)if(!charWidths.has(c.size)){ctx.font=fontFor(c.size);charWidths.set(c.size,ctx.measureText('0').width||c.size*.6);}
  const n=heroSlots(width).length,fragments:Fragment[]=[],byColumn:Map<number,Fragment[]>[]=columns.map(()=>new Map());
  for(let i=0;i<n;i++){
   const ci=slotSide(width,i)<0?0:1,c=columns[ci],cw=charWidths.get(c.size)!,lines=sources[c.source];
   const d=detachTime(i,n),{lh,pos}=columnAt(c,cw,d);
   const span=c.bottom-c.top,target=panelPose(width,height,i,d);
   const targetY=Math.max(c.top+lh,Math.min(c.bottom-lh,target.y));
   const first=Math.floor(pos/lh),last=Math.ceil((pos+span)/lh);
   type Cell={ch:string;col:number;kind:Kind};
   let best:{row:number;cells:Cell[];score:number}|undefined;
   // Search the visible rows nearest the destination first. The capped search runs only on resize.
   const rows=Array.from({length:Math.min(64,last-first+1)},(_,j)=>first+j)
    .sort((a,b)=>Math.abs(c.top+a*lh-pos+lh*.5-targetY)-Math.abs(c.top+b*lh-pos+lh*.5-targetY));
   for(const row of rows){
    const tokens=lines[((row%lines.length)+lines.length)%lines.length],lastToken=tokens.at(-1);
    const lineLength=lastToken?lastToken.col+lastToken.text.length:0;
    const used=new Set((byColumn[ci].get(row)??NONE).flatMap(f=>f.glyphs.map(g=>g.col)));
    const picked:Cell[]=[];
    for(const tok of tokens)for(let k=0;k<tok.text.length&&picked.length<MAX_FRAGMENT;k++){
     const col=tok.col+k,dj=d+picked.length*STAGGER;
     if(tok.text[k]===' '||used.has(col))continue;
     // A character must already exist in the previous displayed frame and remain visible at release.
     if(visibleCell(c,cw,row,col,lineLength,dj-1/30)&&visibleCell(c,cw,row,col,lineLength,dj)){
      picked.push({ch:tok.text[k],col,kind:tok.kind});
     }
    }
    if(picked.length<2)continue;
    const y=c.top+row*lh-pos+lh*.5;
    const score=picked.length*4-Math.abs(y-targetY)/Math.max(1,span)*12-(used.size?2:0);
    if(!best||score>best.score)best={row,cells:picked,score};
   }
   if(!best)continue;
   // Shorter fragments and disjoint cells on an existing row are preferable to invisible source text.
   const glyphs=best.cells.map((g,j)=>({...g,lx:((j+.5)/best.cells.length-.5)*.86,ly:.5,bend:(((j*7+i*3)%5)/4-.5)*.5}));
   const f={column:ci,row:best.row,slot:i,start:d,glyphs};
   fragments.push(f);byColumn[ci].set(best.row,[...(byColumn[ci].get(best.row)??NONE),f]);
  }
  fragmentCache={key,columns,fragments,byColumn};
  return columns;
 }
 /** True once glyph `col` of the fragment has left its row (and until the gap closes off-screen). */
 function departed(f:Fragment,col:number,t:number){
  if(t>=GAP_END||t<f.start)return false;
  for(let j=0;j<f.glyphs.length;j++)if(f.glyphs[j].col===col)return t>=f.start+j*STAGGER;
  return false;
 }

 return(ctx,timeSeconds,viewport={width:900,height:700})=>{
  const time=Number.isFinite(timeSeconds)?Math.max(0,timeSeconds):0;
  const t=loopTime(time);
  const width=Math.max(1,Number.isFinite(viewport.width)?viewport.width:900),height=Math.max(1,Number.isFinite(viewport.height)?viewport.height:700);
  const presence=presenceAt(t);
  // Columns recede to about 22% as the panels begin folding into the triangle.
  const columnLight=1-.78*smooth((t-T.fold)/2.5);
  // Flights route around the measured copy, not a fixed centre fraction.
  const box=copyBounds(viewport.safeRects?.length?viewport.safeRects:defaultSafe(width,height),18);
  const columns=prepare(ctx,width,height);
  const fragments=fragmentCache!.fragments;

  ctx.save();
  ctx.textAlign='left';ctx.textBaseline='middle';
  if(presence>=.005)columns.forEach((c,ci)=>{
   const lines=sources[c.source],L=lines.length;
   ctx.font=fontFor(c.size);
   const cw=charWidths.get(c.size)!;
   const {lh,pos,x0,textX}=columnAt(c,cw,t);
   const gutter=textX-x0;
   const span=c.bottom-c.top,feather=Math.min(70,span*.3);
   const typeSpan=lh*2.2;
   const base=c.alpha*presence*columnLight;
   // Rows that have given characters away (at most one per slot on this column).
   const gone=fragmentCache!.byColumn[ci];
   ctx.save();
   ctx.beginPath();ctx.rect(x0-2,c.top,c.width+4,span);ctx.clip();
   const first=Math.floor(pos/lh);
   for(let r=first;r*lh-pos<=span+lh;r++){
    const y=c.top+r*lh-pos+lh*.5;
    const fade=smooth((y-c.top)/feather)*smooth((c.bottom-y)/feather);
    if(fade<.01)continue;
    const idx=((r%L)+L)%L,tokens=lines[idx];
    // Lines stream in at the bottom: characters type in across the last rows.
    const typed=clamp01((c.bottom-feather*.4-y)/typeSpan);
    const last=tokens.length?tokens[tokens.length-1]:undefined;
    const len=last?last.col+last.text.length:0;
    const visible=Math.floor(typed*len);
    const a=base*fade;
    ctx.globalAlpha=a*.55;ctx.fillStyle=COLORS[5];
    const num=String(idx+1);
    ctx.fillText(num,x0+gutter-cw*(num.length+1.2),y);
    const rowFragments=gone.get(r)??NONE;
    // Cause before effect: the source row lights up just before it gives its characters away.
    for(const f of rowFragments){
     const hl=smooth((t-f.start+.5)/.4)*(1-smooth((t-f.start-f.glyphs.length*STAGGER-.2)/.6));
     if(hl<.01)continue;
     const g0=f.glyphs[0].col,g1=f.glyphs[f.glyphs.length-1].col+1;
     ctx.globalAlpha=hl*.12*presence;ctx.fillStyle=COLORS[0];
     ctx.fillRect(x0,y-lh*.5,c.width,lh);
     ctx.globalAlpha=hl*.5*presence;ctx.fillRect(textX+g0*cw,y+c.size*.62,(g1-g0)*cw,1);
    }
    for(const tok of tokens){
     if(tok.col>=visible)break;
     const tx=textX+tok.col*cw;
     if(tx>x0+c.width)break;
     const hx=clamp01((x0+c.width-tx)/(c.width*.22));
     ctx.globalAlpha=a*hx*(tok.kind===3?.7:1);
     ctx.fillStyle=COLORS[tok.kind];
     const end=Math.min(tok.col+tok.text.length,visible);
     if(!rowFragments.length){ctx.fillText(end<tok.col+tok.text.length?tok.text.slice(0,visible-tok.col):tok.text,tx,y);continue;}
     // This row is giving characters away: draw it cell by cell and leave departed cells empty.
     for(let col=tok.col;col<end;col++){
      if(rowFragments.some(f=>departed(f,col,t)))continue;
      ctx.fillText(tok.text[col-tok.col],textX+col*cw,y);
     }
    }
    if(typed>0&&typed<1&&visible<len){
     ctx.globalAlpha=a*(.5+.5*Math.sin(time*TAU*1.5)**2);ctx.fillStyle=COLORS[0];
     ctx.fillRect(textX+visible*cw,y-c.size*.55,cw*.6,c.size*1.1);
    }
   }
   ctx.restore();
  });

  // Flights: each departed character travels from its live source cell to its slot.
  const n=heroSlots(width).length;
  for(const f of fragments){
   const c=columns[f.column],cw=charWidths.get(c.size)!;
   const d0=f.start;
   if(t<d0||t>arriveTime(f.slot,n)+.8)continue;
   ctx.font=fontFor(c.size);
   const pose=panelPose(width,height,f.slot,t);
   const cos=Math.cos(pose.rot),sin=Math.sin(pose.rot);
   f.glyphs.forEach((g,j)=>{
    const dj=d0+j*STAGGER,land=dj+FLIGHT;
    if(t<dj)return;
    // Landing spot in screen space: shear then rotate the slot-local point.
    const px=g.lx*pose.w,py=g.ly*pose.h+pose.shear*px;
    const tx=pose.x+px*cos-py*sin,ty=pose.y+px*sin+py*cos;
    if(t>=land){
     // Locked: a luminous pixel that fades as the screen's image wipes in over it.
     // Held until the whole fragment has landed, then handed to the panel's reveal.
     const k=1-smooth((t-Math.max(land,arriveTime(f.slot,n)-.2))/.8);
     ctx.globalAlpha=k*.9;ctx.fillStyle=COLORS[2];ctx.fillRect(tx-1.5,ty-1.5,3,3);
     ctx.globalAlpha=k*.15;ctx.fillStyle=COLORS[0];ctx.fillRect(tx-4,ty-4,8,8);
     return;
    }
    // Source cell at departure time, so the glyph leaves exactly where it was drawn.
    const src=columnAt(c,cw,dj),sx=src.textX+(g.col+.5)*cw,sy=c.top+f.row*src.lh-src.pos+src.lh*.5;
    // A soft trail: two earlier positions behind the head.
    for(let k=2;k>=0;k--){
     const p=(t-dj-k*.05)/FLIGHT;
     if(p<0)continue;
     const e=p<.5?2*p*p:1-2*(1-p)*(1-p);
     const {x,y}=flightPoint(sx,sy,tx,ty,g.bend,e,box);
     const scale=1-.55*e;
     ctx.save();ctx.translate(x,y);ctx.rotate(g.bend*2.4*Math.sin(Math.PI*e));ctx.scale(scale,scale);
     // Moving glyphs stay legible and slightly brighter than their source row.
     ctx.globalAlpha=Math.min(1,(k?.18/k:1)*(.7+.3*Math.sin(Math.PI*Math.min(1,p*1.4)))*Math.max(.6,c.alpha)*1.5);
     ctx.fillStyle=e>.7?COLORS[2]:COLORS[g.kind];
     ctx.fillText(g.ch,-cw/2,0);
     ctx.restore();
    }
   });
  }
  ctx.restore();
 };
}
