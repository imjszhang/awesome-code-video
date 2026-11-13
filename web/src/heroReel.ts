/**
 * The homepage reel: a six-second title sequence where every frame is a pure
 * function of its frame number. Nothing here keeps state between frames, so the
 * hero can play, pause, loop and scrub to any frame and always draw the same image.
 */
export const REEL_FPS=30;
/** Logical drawing size; the canvas scales this 16:9 space to its CSS box. */
export const REEL_WIDTH=960;
export const REEL_HEIGHT=540;

export const REEL_SHOTS=[
 {id:'type',frames:45},
 {id:'chart',frames:45},
 {id:'route',frames:45},
 {id:'title',frames:45},
] as const;
export type ReelShotId=(typeof REEL_SHOTS)[number]['id'];
export const REEL_FRAMES=REEL_SHOTS.reduce((sum,shot)=>sum+shot.frames,0);
/** A composed frame for reduced motion, the static fallback and the first server render. */
export const REEL_STILL_FRAME=165;

/**
 * The listing shown beside the stage. It is a simplified sketch of this module:
 * one call per shot, in playback order. `shot` ties a line to REEL_SHOTS.
 */
export type ReelToken={text:string,tone?:'comment'|'keyword'|'call'|'string'|'number'};
export const REEL_LISTING:{tokens:ReelToken[],shot?:ReelShotId}[]=[
 {tokens:[{text:'// a frame is a function of time',tone:'comment'}]},
 {tokens:[{text:'export const ',tone:'keyword'},{text:'fps = '},{text:'30',tone:'number'}]},
 {tokens:[{text:'export const ',tone:'keyword'},{text:'frames = '},{text:'180',tone:'number'}]},
 {tokens:[]},
 {tokens:[{text:'export default ',tone:'keyword'},{text:'sequence',tone:'call'},{text:'('}]},
 {shot:'type',tokens:[{text:'  '},{text:'type',tone:'call'},{text:'('},{text:"'Good code.'",tone:'string'},{text:'),'}]},
 {shot:'chart',tokens:[{text:'  '},{text:'chart',tone:'call'},{text:'(['},{text:'28, 46, 39, 72, 98',tone:'number'},{text:']),'}]},
 {shot:'route',tokens:[{text:'  '},{text:'route',tone:'call'},{text:'('},{text:"'SFO'",tone:'string'},{text:', '},{text:"'HND'",tone:'string'},{text:'),'}]},
 {shot:'title',tokens:[{text:'  '},{text:'title',tone:'call'},{text:'('},{text:"'Great video.'",tone:'string'},{text:'),'}]},
 {tokens:[{text:')'}]},
];

/** Any number maps onto the loop, so callers can pass an ever-growing frame count. */
export function wrapFrame(frame:number):number{
 if(!Number.isFinite(frame))return 0;
 return ((Math.floor(frame)%REEL_FRAMES)+REEL_FRAMES)%REEL_FRAMES;
}
export function shotAt(frame:number):{index:number,id:ReelShotId,frame:number,start:number}{
 const f=wrapFrame(frame);
 let start=0;
 for(const [index,shot] of REEL_SHOTS.entries()){
  if(f<start+shot.frames)return {index,id:shot.id,frame:f-start,start};
  start+=shot.frames;
 }
 // Unreachable: wrapFrame keeps f below REEL_FRAMES.
 return {index:0,id:REEL_SHOTS[0].id,frame:0,start:0};
}
const two=(value:number)=>String(value).padStart(2,'0');
/** minutes:seconds:frames, the way an editor's timeline counts. */
export function timecode(frame:number):string{
 const f=wrapFrame(frame);
 const seconds=Math.floor(f/REEL_FPS);
 return `${two(Math.floor(seconds/60))}:${two(seconds%60)}:${two(f%REEL_FPS)}`;
}

