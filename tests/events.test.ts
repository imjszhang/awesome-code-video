import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {App,navigationAction} from '../web/src/App';
import {resources,repo} from '../web/src/model';

const origin='https://awesomecodevideo.com';
const resource=resources[0];

test('reuse intent requires the marked main CTA and its actual catalog destination',()=>{
 assert.equal(navigationAction(resource.url,origin,'/',resource.id)?.event,'outbound_click');
 assert.equal(navigationAction(resource.url,origin,'/',undefined,resource.id)?.event,'open_resource');
 assert.equal(navigationAction('https://example.com/',origin,'/',undefined,resource.id)?.event,'outbound_click');
 assert.equal(navigationAction(resource.url,origin,'/',undefined,'unknown-resource')?.event,'outbound_click');
 for(const r of resources){
  const html=renderToString(React.createElement(App,{path:`/resources/${r.id}/`}));
  assert.equal((html.match(/data-primary-resource=/g)||[]).length,1,r.id);
 }
});

test('only a resource card navigating to its own detail counts as a selection',()=>{
 const path=`/resources/${resource.id}/`;
 assert.equal(navigationAction(path,origin,'/',resource.id)?.event,'select_resource');
 assert.equal(navigationAction(path,origin),null);
 assert.equal(navigationAction('/library/',origin,'/',resource.id),null);
 assert.equal(navigationAction(path,origin,'/',resources[1].id),null);
 assert.equal(navigationAction(`/catalog${path}`,origin,'/catalog/',resource.id)?.event,'select_resource');
});

test('contribution intent and external previews are not resource conversions',()=>{
 assert.equal(navigationAction(`${repo}/issues/new/choose`,origin)?.event,'suggest_resource_click');
 assert.equal(navigationAction(repo,origin)?.event,'outbound_click');
 const preview=resources.find(r=>r.preview?.url&&r.preview.url!==r.url)!;
 assert.equal(navigationAction(preview.preview!.url,origin,'/',preview.id)?.event,'outbound_click');
 assert.equal(navigationAction('#explore',origin),null);
 assert.equal(navigationAction('javascript:alert(1)',origin),null);
 assert.equal(navigationAction('mailto:person@example.com',origin),null);
});
