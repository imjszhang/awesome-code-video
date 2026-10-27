import projectData from '../../data/projects.json';
import resourceData from '../../data/resources.json';
import evidenceData from '../../data/evidence.json';
import MiniSearch from 'minisearch';

export const projects = projectData;
export const resources = resourceData;
export const evidence = evidenceData;
export type Resource = typeof resources[number];
export const repo = 'https://github.com/imjszhang/awesome-code-video';
export const kindNames: Record<string, string> = {film:'Film',scene:'Scene',preset:'Preset',shot:'Shot recipe',style:'Visual style',framework:'Framework',tool:'Motion design tool',workflow:'Workflow',collection:'Related list'};
export const kindGuides: Record<string, string> = {
 film:'An editable film project. Adapt its story, assets, scene code, and timing to your subject.',
 scene:'A self-contained scene or composition. Replace its content and integrate it into your film.',
 preset:'A parameterized example. Change the supported settings, data, labels, and timing.',
 shot:'An individual shot or motion implementation. Adapt it to your scene and timeline.',
 style:'Art direction and production instructions. You still need to create the script, assets, scene code, and render.',
 framework:'A foundation for building and rendering videos. It is not a ready-made film template.',
 tool:'A supporting library for video graphics. Integrate its output with your own animation timeline and renderer; it is not a finished-film template.',
 workflow:'A production method or agent workflow. Follow its prerequisites and provide your own content.',
 collection:'A related discovery list. Review individual resources before reusing them.'
};
export const collections = [
 {id:'product-demos',name:'Product demos',caption:'Make your next launch move.',description:'Editable product films, interface demonstrations, and focused shots for explaining what your software does.',ids:['ink-press','video-shotcraft-type-and-filter','video-shotcraft-space-camera-moves','webreel-custom-theme','webreel-drag-and-drop','webreel-mobile-viewport','onetake','guizang-product-video-skill'],symbol:'↗'},
 {id:'explainers',name:'Explainers',caption:'Give a complex idea a clear shape.',description:'Paper collage, diagrams, science scenes, and narrated workflows for turning an idea into an explanation.',ids:['paper-cut-five-layer-motion','butterfly-life','anatomy-ripple-tank','lemo-opuscar-whiteboard-explainer','lemo-opuscar-isometric-infographic','llm-explain','lemo-watercolor','lemo-teardown'],symbol:'✳'},
 {id:'maps-and-travel',name:'Maps & travel',caption:'Put your story on the map.',description:'Reusable location, flight, road-trip, and elevation configurations. Check each mode’s data and provider requirements.',ids:['map-motion-globe-to-location','map-motion-night-location','map-motion-hiking-elevation','map-motion-road-trip','map-motion-flight-routes','map-motion-radial-coverage'],symbol:'◎'},
 {id:'data-stories',name:'Data stories',caption:'Turn numbers into a narrative.',description:'Chart motion, visual systems, and information-design specifications for metrics, research, and technical stories.',ids:['hyperframes-data-chart','video-shotcraft-chart-live-moves','lemo-opuscar-data-storytelling','lemo-opuscar-blueprint','lemo-briefing-board'],symbol:'▥'},
 {id:'type-and-captions',name:'Type & captions',caption:'Make every word count.',description:'Text reveals, title cards, captions, and audio-driven compositions for creator videos and editorial sequences.',ids:['pretext','video-shotcraft-text-as-mask','video-shotcraft-paper-title-card','video-shotcraft-document-typewriter-reveal','amicro-line-reveal','remotion-tiktok','remotion-audiogram','hyperframes-yt-lower-third','lemo-opuscar-caption-news'],symbol:'Aa'},
 {id:'retro-and-playful',name:'Retro & playful',caption:'A little nostalgia. A lot of character.',description:'Pixel-world storytelling and terminal-inspired art direction for game narratives and playful technical films.',ids:['claude-quest','lemo-opuscar-16-bit-pixel-rpg','lemo-opuscar-ascii-crt-terminal','remotion-code-hike'],symbol:'⌘'}
];
export const featuredIds = ['ink-press','paper-cut-five-layer-motion','map-motion-globe-to-location','lemo-opuscar-swiss-motion-graphics','claude-quest','hyperframes-data-chart'];
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
 return {title:names[route.type],description:'Discover curated video templates, visual styles, shot recipes, and workflows for making videos with code. Find the source and understand what to reuse.'};
}
