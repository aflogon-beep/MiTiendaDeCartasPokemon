// Sobres: épocas, valor esperado, precio de mayorista y apertura (roll, sin repetidas).
import { BYS, BYSR, SETDEF } from "./cards/sets.js";
import { ERA, RORD } from "./constants.js";
import { G, S, SETS } from "./state.js";
import { clamp, r05 } from "./util.js";
import { pick } from "./rng.js";
import { price } from "./economy.js";
import { rvr } from "./cards/prices.js";
export let EVC={};
export function calcEV(sid){const e=eraCfg(sid);let v=e.C*avgL(poolR(sid,"C"))+e.U*avgL(poolR(sid,"U"));if(e.rv)v+=rvAvg(sid);e.slot.forEach(([r,p])=>v+=p*avgL(poolR(sid,r)));return v}
export function refreshPacks(first){
  SETS.forEach(sd=>{
    const s=sd.id;EVC[s]=calcEV(s);
    if(G.MODE==="real"){
      const hi=sd.year>=2020?7:sd.year>=2010?14:sd.year>=2003?60:400,t=clamp(r05(EVC[s]*1.12),3,hi);
      S.pack[s].w=first?t:r05(S.pack[s].w*.7+t*.3);S.pack[s].init=1;
      S.pack[s].ref=r05(S.pack[s].w*1.45);
    }
  });
}
export function roll(sid){
  const e=eraCfg(sid),out=[],used=new Set(),pu=l=>{let c=pick(l);for(let t=0;t<14&&used.has(c.id);t++)c=pick(l);used.add(c.id);return c};
  for(let i=0;i<e.C;i++)out.push({c:pu(poolR(sid,"C")),rv:false});
  for(let i=0;i<e.U;i++)out.push({c:pu(poolR(sid,"U")),rv:false});
  if(e.rv)out.push({c:pu(rvPool(sid)),rv:true});
  let r=Math.random(),sl="R";for(const [k,p] of e.slot){if(r<p){sl=k;break}r-=p}
  out.push({c:pu(poolR(sid,sl)),rv:false});
  return out;
}
export function eraCfg(sid){const sd=SETDEF.find(d=>d.id===sid)||{},y=sd.year||2023,e=y<2003?"wotc":y<2023?"mid":"sv",c=Object.assign({id:e},ERA[e]);if(e==="wotc"&&/e-card/i.test(sd.series||""))c.rv=true;return c}
export function poolR(sid,r){for(let i=RORD.indexOf(r);i<RORD.length;i++){const l=BYSR[sid+RORD[i]];if(l&&l.length)return l}return BYS[sid]||[]}
export const avgL=l=>l.length?l.reduce((a,c)=>a+price(c.id),0)/l.length:0;
export function rvPool(sid){const l=["C","U","R"].flatMap(x=>BYSR[sid+x]||[]);return l.length?l:(BYS[sid]||[])}
export const rvAvg=sid=>{const l=rvPool(sid);return l.length?l.reduce((a,c)=>a+price(c.id)*rvr(c),0)/l.length:0};
