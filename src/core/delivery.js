// Pedidos al mayorista: resumen de lo que viene en la furgoneta y entrega al stock.
import { ui } from "./bus.js";
import { G, S, assignSlots } from "./state.js";
import { pInfo, pStock } from "./economy.js";
import { saveNow } from "./save.js";
import { setName } from "./cards/sets.js";
export function delivSummary(){const d=S.deliv||[];if(!d.length)return "";const t={};d.forEach(o=>{Object.entries(o.sealed||{}).forEach(([k,v])=>t[setName(k)]=(t[setName(k)]||0)+v);Object.entries(o.prod||{}).forEach(([k,v])=>{const i=pInfo(k);if(i)t[i.n]=(t[i.n]||0)+v})});return Object.entries(t).map(([k,v])=>`${v}× ${k}`).join(", ")}
export function deliverNow(){const d=S.deliv||[];if(!d.length)return;d.forEach(o=>{Object.entries(o.sealed||{}).forEach(([k,v])=>S.sealed[k]=(S.sealed[k]||0)+v);Object.entries(o.prod||{}).forEach(([k,v])=>{S.prod[k]=pStock(k)+v;S.prodSeen=true})});S.deliv=[];assignSlots();saveNow();ui.toast("🚚 ¡Ha llegado tu pedido! Ya está en el stock");ui.sfx("coin");ui.hud();if(G.M==="packs")ui.renderM()}
