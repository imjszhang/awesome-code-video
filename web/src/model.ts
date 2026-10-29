import projectData from '../../data/projects.json';
import resourceData from '../../data/resources.json';
import evidenceData from '../../data/evidence.json';
import videoFormatEvidence from '../../data/video-format-evidence.json';
import videoPosters from '../../data/preview-posters.json';
import imagePosters from '../../data/image-preview-posters.json';
import MiniSearch from 'minisearch';
import { isCompletePreview, resolvePreview, type ResourcePreview } from './preview';

export type { PreviewCaption, PreviewKind, ResolvedPreview, ResourcePreview } from './preview';
export { previewCaption, previewMode, previewPlayable, previewPoster, previewUrl, resolvePreview } from './preview';

export const projects = projectData.filter(project => resourceData.some(resource => resource.project_id === project.id));
type CatalogResource = Omit<(typeof resourceData)[number], 'preview'>;
export type Resource = CatalogResource & { preview?: ResourcePreview };
function readResource(record: (typeof resourceData)[number]): Resource {
 const { preview, ...rest } = record;
 return isCompletePreview(preview) ? { ...rest, preview } : rest;
}
export const resources: Resource[] = resourceData.map(readResource);
export const evidence = evidenceData;
export const repo = 'https://github.com/imjszhang/awesome-code-video';
export const kindNames: Record<string, string> = {film:'Film',scene:'Scene',preset:'Preset',shot:'Shot recipe',style:'Visual style',framework:'Framework',tool:'Motion design tool',workflow:'Workflow',collection:'Related list',generative_prompt:'Generative prompt'};
export const kindGuides: Record<string, string> = {
 film:'An editable film project. Adapt its story, assets, scene code, and timing to your subject.',
 scene:'A self-contained scene or composition. Replace its content and integrate it into your film.',
 preset:'A parameterized example. Change the supported settings, data, labels, and timing.',
 shot:'An individual shot or motion implementation. Adapt it to your scene and timeline.',
 style:'Art direction and production instructions. You still need to create the script, assets, scene code, and render.',
 framework:'A foundation for building and rendering videos. It is not a ready-made film template.',
 tool:'A supporting library for video graphics. Integrate its output with your own animation timeline and renderer; it is not a finished-film template.',
 workflow:'A production method or agent workflow. Follow its prerequisites and provide your own content.',
 collection:'A related discovery list. Review individual resources before reusing them.',
 generative_prompt:'A copy-paste text-to-video or image-to-video prompt with an upstream model label. It is not an editable render project, and the model name is not a compatibility guarantee.'
};
export const collections = [
 {id:'product-demos',name:'Product demos',caption:'Make your next launch move.',description:'Editable product films, interface demonstrations, and focused shots for explaining what your software does.',ids:['kinetic-tech','ink-press','video-shotcraft-type-and-filter','video-shotcraft-space-camera-moves','webreel-custom-theme','webreel-drag-and-drop','webreel-mobile-viewport','guizang-product-video-skill'],symbol:'↗'},
 {id:'explainers',name:'Explainers',caption:'Give a complex idea a clear shape.',description:'Paper collage, diagrams, science scenes, and narrated workflows for turning an idea into an explanation.',ids:['paper-cut-five-layer-motion','butterfly-life','anatomy-ripple-tank','lemo-opuscar-whiteboard-explainer','lemo-opuscar-isometric-infographic','llm-explain','lemo-watercolor','lemo-teardown'],symbol:'✳'},
 {id:'maps-and-travel',name:'Maps & travel',caption:'Put your story on the map.',description:'Reusable location, flight, road-trip, and elevation configurations. Check each mode’s data and provider requirements.',ids:['map-motion-globe-to-location','map-motion-night-location','map-motion-hiking-elevation','map-motion-road-trip','map-motion-flight-routes','map-motion-radial-coverage'],symbol:'◎'},
 {id:'data-stories',name:'Data stories',caption:'Turn numbers into a narrative.',description:'Chart motion, visual systems, and information-design specifications for metrics, research, and technical stories.',ids:['hyperframes-data-chart','video-shotcraft-chart-live-moves','lemo-opuscar-data-storytelling','lemo-opuscar-blueprint','lemo-briefing-board'],symbol:'▥'},
 {id:'type-and-captions',name:'Type & captions',caption:'Make every word count.',description:'Text reveals, title cards, captions, and audio-driven compositions for creator videos and editorial sequences.',ids:['pretext','video-shotcraft-text-as-mask','video-shotcraft-paper-title-card','video-shotcraft-document-typewriter-reveal','amicro-line-reveal','remotion-tiktok','remotion-audiogram','hyperframes-yt-lower-third','lemo-opuscar-caption-news'],symbol:'Aa'},
 {id:'retro-and-playful',name:'Retro & playful',caption:'A little nostalgia. A lot of character.',description:'Pixel-world storytelling and terminal-inspired art direction for game narratives and playful technical films.',ids:['claude-quest','lemo-opuscar-16-bit-pixel-rpg','lemo-opuscar-ascii-crt-terminal','remotion-code-hike'],symbol:'⌘'}
];
export const featuredIds = ['ink-press','paper-cut-five-layer-motion','map-motion-globe-to-location','lemo-opuscar-swiss-motion-graphics','claude-quest','hyperframes-data-chart'];
/** Homepage grid: every complete preview, plus featured resources that have none. Playable files come first. */
export function homePreviewItems(list: readonly Resource[] = resources): Resource[] {
 const featured = new Set(featuredIds);
 const rank = (resource: Resource) => {
  const preview = resolvePreview(resource);
  if (preview.degraded) return 3;
  if (preview.playable) return 0;
  if (preview.mode === 'thumb_link') return 1;
  return 2;
 };
 return list.filter(resource => featured.has(resource.id) || !resolvePreview(resource).degraded).sort((a, b) => rank(a) - rank(b) || list.indexOf(a) - list.indexOf(b));
}
/** Only known animated images belong in the animation section. */
const animatedPreviewUrls = new Set(imagePosters.filter(p => p.frame_count > 1).map(p => p.source_url));
export function isYouTubePreview(resource: Resource): boolean {
 const preview = resolvePreview(resource);
 if (preview.mode !== 'embed' || !preview.url) return false;
 const url = new URL(preview.url);
 return ['www.youtube.com', 'youtube.com'].includes(url.hostname) && /^\/embed\/[\w-]{11}$/.test(url.pathname);
}
export function homePreviewGroups(list: readonly Resource[] = resources) {
 const groups: {videos: Resource[]; animations: Resource[]; other: Resource[]} = {videos: [], animations: [], other: []};
 for (const resource of homePreviewItems(list)) {
  const preview = resolvePreview(resource);
  if (preview.playable || isYouTubePreview(resource)) groups.videos.push(resource);
  else if (preview.mode === 'thumb_link' && preview.url && animatedPreviewUrls.has(preview.url)) groups.animations.push(resource);
  else groups.other.push(resource);
 }
 return groups;
}
/** The main gallery contains videos only; other media have their own sections. */
export function homeGalleryItems(list: readonly Resource[] = resources): Resource[] {
 return homePreviewGroups(list).videos;
}
export const isCore = (r:Resource) => ['film','scene','preset','shot','style'].includes(r.kind);
export const coreCount = resources.filter(isCore).length;
export const projectFor = (r:Resource) => projects.find(p=>p.id===r.project_id)!;
export const collectionsFor = (r:Resource) => collections.filter(c=>c.ids.includes(r.id));
export function palette(r:Resource) {
 if (r.id.includes('pixel') || r.id.includes('quest') || r.id.includes('ascii')) return 'pixel';
 if (r.kind==='preset') return 'map';
 if (/paper|ink|watercolor|halftone/.test(r.id)) return 'paper';
 if (/chart|data|briefing/.test(r.id)) return 'chart';
 if (/dark|blueprint|framework/.test(r.id+' '+r.kind)) return 'dark';
 return 'type';
}
export const galleryLinks:Record<string,string> = {
 'kinetic-tech':'https://motiontemplates.github.io/385712/',
 'motiongit-all':'https://motiontemplates.github.io/all/',
 'video-shotcraft':'https://vincentwei1021.github.io/video-shotcraft/',
 'lemo-opuscar':'https://lemomo-ai.github.io/lemo-opuscar/',
 'webreel':'https://webreel.dev/examples',
};
export function resourceMeta(r:Resource) {
 return [kindNames[r.kind],projectFor(r).name,...collectionsFor(r).map(c=>c.name)].join(' · ');
}
const index = new MiniSearch({fields:['name','description','project','topics'],storeFields:['id'],searchOptions:{prefix:true,fuzzy:0.15,boost:{name:3,topics:2}}});
index.addAll(resources.map(r=>({...r,project:projectFor(r).name,topics:collectionsFor(r).map(c=>c.name).join(' ')})));
export function filterResources({q='',kind='',project='',use='',sort='curated'}:Record<string,string>) {
 const matches = q.trim() ? index.search(q.trim()) : null;
 const scores = new Map(matches?.map((r,i)=>[r.id,i]));
 let out = resources.filter(r=>(!matches || scores.has(r.id)) && (!kind || r.kind===kind) && (!project || r.project_id===project) && (!use || collections.find(c=>c.id===use)?.ids.includes(r.id)));
 if (sort==='name') out=[...out].sort((a,b)=>a.name.localeCompare(b.name));
 else if(matches) out=[...out].sort((a,b)=>scores.get(a.id)!-scores.get(b.id)!);
 return out;
}
export type Route = {type:'home'|'library'|'projects'|'collections'|'about'|'saved'|'notfound'} | {type:'resource'|'project'|'collection',id:string};
export function routeForPath(path:string,base='/'):Route {
 if(!path.startsWith(base)) return {type:'notfound'};
 const parts=path.slice(base.length).replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
 if(!parts.length)return {type:'home'};
 if(parts.length===1 && ['library','projects','collections','about','saved'].includes(parts[0]))return {type:parts[0] as 'library'};
 if(parts.length===2){
  const [section,id]=parts;
  if(section==='resources' && resources.some(r=>r.id===id))return {type:'resource',id};
  if(section==='projects' && projects.some(p=>p.id===id))return {type:'project',id};
  if(section==='collections' && collections.some(c=>c.id===id))return {type:'collection',id};
 }
 return {type:'notfound'};
}
export function allPaths(){return ['','library/','projects/','collections/','about/','saved/',...resources.map(r=>`resources/${r.id}/`),...projects.map(p=>`projects/${p.id}/`),...collections.map(c=>`collections/${c.id}/`)];}
export function pageMeta(route:Route){
 if(route.type==='resource'){const r=resources.find(r=>r.id===route.id)!;return {title:`${r.name} — ${kindNames[r.kind]} | Awesome Code Video`,description:r.description};}
 if(route.type==='project'){const p=projects.find(p=>p.id===route.id)!;return {title:`${p.name} Resources | Awesome Code Video`,description:`Explore selected ${p.name} resources, reuse notes, and reviewed source links for making videos with code.`};}
 if(route.type==='collection'){const c=collections.find(c=>c.id===route.id)!;return {title:`${c.name} for Videos Made with Code | Awesome Code Video`,description:c.description};}
 const names:Record<string,string>={home:'Awesome Code Video — Styles, Shots & Templates',library:'Explore the Library | Awesome Code Video',projects:'Source Projects | Awesome Code Video',collections:'Video Use Cases | Awesome Code Video',about:'How We Curate | Awesome Code Video',saved:'Your Saved Resources | Awesome Code Video',notfound:'Page Not Found | Awesome Code Video'};
 const descriptions:Record<string,string>={
  home:'Discover curated video templates, visual styles, shot recipes, and workflows for making videos with code. Find the source and understand what to reuse.',
  library:'Search video templates, visual styles, shot recipes, and tools. Filter by resource type, source project, or use case to find your next starting point.',
  projects:'Explore the creators and projects behind the catalog, from video frameworks to reusable scenes, with reviewed links to each original source.',
  collections:'Browse curated resources for product demos, explainers, maps, data stories, captions, and playful films. Start with the kind of video you want to make.',
  about:'Learn how Awesome Code Video selects resources, checks sources, and explains reuse, previews, licensing, and review limits.',
  saved:'Revisit the video resources you saved in this browser. Your shortlist stays on this device and does not require an account.',
  notfound:'This page could not be found. Browse the Awesome Code Video library to discover templates, styles, shots, and original sources.'
 };
 return {title:names[route.type],description:descriptions[route.type]};
}

export type VideoOrientation = 'landscape' | 'portrait' | 'square' | 'unknown';
/** Match the measured media URL so replaced previews cannot inherit stale dimensions. */
export function videoOrientation(resource: Resource): VideoOrientation {
 const metadata = videoPosters.find(p => p.resource_id === resource.id && p.source_url === resource.preview?.url);
 const evidence = videoFormatEvidence.find(p => p.resource_id === resource.id && p.preview_url === resource.preview?.url);
 const width = metadata?.source_width ?? evidence?.composition_width;
 const height = metadata?.source_height ?? evidence?.composition_height;
 if (!width || !height || width <= 0 || height <= 0) return 'unknown';
 return width > height ? 'landscape' : width < height ? 'portrait' : 'square';
}
