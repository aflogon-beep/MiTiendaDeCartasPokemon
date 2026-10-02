// Caché de cartas: IndexedDB (base "pcs", almacén "kv") con respaldo en localStorage.
export const cget=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
export const cput=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
export const IDB=(()=>{let dbp=null;
  const open=()=>dbp||(dbp=new Promise((res,rej)=>{try{const r=indexedDB.open("pcs",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}}));
  const tx=(m,f)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction("kv",m),q=f(t.objectStore("kv"));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)}));
  return {get:k=>tx("readonly",s=>s.get(k)).catch(()=>null),put:(k,v)=>tx("readwrite",s=>s.put(v,k)).catch(()=>null)};
})();
export function cacheGet(api){return IDB.get("set:"+api).then(v=>v||cget("pcs-set2-"+api)||cget("pcs-set-"+api))}
