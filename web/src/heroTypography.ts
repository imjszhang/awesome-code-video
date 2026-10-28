import type {LayoutCursor} from '@chenglou/pretext';
import type {HeroSceneViewport} from './heroScene';

const CODE_FONT='400 13px "JetBrains Mono Variable", monospace';
const SOURCE_TEXT=[
 'const scene = compose({',
 'palette: [gold, ink],',
 'frame: (time) => {',
 'const orbit = sin(time);',
 'const story = idea.map(draw);',
 'return render(story, orbit);',
 '}, });',
 'scene.play();',
 'const motion = frame => transform(frame);',
 'source → sequence → scene;',
].join(' ');
const OUTPUT_TEXT=[
 'export const frame = {',
 'source: imagination,',
 'duration: Infinity,',
 'render: (scene, time) => {',
 'const path = trace(time);',
 'return compose(scene, path);',
 '}, };',
 'frame.render();',
 'idea → sequence → motion;',
].join(' ');
const smooth=(value:number)=>{
 const t=Math.max(0,Math.min(1,value));
 return t*t*(3-2*t);
};

/**
 * Fonts are prepared once after loading. Each row then uses arithmetic-only
 * Pretext layout to follow the moving edge of the scene's negative space.
 * Typography lives at the periphery; the central HTML heading owns the stage.
 */
export async function createHeroTypography():Promise<(ctx:CanvasRenderingContext2D,timeSeconds:number,viewport?:HeroSceneViewport)=>void>{
 const {prepareWithSegments,layoutNextLine}=await import('@chenglou/pretext');
 const preparedCode=[prepareWithSegments(SOURCE_TEXT,CODE_FONT),prepareWithSegments(OUTPUT_TEXT,CODE_FONT)];

 return(ctx,timeSeconds,viewport={width:900,height:700})=>{
  const time=Number.isFinite(timeSeconds)?Math.max(0,timeSeconds):0;
  const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height);
  // Small screens retain the full animation without threading microtype
  // through the primary copy or its touch targets.
  if(width<760)return;
  // Code streams arrive once the PLAY triangle has mostly drawn, over seconds 2–4.
  const reveal=smooth((time-2)/2);
  if(reveal<.001)return;
  ctx.save();
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font=CODE_FONT;
  const margin=Math.max(28,Math.min(54,width*.035));
  const columnWidth=Math.min(220,width*.19-margin);
  // Mirrors heroScene's desktop triangle: circumradius R about (cx, cy), shifted
  // right by 0.08R, so the left edge sits at cx-0.42R and the apex at cx+1.08R.
  const cx=width*.5,cy=height*.47;
  const R=Math.min(width*.34,height*.52);
  const halfHeight=R*.866;
  for(let side=0;side<2;side++){
   let cursor:LayoutCursor={segmentIndex:0,graphemeIndex:0};
   const top=height*(side===0?.24:.29);
   for(let row=0;row<12;row++){
    const y=top+row*19;
    const dy=Math.abs(y-5-cy);
    // Horizontal span of the triangle (plus its glow) on this row, if any.
    const inside=dy<halfHeight+12;
    const triLeft=cx-R*.42;
    const triRight=cx+R*1.08-Math.min(dy,halfHeight)/halfHeight*R*1.5;
    const columnLeft=side===0?margin:width-margin-columnWidth;
    const columnRight=columnLeft+columnWidth;
    const start=side===0||!inside?columnLeft:Math.max(columnLeft,triRight+24);
    const end=side===0&&inside?Math.min(columnRight,triLeft-24):columnRight;
    const availableWidth=end-start;
    if(availableWidth<64)continue;
    const line=layoutNextLine(preparedCode[side],availableWidth,cursor);
    if(!line)break;
    cursor=line.end;
    const sweep=Math.max(0,1-Math.abs(row-((time*.5+side*7)%17-2))/2.8);
    const alpha=((width<1000?.09:.15)+sweep*.13)*reveal;
    ctx.fillStyle=`rgba(206,184,112,${alpha.toFixed(3)})`;
    ctx.fillText(line.text,start,y);
   }
  }
  ctx.restore();
 };
}
