/** An old cached HTML page may outlive its hashed entry after a Pages deployment. */
export function appBootstrap(entry:string,base:string){
 return `const entry=${JSON.stringify(base+entry)};
try { await import(entry); }
catch (error) {
 try {
  const response=await fetch(${JSON.stringify(base+'app-entry.json')}+'?t='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw error;
  const latest=await response.json();
  if(typeof latest.file!=='string'||!/^assets\\/[a-zA-Z0-9_-]+\\.js$/.test(latest.file))throw error;
  const next=${JSON.stringify(base)}+latest.file;
  if(next===entry)throw error;
  await import(next);
 } catch (failure) {
  console.error('Unable to load site interactions',failure);
  const notice=document.createElement('div');
  notice.setAttribute('role','alert');
  notice.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:1000;padding:16px;background:#fcd228;color:#111';
  notice.textContent='Interactive controls could not load. ';
  const retry=document.createElement('button');
  retry.textContent='Reload page';
  retry.onclick=()=>location.reload();
  notice.append(retry);document.body.append(notice);
 }
}`;
}
