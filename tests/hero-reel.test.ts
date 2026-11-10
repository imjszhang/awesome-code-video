import assert from 'node:assert/strict';
import test from 'node:test';
import {CHART_VALUES,REEL_FPS,REEL_FRAMES,REEL_LISTING,REEL_SHOTS,REEL_STILL_FRAME,ROUTE,TYPED_LINE,easeInOutCubic,easeOutCubic,easeOutExpo,routePoint,shotAt,spring,timecode,typedCount,wrapFrame} from '../web/src/heroReel';

test('the reel is a six-second loop of equal shots, addressed by frame',()=>{
 assert.equal(REEL_FPS,30);
 assert.equal(REEL_FRAMES,180);
 assert.equal(REEL_FRAMES,REEL_SHOTS.reduce((sum,shot)=>sum+shot.frames,0));
 assert.deepEqual(REEL_SHOTS.map(shot=>shot.id),['type','chart','route','title']);
 // Every frame belongs to exactly one shot, and shot-local frames count up from zero.
 let previous=shotAt(0);
 assert.deepEqual(previous,{index:0,id:'type',frame:0,start:0});
 for(let frame=1;frame<REEL_FRAMES;frame++){
  const shot=shotAt(frame);
  if(shot.index===previous.index)assert.equal(shot.frame,previous.frame+1);
  else{assert.equal(shot.index,previous.index+1);assert.equal(shot.frame,0);assert.equal(shot.start,frame);}
  previous=shot;
 }
 assert.equal(previous.id,'title');
 assert.equal(previous.frame,REEL_SHOTS[3].frames-1);
});

test('any frame number wraps onto the loop, so playback and scrubbing agree',()=>{
 assert.equal(wrapFrame(0),0);
 assert.equal(wrapFrame(REEL_FRAMES),0);
 assert.equal(wrapFrame(REEL_FRAMES+7),7);
 assert.equal(wrapFrame(-1),REEL_FRAMES-1);
 assert.equal(wrapFrame(44.9),44);
 assert.equal(wrapFrame(Number.NaN),0);
 assert.equal(wrapFrame(Number.POSITIVE_INFINITY),0);
 assert.deepEqual(shotAt(REEL_FRAMES+45),shotAt(45));
 assert.equal(shotAt(REEL_STILL_FRAME).id,'title','the resting frame shows the finished title');
});

test('timecode counts minutes, seconds and frames',()=>{
 assert.equal(timecode(0),'00:00:00');
 assert.equal(timecode(29),'00:00:29');
 assert.equal(timecode(30),'00:01:00');
 assert.equal(timecode(REEL_FRAMES-1),'00:05:29');
 assert.equal(timecode(REEL_FRAMES),'00:00:00');
});

test('the listing has one highlighted line per shot, in playback order',()=>{
 const shotLines=REEL_LISTING.filter(line=>line.shot).map(line=>line.shot);
 assert.deepEqual(shotLines,REEL_SHOTS.map(shot=>shot.id));
 const text=REEL_LISTING.map(line=>line.tokens.map(token=>token.text).join(''));
 assert.ok(text.some(line=>line.includes(`fps = ${REEL_FPS}`)));
 assert.ok(text.some(line=>line.includes(`frames = ${REEL_FRAMES}`)));
 assert.ok(text.some(line=>line.includes(`'${TYPED_LINE}'`)));
 assert.ok(text.some(line=>line.includes(CHART_VALUES.join(', '))),'the chart line shows the values that are drawn');
 // The narrow code pane cannot scroll; keep every line inside it.
 for(const line of text)assert.ok(line.length<=34,line);
});

test('easing curves start at rest, end exactly on target and never run backwards',()=>{
 for(const ease of [easeOutCubic,easeOutExpo,easeInOutCubic]){
  assert.equal(ease(-1),0);
  assert.equal(ease(0),0);
  assert.equal(ease(1),1);
  assert.equal(ease(2),1);
  let previous=0;
  for(let t=0;t<=1;t+=1/120){const value=ease(t);assert.ok(value>=previous-1e-12);previous=value;}
 }
 assert.equal(spring(0),0);
 assert.equal(spring(1),1);
 assert.equal(spring(5),1);
 const peak=Math.max(...Array.from({length:200},(_,i)=>spring(i/200)));
 assert.ok(peak>1&&peak<1.12,'one small overshoot, then it settles');
});

test('the typed line fills in one character at a time and completes within its shot',()=>{
 assert.equal(typedCount(0),0);
 let previous=0;
 for(let frame=0;frame<REEL_SHOTS[0].frames;frame++){
  const count=typedCount(frame);
  assert.ok(count===previous||count===previous+1);
  previous=count;
 }
 assert.equal(previous,TYPED_LINE.length);
 assert.ok(typedCount(30)===TYPED_LINE.length,'the finished line holds before the cut');
});

test('the flight path runs between its two pins',()=>{
 assert.deepEqual(routePoint(0),ROUTE.from);
 assert.deepEqual(routePoint(1),ROUTE.to);
 const mid=routePoint(.5);
 assert.ok(mid.y<Math.min(ROUTE.from.y,ROUTE.to.y),'the arc rises above both ends');
});
