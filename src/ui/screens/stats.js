// Estadísticas de la tienda.
import { BYID, setName } from "../../core/cards/sets.js";
import { RAR } from "../../core/constants.js";
import { S } from "../../core/state.js";
import { face, svgBars, svgLine } from "../modals.js";
import { fmt } from "../../core/util.js";
import { medCount } from "../../core/medals.js";
export function mStats(){const L=S.lt||{},H=(S.hist||[]).slice(-30),days=H.map(x=>x.d);
  const best=H.reduce((m,x)=>x.inc>(m?m.inc:-1)?x:m,null),bp=L.bestPullC&&BYID[L.bestPullC];
  const sold=Object.entries(L.setSold||{}).sort((a,b)=>b[1]-a[1]).slice(0,5),smax=sold.length?sold[0][1]:1;
  const K=(ic,n,v)=>`<div class="stc"><span>${ic}</span><b>${v}</b><small>${n}</small></div>`;
  return `<h2>📊 Estadísticas</h2><div class="stgrid">${K("📅","Días jugados",S.day-1)}${K("🧑‍🤝‍🧑","Clientes atendidos",L.served||0)}${K("🎴","Sobres vendidos",L.psold||0)}${K("✨","Sobres abiertos",L.packs||0)}${K("💰","Ventas totales",fmt(L.earned||0))}${K("🕵️","Falsas pilladas",L.caught||0)}${K("👮","Ladrones pillados",L.thCaught||0)}${K("😞","Robos sufridos",L.thLost||0)}${K("🏅","Medallas",medCount()+"/8")}</div>
  <h3>Valor de la empresa</h3><div class="pn">${svgLine(H.map(x=>x.net!=null?x.net:0).filter((v,i,a)=>H[i].net!=null),"#f2b705")}<div class="row mu"><span>${days.length?"Día "+days[0]:""}</span><span>${H.length&&H[H.length-1].net!=null?fmt(H[H.length-1].net):""}</span></div></div>
  <h3>Ventas por día</h3><div class="pn">${svgBars(H.map(x=>x.inc||0),null,"#2fd17a")}<div class="row mu"><span>${best?`Mejor día: el ${best.d} con ${fmt(best.inc)}`:""}</span></div></div>
  <h3>Clientes por día</h3><div class="pn">${svgBars(H.filter(x=>x.cust!=null).map(x=>x.cust-(x.lost||0)),H.filter(x=>x.cust!=null).map(x=>x.lost||0),"#3f8fd9","#e3350d")}<div class="mu"><span style="color:#3f8fd9">■</span> compraron · <span style="color:#e3350d">■</span> se fueron sin comprar</div></div>
  <h3>Sobres más vendidos</h3><div class="pn">${sold.length?sold.map(([k,v])=>`<div class="hb2"><span>${setName(k)}</span><i style="width:${v/smax*100}%"></i><b>${v}</b></div>`).join(""):'<p class="mu">Aún no has vendido sobres.</p>'}</div>
  ${bp?`<h3>Mejor carta sacada de un sobre</h3><div class="pn" style="display:flex;gap:12px;align-items:center"><div style="width:84px;flex:none">${face(bp,false)}</div><div><b>${bp.name}</b><div class="mu">${RAR[bp.r].n} · ${setName(bp.s)}</div><div class="up" style="font-family:var(--fd);font-size:20px">${fmt(L.bestPull)}</div></div></div>`:""}`}
