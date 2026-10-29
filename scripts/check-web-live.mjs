import assert from 'node:assert/strict';

const origin=new URL(process.argv[2]||'https://awesomecodevideo.com/');
const release=process.env.GITHUB_SHA;
async function read(path,status=200){
 const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-cache'}});
 assert.equal(response.status,status,`${path}: expected HTTP ${status}`);
 return response.text();
}
async function check(){
 const [home,robots,sitemap,saved,missing]=await Promise.all([
  read('/'),read('/robots.txt'),read('/sitemap.xml'),read('/saved/'),read('/__site_health_missing__/',404),
 ]);
 const entry=JSON.parse(await read('/app-entry.json'));
 assert.match(entry.file,/^assets\/[a-zA-Z0-9_-]+\.js$/);
 assert.ok(home.includes(entry.file),'HTML and entry manifest agree');
 await read('/'+entry.file);
 assert.match(home,/<meta name="robots" content="index,follow">/);
 assert.ok(home.includes(`<link rel="canonical" href="${origin.origin}/">`),'Homepage canonical');
 assert.match(home,/<meta property="og:image" content="https:\/\//);
 assert.match(home,/<meta name="twitter:card" content="summary_large_image">/);
 if(release)assert.ok(home.includes(`<meta name="site-release" content="${release}">`),'Latest release is not public yet');
 assert.ok(robots.includes(`Sitemap: ${origin.origin}/sitemap.xml`),'Sitemap advertised');
 assert.doesNotMatch(robots,/Disallow:\s*\/(?:saved\/)?\s*(?:\n|$)/);
 assert.match(saved,/<meta name="robots" content="noindex,follow">/);
 assert.match(missing,/<meta name="robots" content="noindex/);
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.ok(urls.length>0,'Nonempty sitemap');
 assert.ok(urls.every(url=>url.startsWith(`${origin.origin}/`)&&!url.includes('/saved/')&&!url.includes('?')),'Only canonical public URLs');
 const resource=urls.find(url=>url.includes('/resources/'));
 const collection=urls.find(url=>url.includes('/collections/')&&url!==`${origin.origin}/collections/`);
 assert.ok(resource&&collection,'Resource and collection URLs in sitemap');
 const [detail,list,about]=await Promise.all([read(new URL(resource).pathname),read(new URL(collection).pathname),read('/about/')]);
 assert.match(detail,/BreadcrumbList/);assert.match(list,/ItemList/);
 assert.match(about,/id="privacy"/);
 console.log(`Public website passed: ${urls.length} sitemap URLs; canonical, indexing, structured data, privacy and HTTP status checks.`);
}
const attempts=process.env.CI?8:1;
for(let attempt=1;attempt<=attempts;attempt++){
 try{await check();break;}
 catch(error){
  if(attempt===attempts)throw error;
  console.log(`Public release not ready (${attempt}/${attempts}): ${error.message}`);
  await new Promise(resolve=>setTimeout(resolve,15000));
 }
}