export const clamp01=(value:number)=>Math.min(1,Math.max(0,value));
export const easeOutCubic=(t:number)=>1-(1-clamp01(t))**3;
export const easeOutExpo=(t:number)=>{const x=clamp01(t);return x===1?1:1-2**(-10*x);};
export const easeInOutCubic=(t:number)=>{const x=clamp01(t);return x<.5?4*x*x*x:1-(-2*x+2)**3/2;};
/** A lightly under-damped spring: 0 at rest, settles on 1 with one small overshoot. */
export const spring=(t:number)=>{const x=clamp01(t);return x===1?1:1-Math.exp(-6.5*x)*Math.cos(7.5*x);};

/** How many characters of the typed line are on screen at a shot-local frame. */
export const TYPED_LINE='Good code.';
export function typedCount(frame:number):number{
 return Math.min(TYPED_LINE.length,Math.max(0,Math.floor((frame-5)/2)));
}
export const CHART_VALUES=[28,46,39,72,98];
/** Public resource count drawn in the chart shot. Matches the filtered catalog, not the retained inventory. */
export const CHART_TOTAL=293;
export const ROUTE_KM=8270;
/** Point on the quadratic flight path at t in [0,1]. */
export const ROUTE={from:{x:176,y:398},via:{x:440,y:74},to:{x:786,y:196}};
export function routePoint(t:number){
 const u=1-t,{from,via,to}=ROUTE;
 return {x:u*u*from.x+2*u*t*via.x+t*t*to.x,y:u*u*from.y+2*u*t*via.y+t*t*to.y};
}

const INK='#0e0e10',PAPER='#ece8df',CHALK='#f1eee7',PLAYHEAD='#fcd228';
const DISPLAY='"Space Grotesk Variable", Arial, sans-serif';
const MONO='"JetBrains Mono Variable", ui-monospace, Menlo, monospace';
export const REEL_FONTS=[`700 118px ${DISPLAY}`,`500 96px ${MONO}`];

type Ctx=CanvasRenderingContext2D;

function drawType(ctx:Ctx,f:number){
 ctx.fillStyle=INK;ctx.fillRect(0,0,REEL_WIDTH,REEL_HEIGHT);
 ctx.font=`500 96px ${MONO}`;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 const advance=ctx.measureText('0').width;
 const left=(REEL_WIDTH-advance*(TYPED_LINE.length+1))/2;
 const count=typedCount(f);
 ctx.fillStyle=CHALK;
 ctx.fillText(TYPED_LINE.slice(0,count),left,304);
 // The caret stays solid while typing, then blinks on a steady eight-frame beat.
 const typing=count<TYPED_LINE.length;
 if(typing||Math.floor(f/8)%2===0){
  ctx.fillStyle=PLAYHEAD;
  ctx.fillRect(left+advance*count+6,216,advance*.62,104);
 }
}

function drawChart(ctx:Ctx,f:number){
 ctx.fillStyle=PAPER;ctx.fillRect(0,0,REEL_WIDTH,REEL_HEIGHT);
 ctx.textBaseline='alphabetic';ctx.textAlign='left';
 ctx.fillStyle='#18181a';
 ctx.font=`700 164px ${DISPLAY}`;
 ctx.fillText(String(Math.round(CHART_TOTAL*easeOutCubic((f-3)/30))),66,300);
 ctx.font=`500 23px ${MONO}`;ctx.fillStyle='#5d5a52';
 ctx.fillText('curated resources',76,350);
 const base=452,full=318,width=58,gap=24,left=496,top=Math.max(...CHART_VALUES);
 CHART_VALUES.forEach((value,index)=>{
  const height=value/top*full*spring((f-5-index*3)/24);
  const x=left+index*(width+gap);
  const last=index===CHART_VALUES.length-1;
  ctx.fillStyle=last?PLAYHEAD:'#18181a';
  ctx.fillRect(x,base-height,width,height);
  if(last&&height>4){ctx.lineWidth=4;ctx.strokeStyle='#18181a';ctx.strokeRect(x+2,base-height+2,width-4,height-2);}
 });
 ctx.fillStyle='#18181a';ctx.fillRect(left-22,base,CHART_VALUES.length*(width+gap)-gap+44,4);
}

