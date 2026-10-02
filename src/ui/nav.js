// Barra de navegación inferior, iconos y pestañas de Cartas y Retos.
import { $, VIS } from "../render/canvas.js";
import { G } from "../core/state.js";
import { updBadges } from "./hud.js";
export const ICON={
  packs:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  coll:'<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M10 4.5l7.5-1.3a2 2 0 012.3 1.6l2 11.6a2 2 0 01-1.6 2.3L14 19.8"/>',
  album:'<path d="M5 3h12a2 2 0 012 2v16H7a2 2 0 01-2-2z"/><path d="M5 17a2 2 0 012-2h12M9 7h6"/>',
  tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 12l2 2 4-4M9 17h6"/>',
  more:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play:'<path d="M7 4l13 8-13 8z"/>',
  speed:'<path d="M3 5l9 7-9 7zM12 5l9 7-9 7z"/>',
  home:'<path d="M3 10l9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8"/>',
  bell:'<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'
};
export const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
export const NAVS=[["home","home","Tienda"],["packs","packs","Stock"],["coll","coll","Cartas"],["retos","trophy","Retos"],["more","more","Más"]];
export function paintNav(){
  const n=$("#nav");if(n)n.innerHTML=NAVS.map(([k,ic,l])=>`<button data-a="nav" data-k="${k}" id="nav-${k}">${svgI(ic)}<span>${l}</span><i class="nb"></i></button>`).join("");
  const c=$("#cvctl");if(c)c.innerHTML=`<button data-a="pause" aria-label="Pausa">${G.paused?"▶":"⏸"}</button><button data-a="speed" aria-label="Velocidad">${G.speed}×</button>`;
  navAct();updBadges();
}
export const SEC={packs:"packs",coll:"coll",card:"coll",album:"coll",grading:"coll",tasks:"retos",medals:"retos",story:"retos",games:"retos",mg:"retos",hunt:"retos",sell:"home",insp:"home",lot:"home",ck:"home",hag:"home",trade:"home",custc:"home",sum:"home",open:"home"};
export function navAct(){const sec=G.M?(SEC[G.M]||"more"):"home";document.querySelectorAll("#nav [data-a=nav]").forEach(b=>b.classList.toggle("act",b.dataset.k===sec))}
export const cardTabs=k=>{VIS.lastCards=k;if(k==="coll"&&G.collF==="fav")k="fav";return `<h2>🃏 Cartas</h2><div class="tabs t4">${[["coll","Colección"],["fav","❤️ Favoritas"],["album","📒 Álbum"],["grading","🔍 Gradeo"]].map(([x,n])=>`<button class="b ${x===k?"on":""}" ${x==="fav"?'data-a="cfav"':x==="coll"?'data-a="callc"':`data-a="m" data-k="${x}"`}>${n}</button>`).join("")}</div>`};
export const retoTabs=k=>{VIS.lastReto=k;return `<h2>🏆 Retos</h2><div class="tabs t4">${[["tasks","📋 Tareas"],["medals","🏅 Medallas"],["story","📖 Historia"],["games","🎮 Juegos"]].map(([x,n])=>`<button class="b ${x===k?"on":""}" data-a="m" data-k="${x}">${n}</button>`).join("")}</div>`};
