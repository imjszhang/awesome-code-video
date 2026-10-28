import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {allPaths,collections,pageMeta,projects,resources,routeForPath} from '../web/src/model';
import {pageSeoHead,pageStructuredData,robotsTxt} from '../web/src/seo';

const site=new URL('https://awesomecodevideo.com');
const head=(path:string,indexable=true,base='/')=>pageSeoHead(routeForPath(base+path,base),{site,base,path,indexable});
const jsonLd=(html:string)=>[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match=>JSON.parse(match[1]));

test('every generated route keeps its canonical while unknown pages have none',()=>{
 for(const path of allPaths()){
  const html=head(path);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,path);
  assert(html.includes(`<link rel="canonical" href="${new URL(path,site).href}">`),path);
 }
 assert(!head('404.html').includes('rel="canonical"'));
 assert.match(head('404.html'),/name="robots" content="noindex,nofollow"/);
 assert.match(head('resources/ink-press/',true,'/catalog/'),/href="https:\/\/awesomecodevideo.com\/catalog\/resources\/ink-press\/"/);
});

test('private shortlist is crawlable but excluded from indexing; preview remains blocked',()=>{
 assert.match(head('saved/'),/name="robots" content="noindex,follow"/);
 assert.equal(robotsTxt(true,site),'User-agent: *\nAllow: /\nSitemap: https://awesomecodevideo.com/sitemap.xml\n');
 for(const path of ['', 'library/', 'saved/', 'resources/ink-press/'])assert.match(head(path,false),/name="robots" content="noindex,nofollow"/);
 assert.equal(robotsTxt(false,null),'User-agent: *\nDisallow: /\n');
});

test('public base pages describe their own content instead of sharing one description',()=>{
 const paths=['','library/','projects/','collections/','about/'];
 const descriptions=paths.map(path=>pageMeta(routeForPath('/'+path)).description);
 assert.equal(new Set(descriptions).size,paths.length);
 for(const description of descriptions)assert(description.length>50);
});

test('resource breadcrumbs resolve to its library, source project and actual detail page',()=>{
 for(const resource of resources){
  const project=projects.find(item=>item.id===resource.project_id)!;
  const [breadcrumb]=jsonLd(head(`resources/${resource.id}/`));
  assert.equal(breadcrumb['@type'],'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map((item:{name:string;item:string})=>({name:item.name,url:item.item})),[
   {name:'Library',url:new URL('library/',site).href},
   {name:project.name,url:new URL(`projects/${project.id}/`,site).href},
   {name:resource.name,url:new URL(`resources/${resource.id}/`,site).href}
  ]);
 }
});

test('collection lists contain exactly their visible resources in curated order',()=>{
 const validPaths=new Set(allPaths());
 for(const collection of collections){
  const nodes=jsonLd(head(`collections/${collection.id}/`));
  const list=nodes.find(node=>node['@type']==='ItemList');
  assert.equal(list.numberOfItems,collection.ids.length);
  assert.deepEqual(list.itemListElement.map((item:{url:string;position:number;name:string})=>{
   const path=new URL(item.url).pathname.slice(1);
   assert(validPaths.has(path));
   return {id:path.split('/')[1],position:item.position,name:item.name};
  }),collection.ids.map((id,index)=>({id,position:index+1,name:resources.find(resource=>resource.id===id)!.name})));
  const breadcrumb=nodes.find(node=>node['@type']==='BreadcrumbList');
  assert.equal(breadcrumb.itemListElement[0].name,'Use cases');
  assert.equal(breadcrumb.itemListElement[1].item,new URL(`collections/${collection.id}/`,site).href);
 }
});

test('catalog markup makes no unverified video or search-action claims',()=>{
 for(const path of allPaths()){
  const data=JSON.stringify(pageStructuredData(routeForPath('/'+path),site));
  assert(!data.includes('VideoObject'),path);
  assert(!data.includes('SearchAction'),path);
 }
 assert.deepEqual(pageStructuredData({type:'saved'},site),[]);
 assert.deepEqual(pageStructuredData({type:'notfound'},site),[]);
});

test('social cards use an existing absolute brand image and support subpath deployments',async()=>{
 const asset=await stat(new URL('../web/public/art/code-in-motion.webp',import.meta.url));
 assert(asset.isFile()&&asset.size>0);
 const html=head('library/',true,'/catalog/');
 assert.match(html,/property="og:image" content="https:\/\/awesomecodevideo.com\/catalog\/art\/code-in-motion.webp"/);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.match(html,/name="twitter:image" content="https:\/\/awesomecodevideo.com\/catalog\/art\/code-in-motion.webp"/);
 assert.match(html,/Black and gold film ribbon illustration/);
});
