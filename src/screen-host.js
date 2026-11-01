import {screenRoute,shellURL} from './screen-route.js';
const base=new URL('../',import.meta.url).href;
if(window===window.top){
 const route=screenRoute(location.href,base);if(route)location.replace(shellURL(route,base));
}else if(window.parent.navigateScreen){
 document.addEventListener('click',e=>{
  const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.download||a.target&&a.target!=='_self')return;
  if(window.parent.navigateScreen(a.href))e.preventDefault();
 });
}
