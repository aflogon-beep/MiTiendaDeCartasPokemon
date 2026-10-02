// Descarga de sets y cartas de pokemontcg.io, con reintentos y caché.
// Avisa por el bus: "toast" (mensaje) y "sets" (cambió el estado de la lista de colecciones).
import { emit } from "../bus.js";
import { rnd } from "../rng.js";
import { cget, cput, IDB, cacheGet } from "./cache.js";
import { SETDEF, mkSetDef, mapCard } from "./sets.js";

export const API="https://api.pokemontcg.io/v2/";
export function jget(url,ms){
  const ac=new AbortController(),to=setTimeout(()=>ac.abort(),ms||20000);
  return fetch(url,{signal:ac.signal}).then(r=>{clearTimeout(to);if(!r.ok)throw new Error(r.status);return r.json()}).catch(e=>{clearTimeout(to);throw e});
}
export let SETLIST_ST="ok";
export function loadSetList(){const c=cget("pcs-sets-v1");return Promise.resolve(c&&c.sets&&c.sets.length?c.sets:null)}
export function refreshSetList(force){
  const c=cget("pcs-sets-v1");if(!force&&c&&c.sets&&c.sets.length&&Date.now()-c.t<7*864e5)return;
  if(SETLIST_ST==="loading")return;SETLIST_ST="loading";emit("sets");
  const url=API+"sets?select=id,name,series,releaseDate,total,printedTotal,images&orderBy=-releaseDate&pageSize=250";
  const get=a=>jget(url,45000).catch(e=>a<2?new Promise(r=>setTimeout(r,2500*(a+1))).then(()=>get(a+1)):Promise.reject(e));
  get(0).then(j=>{if(!j||!j.data||!j.data.length)throw 0;cput("pcs-sets-v1",{t:Date.now(),sets:j.data});const before=SETDEF.length;j.data.forEach(mkSetDef);SETLIST_ST="ok";
    if(SETDEF.length>before)emit("toast",`🗂️ ${SETDEF.length} colecciones disponibles en Más → Colecciones`);emit("sets")})
  .catch(()=>{SETLIST_ST="fail";emit("sets")});
}
export const FAILED=new Set();
export const STALE=new Set();
export function fetchSetCards(sd,force){
  return cacheGet(sd.api).then(c=>{
    const has=c&&c.cards&&c.cards.length;
    if(has&&!force&&Date.now()-c.t<18*36e5){FAILED.delete(sd.id);return c.cards}
    const q=n=>API+"cards?q=set.id:"+sd.api+"&pageSize=250&page="+n+"&select=id,name,number,rarity,images,cardmarket,hp,types,supertype";
    const get=(url,att)=>jget(url,40000).catch(e=>att<2?new Promise(r=>setTimeout(r,1500*(att+1)+rnd(800))).then(()=>get(url,att+1)):Promise.reject(e));
    return get(q(1),0).then(j=>{
      const pages=Math.ceil((j.totalCount||j.data.length)/250);let all=j.data;if(pages<=1)return all;
      const more=[];for(let n=2;n<=pages;n++)more.push(get(q(n),0).then(x=>x.data));
      return Promise.all(more).then(arr=>all.concat(...arr));
    }).then(data=>{
      const cards=data.filter(d=>d&&d.id).map(d=>mapCard(d,sd));
      if(!cards.length)throw 0;
      const rec={t:Date.now(),cards};
      IDB.put("set:"+sd.api,rec).then(ok=>{if(ok==null)cput("pcs-set2-"+sd.api,rec);else try{localStorage.removeItem("pcs-set-"+sd.api);localStorage.removeItem("pcs-set2-"+sd.api)}catch(e){}});
      FAILED.delete(sd.id);STALE.delete(sd.id);return cards;
    }).catch(()=>{if(has){STALE.add(sd.id);FAILED.delete(sd.id);return c.cards}FAILED.add(sd.id);return []});
  });
}
export function loadMany(ids,onp){
  let i=0,done=0;const out=[];
  const work=()=>{if(i>=ids.length)return Promise.resolve();const id=ids[i++],sd=SETDEF.find(d=>d.id===id);if(!sd)return work();
    return fetchSetCards(sd).then(cs=>{cs.forEach(c=>c.s=sd.id);out.push(...cs);done++;if(onp)onp(done,ids.length,sd)}).then(work)};
  return Promise.all([work(),work(),work()]).then(()=>out);
}
