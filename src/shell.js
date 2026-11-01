import {GameAudio} from './audio.js';
import {routeFromShell,screenRoute,screenURL,shellURL} from './screen-route.js';
const base=new URL('./',location.href).href,screen=document.getElementById('screen');
let storage;try{storage=localStorage;}catch{}
window.motionRunAudio=fetch('content/audio.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Audio catalogue unavailable');return r.json();}).then(config=>new GameAudio(config,{storage})).catch(()=>null);
window.navigateScreen=(url,push=true)=>{
 const route=screenRoute(url,base);if(!route)return false;
 const next=shellURL(route,base);if(push&&next!==location.href)history.pushState(null,'',next);
 screen.contentWindow.location.replace(screenURL(route,base));return true;
};
window.addEventListener('popstate',()=>{screen.contentWindow.location.replace(screenURL(routeFromShell(location.href),base));});
screen.addEventListener('load',()=>{try{document.title=screen.contentDocument.title;screen.contentWindow.focus();window.motionRunAudio.then(a=>{a?.setActive(false);a?.stopEffects();});}catch{}});
// Assign src only after the shared audio promise and navigation contract exist.
screen.src=screenURL(routeFromShell(location.href),base);
