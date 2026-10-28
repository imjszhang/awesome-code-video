import {collections,pageMeta,projects,resources,type Route} from './model';

type StructuredNode = Record<string,unknown>;
type SeoOptions = {site:URL|null;base:string;path:string;indexable:boolean};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

/** Structured data describes the visible catalog, not upstream video ownership or render results. */
export function pageStructuredData(route:Route,site:URL,base='/'):StructuredNode[]{
 const url=(path='')=>new URL(base+path,site).href;
 const breadcrumbs=(items:{name:string;path:string}[]):StructuredNode=>({
  '@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:url(item.path)}))
 });
 if(route.type==='home')return [{
  '@context':'https://schema.org','@type':'WebSite',
  '@id':url()+'#website',name:'Awesome Code Video',url:url(),description:pageMeta(route).description
 }];
 if(route.type==='resource'){
  const resource=resources.find(item=>item.id===route.id)!;
  const project=projects.find(item=>item.id===resource.project_id)!;
  return [breadcrumbs([
   {name:'Library',path:'library/'},
   {name:project.name,path:`projects/${project.id}/`},
   {name:resource.name,path:`resources/${resource.id}/`}
  ])];
 }
 if(route.type==='project'){
  const project=projects.find(item=>item.id===route.id)!;
  return [breadcrumbs([{name:'Projects',path:'projects/'},{name:project.name,path:`projects/${project.id}/`}])];
 }
 if(route.type==='collection'){
  const collection=collections.find(item=>item.id===route.id)!;
  return [
   breadcrumbs([{name:'Use cases',path:'collections/'},{name:collection.name,path:`collections/${collection.id}/`}]),
   {
    '@context':'https://schema.org','@type':'ItemList',
    '@id':url(`collections/${collection.id}/`)+'#resources',
    name:collection.name,description:collection.description,
    numberOfItems:collection.ids.length,
    itemListElement:collection.ids.map((id,index)=>({
     '@type':'ListItem',position:index+1,
     name:resources.find(resource=>resource.id===id)!.name,
     url:url(`resources/${id}/`)
    }))
   }
  ];
 }
 return [];
}

export function pageSeoHead(route:Route,{site,base,path,indexable}:SeoOptions):string{
 const meta=pageMeta(route);
 // A crawler must be allowed to fetch /saved/ to see this noindex directive.
 const robots=!indexable?'noindex,nofollow':route.type==='saved'?'noindex,follow':route.type==='notfound'?'noindex,nofollow':'index,follow';
 const canonical=site&&route.type!=='notfound'?new URL(base+path,site).href:null;
 const image=site?new URL(base+'art/code-in-motion.webp',site).href:null;
 const imageAlt='Black and gold film ribbon illustration for Awesome Code Video';
 const tags=[
  `<title>${escapeHtml(meta.title)}</title>`,
  `<meta name="description" content="${escapeHtml(meta.description)}">`,
  `<meta name="robots" content="${robots}">`,
  ...(canonical?[`<link rel="canonical" href="${escapeHtml(canonical)}">`,`<meta property="og:url" content="${escapeHtml(canonical)}">`]:[]),
  '<meta property="og:type" content="website">',
  '<meta property="og:site_name" content="Awesome Code Video">',
  `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
  `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
  `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
  ...(image?[
   `<meta property="og:image" content="${escapeHtml(image)}">`,
   '<meta property="og:image:type" content="image/webp">',
   '<meta property="og:image:width" content="1536">',
   '<meta property="og:image:height" content="1024">',
   `<meta property="og:image:alt" content="${imageAlt}">`,
   `<meta name="twitter:image" content="${escapeHtml(image)}">`,
   `<meta name="twitter:image:alt" content="${imageAlt}">`
  ]:[]),
  ...(site?pageStructuredData(route,site,base).map(node=>`<script type="application/ld+json">${JSON.stringify(node).replace(/</g,'\\u003c')}</script>`):[])
 ];
 return tags.join('');
}

export function robotsTxt(indexable:boolean,site:URL|null,base='/'):string{
 if(!indexable)return 'User-agent: *\nDisallow: /\n';
 if(!site)throw new Error('Indexing requires a site origin.');
 return `User-agent: *\nAllow: /\nSitemap: ${new URL(base+'sitemap.xml',site).href}\n`;
}
