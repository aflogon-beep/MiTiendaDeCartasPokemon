// Utilidades puras: límites, redondeo a 5 céntimos y formato de dinero y porcentajes.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const fmt=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n);
export const pct=x=>(x>=0?"+":"")+(x*100).toFixed(1).replace(".",",")+" %";
export const r05=x=>Math.max(.05,Math.round(x*20)/20);