function drawRoute(ctx:Ctx,f:number){
 ctx.fillStyle=INK;ctx.fillRect(0,0,REEL_WIDTH,REEL_HEIGHT);
 ctx.fillStyle='rgba(241,238,231,.13)';
 for(let y=30;y<REEL_HEIGHT;y+=40)for(let x=40;x<REEL_WIDTH;x+=40)ctx.fillRect(x-1.5,y-1.5,3,3);
 const progress=easeInOutCubic((f-4)/31);
 const trace=(to:number)=>{ctx.beginPath();for(let i=0;i<=64;i++){const p=routePoint(to*i/64);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}};
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.setLineDash([2,14]);ctx.lineWidth=4;ctx.strokeStyle='rgba(241,238,231,.3)';trace(1);ctx.stroke();
 ctx.setLineDash([]);ctx.lineWidth=6;ctx.strokeStyle=PLAYHEAD;trace(progress);ctx.stroke();
 const {from,to}=ROUTE,head=routePoint(progress);
 const arrive=spring((f-34)/10);
 const pin=(p:{x:number,y:number},label:string,scale:number,below:boolean)=>{
  ctx.fillStyle=INK;ctx.strokeStyle=CHALK;ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(p.x,p.y,13*scale,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=CHALK;ctx.font=`500 26px ${MONO}`;ctx.textAlign='center';
  ctx.fillText(label,p.x,below?p.y+54:p.y-32);
 };
 pin(from,'SFO',1,true);
 pin(to,'HND',.55+.45*arrive,false);
 ctx.fillStyle=PLAYHEAD;ctx.beginPath();ctx.arc(head.x,head.y,9,0,Math.PI*2);ctx.fill();
 ctx.textAlign='left';ctx.fillStyle=CHALK;ctx.font=`700 60px ${DISPLAY}`;
 ctx.fillText(`${Math.round(ROUTE_KM*progress).toLocaleString('en-US')} km`,66,112);
}

function drawTitle(ctx:Ctx,f:number){
 ctx.fillStyle=INK;ctx.fillRect(0,0,REEL_WIDTH,REEL_HEIGHT);
 ctx.font=`700 118px ${DISPLAY}`;ctx.textBaseline='alphabetic';ctx.textAlign='left';
 const words='Great video',wordsWidth=ctx.measureText(words).width,dot=ctx.measureText('.').width;
 const left=(REEL_WIDTH-wordsWidth-dot)/2,rise=(1-easeOutExpo((f-2)/16))*150;
 ctx.save();
 // The line rises from behind its own baseline, the classic mask-up reveal.
 ctx.beginPath();ctx.rect(0,178,REEL_WIDTH,150);ctx.clip();
 ctx.fillStyle=CHALK;ctx.fillText(words,left,300+rise);
 ctx.fillStyle=PLAYHEAD;ctx.fillText('.',left+wordsWidth,300+rise);
 ctx.restore();
 const track=wordsWidth+dot,played=clamp01((f-8)/34);
 ctx.fillStyle='rgba(241,238,231,.16)';ctx.fillRect(left,372,track,6);
 ctx.fillStyle=PLAYHEAD;ctx.fillRect(left,372,track*played,6);
}

const DRAW:Record<ReelShotId,(ctx:Ctx,frame:number)=>void>={type:drawType,chart:drawChart,route:drawRoute,title:drawTitle};

/** Draw one frame into a context whose transform already maps the logical 960×540 space. */
export function drawReelFrame(ctx:Ctx,frame:number):void{
 const shot=shotAt(frame);
 ctx.save();
 DRAW[shot.id](ctx,shot.frame);
 ctx.restore();
}
