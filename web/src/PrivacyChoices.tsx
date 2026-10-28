import React,{useEffect,useRef,useState} from 'react';
import {getAnalyticsAvailability,getAnalyticsConsent,setAnalyticsConsent,subscribeAnalytics,type AnalyticsConsent} from './analytics';

export function PrivacyChoices({base='/'}:{base?:string}){
 const [ready,setReady]=useState(false);
 const [available,setAvailable]=useState(false);
 const [consent,setConsent]=useState<AnalyticsConsent>('unknown');
 const [open,setOpen]=useState(false);
 const [saveError,setSaveError]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{
  function sync(){setAvailable(getAnalyticsAvailability().available);setConsent(getAnalyticsConsent());setReady(true);}
  sync();return subscribeAnalytics(sync);
 },[]);
 function choose(value:'granted'|'denied'){
  const persisted=setAnalyticsConsent(value);
  setSaveError(!persisted);setOpen(!persisted);
  if(persisted)trigger.current?.focus();
 }
 const visible=ready&&available&&(consent==='unknown'||open);
 useEffect(()=>{if(open)panel.current?.focus();},[open]);
 return <div className="privacy-choices">
  <a href={`${base}about/#privacy`}>Privacy</a>
  {ready&&available?<button ref={trigger} type="button" className="privacy-settings" aria-expanded={visible} aria-controls="analytics-choice" onClick={()=>setOpen(!open)}>Analytics choices</button>:null}
  {visible?<section ref={panel} tabIndex={-1} id="analytics-choice" className="analytics-choice" aria-labelledby="analytics-choice-title">
   <div><h2 id="analytics-choice-title">Help improve this collection?</h2>
    <p>Optional Google Analytics helps us understand which pages and resources are useful. It uses cookies after you accept. Your search text and copied content are not shared.</p>
    <p>Your choice won’t affect search, saved resources or previews. <a href={`${base}about/#privacy`}>Read our privacy information</a>.</p>
    {consent!=='unknown'?<p className="analytics-choice-status">Analytics is {consent==='granted'?'on':'off'}. You can change this at any time.</p>:null}
    {saveError?<p role="alert">{consent==='denied'?"Analytics is off on this page, but your browser could not save the choice. Clear this site's stored data before opening another page to remove an earlier choice.":'Your browser could not save this choice for future visits. It applies to this page only.'}</p>:null}
   </div>
   <div className="analytics-choice-actions">
    <button type="button" onClick={()=>choose('denied')}>{consent==='granted'?'Turn off analytics':'Reject analytics'}</button>
    <button type="button" onClick={()=>choose('granted')}>Accept analytics</button>
    {consent!=='unknown'?<button type="button" className="analytics-choice-close" onClick={()=>{setOpen(false);trigger.current?.focus();}}>Close</button>:null}
   </div>
  </section>:null}
 </div>;
}
