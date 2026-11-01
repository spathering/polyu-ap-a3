// One persistent top-level document owns music while same-origin screens change.
export const SCREENS=['home','modes','levels','play','studio','editor','lab'];
export function screenRoute(url,base){
 const u=new URL(url,base),root=new URL(base);if(u.origin!==root.origin)return null;
 const relative=u.pathname.startsWith(root.pathname)?u.pathname.slice(root.pathname.length):null;
 const screen=relative===''||relative==='index.html'?'home':SCREENS.find(s=>relative===`pages/${s}.html`);
 if(!screen)return null;return {screen,search:u.search};
}
export function routeFromShell(url){const p=new URL(url).searchParams,screen=SCREENS.includes(p.get('screen'))?p.get('screen'):'home';p.delete('screen');return {screen,search:p.size?'?'+p.toString():''};}
export function screenURL(route,base){return new URL(`pages/${route.screen}.html${route.search||''}`,base).href;}
export function shellURL(route,base){const u=new URL(base),p=new URLSearchParams(route.search);if(route.screen!=='home')p.set('screen',route.screen);u.search=p.toString();return u.href;}
