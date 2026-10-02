// Avisos flotantes (toasts) y su registro en Avisos.
import { $, VIS } from "../render/canvas.js";
import { updBadges } from "./hud.js";
export function toast(t,o){o=o||{};if(!o.nolog){VIS.notes=VIS.notes||[];VIS.notes.unshift({t,at:Date.now()});if(VIS.notes.length>40)VIS.notes.length=40;VIS.unread=(VIS.unread||0)+1;if(typeof updBadges==="function")updBadges()}
  const e=$("#toast");if(!e)return;const d=document.createElement("div");d.className="toast";d.innerHTML=t+(o.undo?' <button class="undo" data-a="undo">Deshacer</button>':"");if(o.undo)d.style.pointerEvents="auto";e.appendChild(d);while(e.children.length>2)e.firstChild.remove();setTimeout(()=>d.remove(),o.undo?7000:2600)}
