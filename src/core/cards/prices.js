// Precios de mercado de cada carta: historial inicial y paso diario (paseo aleatorio hacia su precio base).
import { clamp } from "../util.js";
import { gauss } from "../rng.js";
import { VOL } from "../constants.js";

export const rvr=c=>c.rv&&c.b?clamp(c.rv/c.b,1.2,8):2.5;
export function step(p,vol){
  p.t=p.t*.85+(Math.random()-.5)*.012*vol;
  p.p=Math.max(.02,p.p*Math.exp(p.t+gauss()*.03*vol)+(p.b-p.p)*.03);
  p.h.push(p.p);if(p.h.length>60)p.h.shift();
}
export function initPrice(c){
  const h=[];
  if(c.seed){const s=c.seed;for(let i=0;i<30;i++){const f=i/29,v=f<.77?s[0]+(s[1]-s[0])*(f/.77):s[1]+(c.b-s[1])*((f-.77)/.23);h.push(v*(1+(Math.random()-.5)*.01))}h[29]=c.b}
  else{const p={p:c.b*(.92+Math.random()*.16),t:0,b:c.b,h:[]};for(let i=0;i<30;i++)step(p,VOL[c.r]);return p}
  return {p:c.b,t:0,b:c.b,h};
}
