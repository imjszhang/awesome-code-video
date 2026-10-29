import test from 'node:test';
import assert from 'node:assert/strict';
import {appBootstrap} from '../scripts/lib/web-bootstrap';

async function run(initialFails:boolean,latest='assets/new.js',latestFails=false){
 const imports:string[]=[],requests:string[]=[],notices:any[]=[];
 const document={createElement:()=>({textContent:'',style:{cssText:''},setAttribute(){},append(){}}),body:{append(node:unknown){notices.push(node);}}};
 const execute=new Function('load','fetch','document','console','location',`return (async()=>{${appBootstrap('assets/old.js','/gallery/').replaceAll('import(', 'load(')}})()`);
 await execute(async(url:string)=>{imports.push(url);if((imports.length===1&&initialFails)||(imports.length>1&&latestFails))throw Error('Unavailable');},async(url:string)=>{requests.push(url);return {ok:true,json:async()=>({file:latest})};},document,{error(){}},{reload(){}});
 return {imports,requests,notices};
}
test('healthy entry loads once without fetching recovery metadata',async()=>{
 const result=await run(false);assert.deepEqual(result.imports,['/gallery/assets/old.js']);assert.equal(result.requests.length,0);
});
test('stale HTML recovers using the current same-origin entry and deployment base',async()=>{
 const result=await run(true);assert.deepEqual(result.imports,['/gallery/assets/old.js','/gallery/assets/new.js']);assert.match(result.requests[0],/^\/gallery\/app-entry.json\?t=/);assert.equal(result.notices.length,0);
});
test('unavailable or invalid recovery shows a retry notice without an import loop',async()=>{
 for(const file of ['assets/old.js','https://example.com/app.js','../app.js']){
  const result=await run(true,file);assert.equal(result.imports.length,1);assert.equal(result.notices.length,1);
 }
 assert.equal((await run(true,'assets/new.js',true)).notices.length,1);
});
