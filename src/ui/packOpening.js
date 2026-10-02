// Apertura de sobres «wow» (rasgar, revelar, pasar cartas) y de cajas o producto sellado.
import { $ } from "../render/canvas.js";
import { G, S, SETS } from "../core/state.js";
import { PTYPES, RAR } from "../core/constants.js";
import { SETDEF, setName } from "../core/cards/sets.js";
import { TILT, askGyro, big, cardVal, closeM, cls, confetti, countUp, face, faceBig, hitLv, pcHTML, ptTilt, renderM } from "./modals.js";
import { ac, sfx, vibe } from "../audio/sfx.js";
import { clamp, fmt } from "../core/util.js";
import { price } from "../core/economy.js";
import { rvr } from "../core/cards/prices.js";
export function mOpen(){
  const o=G.openState;
  if(o.mode==="seq"){
    const x=o.cards[o.idx],c=x.c,hit=["DR","IR","UR","SIR","HR"].includes(c.r),v=price(c.id)*(x.rv?rvr(c):1);
    [o.cards[o.idx+1],o.cards[o.idx+2]].forEach(y=>{if(y&&y.c.img)new Image().src=big(y.c.img)});
    const last=o.idx>=o.cards.length-1;
    return `<div class="seqhead"><h2 style="margin:0">${setName(o.s)}</h2><span class="mu">Carta ${o.idx+1} de ${o.cards.length}</span></div>
    <div class="stage" data-a="nextc"><div class="bigcard ${o.fl?(hit?"hit":""):"bk"}" style="--rc:${RAR[c.r].c}">${o.fl?faceBig(c,x.rv):""}</div></div>
    <div class="seqinfo">${o.fl?`<b>${c.name}</b> · ${RAR[c.r].n} · <b>${fmt(v)}</b>${hit?" ✨":""}`:'<span class="mu">Toca la carta para girarla</span>'}</div>
    <div class="btns"><button class="b pri" data-a="nextc">${o.fl?(last?"Ver resumen":"Siguiente carta"):"Girar"}</button><button class="b" data-a="skip">Saltar al resumen</button></div>`;
  }
  const vv=x=>price(x.c.id)*(x.rv?rvr(x.c):1),best=0,sorted=o.cards.slice().sort((a,b)=>vv(b)-vv(a));
  const tiles=sorted.map((x,i)=>`<div class="tile zoomable${i===best?" best":""}" data-a="zoom" data-k="${x.c.id}" data-n="${x.rv?1:0}">${face(x.c,x.rv)}<div class="pt">${fmt(vv(x))}</div>${x.nw?'<div class="nw">NUEVA</div>':""}</div>`).join("");
  const more=o.total>o.cards.length?`<p class="mu">+${o.total-o.cards.length} cartas más, ya en tu inventario.</p>`:"";
  return `<h2>${o.n} sobre${o.n>1?"s":""} de ${setName(o.s)}</h2><div class="tiles lg">${tiles}</div>${more}<p id="osum">${osum()}</p><p class="mu">Toca una carta para verla en grande.</p><div class="btns">${S.sealed[o.s]>0?`<button class="b pri" data-a="open" data-k="${o.s}" data-n="1">Abrir otro</button>`:""}</div>`;
}
export function osum(){const o=G.openState,cost=o.n*S.pack[o.s].w,d=o.val-cost;return `<b>Valor: ${fmt(o.val)}</b> · Coste: ${fmt(cost)} · <span class="${cls(d)}">${d>=0?"+":""}${fmt(d)}</span>`}
export let CUR=null;
export function mountPX(){
  const o=G.openState,sd=SETDEF.find(d=>d.id===o.s)||{},cost=o.n*S.pack[o.s].w;
  o.cost=cost;
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:${sd.col||"#888"}">
    <div class="pxbar"><div><b>${sd.n||setName(o.s)}</b><div class="pxrun" id="pxrun">Coste del sobre ${fmt(cost)}</div></div>
    <div class="step"><button class="ib" id="pxsnd" aria-label="Sonido">${G.SOUND?"🔊":"🔇"}</button><button class="ib" id="pxskip">Saltar</button></div></div>
    <div class="dots" id="pxdots">${o.cards.map(()=>"<i></i>").join("")}</div>
    <div class="pxstage" id="pxst"><div class="rays" id="pxrays"></div></div>
    <div class="pxhint" id="pxhint"></div>
    <div class="flash" id="pxflash"></div></div>`;
  o.cards.forEach(y=>{if(y.c.img)new Image().src=big(y.c.img)});
  $("#pxsnd").onclick=e=>{G.SOUND=!G.SOUND;try{localStorage.setItem("pcs-sound",G.SOUND?"1":"0")}catch(_){}e.currentTarget.textContent=G.SOUND?"🔊":"🔇"};
  $("#pxskip").onclick=()=>{o.mode="sum";TILT.el=null;CUR=null;renderM()};
  const st=$("#pxst");let P=null;
  st.addEventListener("pointerdown",e=>{ac();askGyro();P={x:e.clientX,moved:false};try{st.setPointerCapture(e.pointerId)}catch(_){}});
  st.addEventListener("pointermove",e=>{
    ptTilt(e);if(!P)return;const dx=e.clientX-P.x;if(Math.abs(dx)>8)P.moved=true;
    if(o.phase==="pack"&&!o.torn){const w=$("#pxpack").getBoundingClientRect().width;tearTo(o.tb+Math.abs(dx)/(w*.75))}
    else if(o.phase==="cards"&&o.rev&&CUR){CUR.classList.remove("snap");CUR.style.setProperty("--dx",dx+"px");CUR.style.setProperty("--dr",(dx/18).toFixed(1)+"deg")}
  });
  const up=e=>{
    if(!P)return;const dx=e.clientX-P.x,pp=P;P=null;
    if(o.phase==="pack"){if(o.torn)return;if(!pp.moved)autoTear();else o.tb=o.tp;return}
    if(o.phase!=="cards"||!CUR)return;
    if(!o.rev){if(Math.abs(dx)<40)reveal();return}
    if(Math.abs(dx)>70)nextCard(Math.sign(dx));
    else if(!pp.moved)nextCard(1);
    else{CUR.classList.add("snap");CUR.style.setProperty("--dx","0px");CUR.style.setProperty("--dr","0deg")}
  };
  st.addEventListener("pointerup",up);st.addEventListener("pointercancel",up);
  for(let i=0;i<o.idx;i++)markDot(i,RAR[o.cards[i].c.r].c);
  $("#pxrun").innerHTML=runTxt();
  if(o.phase==="pack")buildPack();else{buildStack();showCard(o.idx)}
}
export function runTxt(){const o=G.openState,d=o.run-o.cost;return o.phase==="pack"?`Coste del sobre ${fmt(o.cost)}`:`Llevas <b class="${cls(d)}">${fmt(o.run)}</b> de ${fmt(o.cost)}`}
export function markDot(i,col){const d=$("#pxdots");if(!d)return;const e=d.children[i];if(e){e.style.background=col;e.style.color=col;e.classList.add("on")}}
export function buildPack(){
  const o=G.openState,sd=SETDEF.find(d=>d.id===o.s)||{};
  $("#pxst").insertAdjacentHTML("beforeend",`<div class="packwrap" id="pxpw"><div class="bobw"><div class="pack" id="pxpack">
    <div class="pbody"><div class="pcnt">${sd.sym?`<img class="psym" src="${sd.sym}" alt="" onerror="this.remove()">`:""}<div class="pball"></div><div class="pname">${sd.n||setName(o.s)}</div><div class="psub">Sobre de ampliación · ${o.cards.length} cartas</div></div><div class="holo" style="--ho:.3"></div><div class="sweep"></div><div class="glare"></div></div>
    <div class="ptop">POKÉ CARDS</div><div class="tear"></div></div></div></div>`);
  TILT.el=$("#pxpack");
  $("#pxhint").innerHTML=`<div style="font-size:16px;color:#fff;font-weight:700">Desliza el dedo por el sobre para abrirlo</div><div class="mu">o tócalo · inclina el móvil para ver el brillo</div>`;
}
export function tearTo(v){
  const o=G.openState;o.tp=clamp(v,0,1);const pk=$("#pxpack");if(!pk)return;pk.style.setProperty("--tp",o.tp);
  const stp=Math.floor(o.tp*8);if(stp>o.tstep){o.tstep=stp;sfx.tick();vibe(6)}
  if(o.tp>=1&&!o.torn)tear();
}
export function autoTear(){const o=G.openState,a=o.tp,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/380);tearTo(a+(1-a)*k);if(k<1&&!o.torn)requestAnimationFrame(f)})(t0)}
export function tear(){
  const o=G.openState;o.torn=true;sfx.rip();vibe(25);
  const pk=$("#pxpack");pk.querySelector(".ptop").classList.add("fly");pk.querySelector(".tear").style.opacity=0;
  $("#pxhint").innerHTML="";
  setTimeout(()=>{const w=$("#pxpw");if(w)w.classList.add("done");sfx.swish()},450);
  setTimeout(()=>{const w=$("#pxpw");if(w)w.remove();if(!$("#px"))return;o.phase="cards";buildStack();showCard(o.idx)},950);
}
export function buildStack(){
  $("#pxst").insertAdjacentHTML("beforeend",`<div class="cstack" id="pxcs">${[3,2,1].map(i=>`<div class="under" style="--i:${i}"></div>`).join("")}</div>`);
}
export function showCard(i){
  const o=G.openState,x=o.cards[i],c=x.c,lv=hitLv(x),rc=RAR[c.r].c,cs=$("#pxcs");if(!cs)return;
  const left=o.cards.length-i-1;cs.querySelectorAll(".under").forEach(u=>u.classList.toggle("off",+u.style.getPropertyValue("--i")>left));
  cs.insertAdjacentHTML("beforeend",pcHTML(c,x.rv,lv>0,lv));
  const all=cs.querySelectorAll(".pc");CUR=all[all.length-1];
  const old=[...all].filter(e=>e!==CUR&&!e.classList.contains("fly"));old.forEach(e=>e.remove());
  const fl=cs.querySelector(".pc.fly");if(fl)cs.appendChild(fl);
  TILT.el=CUR;o.lv=lv;o.rev=!lv;
  $("#pxrays").classList.remove("on");const bn=$("#px .banner");if(bn)bn.remove();
  if(!lv){sfx.flip();markDot(i,rc);o.run+=cardVal(x);$("#pxrun").innerHTML=runTxt();setInfo(x,false)}
  else{
    sfx.charge(lv);vibe(lv>=3?[20,40,20,40,20]:15);
    $("#pxhint").innerHTML=`<div class="cinfo"><div class="cv" style="color:${rc}">${lv>=3?"¡¡Algo brilla muchísimo!!":lv===2?"¡Algo brilla!":"Esto brilla…"}</div><div class="mu">Toca la carta para revelarla · ${i+1}/${o.cards.length}</div></div>`;
  }
}
export function setInfo(x,anim){
  const o=G.openState,c=x.c,v=cardVal(x);
  $("#pxhint").innerHTML=`<div class="cinfo" style="--rc:${RAR[c.r].c}"><div><b style="color:#fff">${c.name}</b> <span class="rchip">${RAR[c.r].n}</span>${x.rv?' <span class="rchip rv">Reverse</span>':""}${x.nw?' <span class="nwb">NUEVA</span>':""}</div><div class="cv" id="pxcv">${anim?fmt(0):fmt(v)}</div><div class="mu">${o.idx>=o.cards.length-1?"Toca para ver el resumen":"Desliza o toca para la siguiente"} · ${o.idx+1}/${o.cards.length}</div></div>`;
  if(anim)countUp($("#pxcv"),v,lv2ms(o.lv));
}
export const lv2ms=lv=>lv>=3?1400:lv===2?900:600;
export function reveal(){
  const o=G.openState,x=o.cards[o.idx],c=x.c,lv=o.lv,rc=RAR[c.r].c,el=CUR;
  o.rev=true;el.classList.remove("back");sfx.flip();
  setTimeout(()=>{
    if(!$("#px"))return;
    el.classList.remove("charge","l3");
    const fl=$("#pxflash");fl.classList.remove("on");void fl.offsetWidth;fl.classList.add("on");
    const ry=$("#pxrays");ry.style.setProperty("--rc",rc);ry.classList.add("on");
    const base={DR:1,IR:2,UR:2,SIR:3,HR:3}[c.r];
    $("#pxst").insertAdjacentHTML("beforeend",`<div class="banner" style="--rc:${rc}">${lv>=3?"✨ ":""}${base?RAR[c.r].n:"¡Carta valiosa!"}${lv>=3?" ✨":""}</div>`);
    confetti(lv,rc);sfx.hit(lv);vibe(lv>=3?[60,40,140]:lv===2?[40,30,60]:30);
    markDot(o.idx,rc);o.run+=cardVal(x);$("#pxrun").innerHTML=runTxt();setInfo(x,true);
  },280);
}
export function nextCard(dir){
  const o=G.openState,el=CUR;if(!el)return;
  el.classList.remove("snap");el.classList.add("fly");el.style.setProperty("--dx",(dir*innerWidth*1.1)+"px");el.style.setProperty("--dr",(dir*28)+"deg");
  sfx.swish();CUR=null;setTimeout(()=>el.remove(),450);
  o.idx++;
  if(o.idx>=o.cards.length){$("#pxrays").classList.remove("on");setTimeout(()=>{if(G.openState!==o||!$("#px"))return;o.mode="sum";TILT.el=null;renderM()},320)}
  else showCard(o.idx);
}
export function mountBox(){
  const B=G.BOXO,i=B.i,sd=SETS.find(z=>z.id===i.s)||{};
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:${i.col}"><div class="pxbar"><div><b>${i.ic} ${i.n}</b><div class="pxrun">${i.packs} sobres dentro</div></div><div class="step"><button class="ib" id="bxclose">Cerrar</button></div></div>
  <div class="pxstage" id="bxst"><div class="rays" id="pxrays" style="--rc:${i.col}"></div><div class="bxw" id="bxw"><div class="bx-lid"></div><div class="bx-body">${sd.sym?`<img src="${sd.sym}" alt="" onerror="this.remove()">`:'<div class="pball" style="width:56px;margin:0"></div>'}<b>${setName(i.s)}</b><span>${PTYPES[i.t].n}</span></div><div class="tape"><i></i></div></div></div>
  <div class="pxhint" id="bxhint"><div style="font-size:16px;color:#fff;font-weight:700">Desliza por la cinta para cortarla</div><div class="mu">o toca la caja</div></div><div class="flash" id="pxflash"></div></div>`;
  const w=$("#bxw"),st=$("#bxst");let x0=null;
  $("#bxclose").onclick=()=>{G.BOXO=null;closeM()};
  const cut=()=>{if(B.done)return;B.done=true;sfx.rip();vibe(25);w.classList.add("cut");
    setTimeout(()=>{w.classList.add("open");sfx.swish()},250);
    setTimeout(()=>{if(!$("#px"))return;$("#pxrays").classList.add("on");const n=i.packs,rows=n>12?3:n>6?2:1,per=Math.ceil(n/rows);let h="";
      for(let k=0;k<n;k++){const r=Math.floor(k/per),j=k%per,cnt=Math.min(per,n-r*per),a=(-65+130*(cnt>1?j/(cnt-1):.5))*Math.PI/180,R=95+r*38;
        h+=`<div class="fp" style="--tx:${(Math.sin(a)*R).toFixed(1)}px;--ty:${(-Math.cos(a)*R+30).toFixed(1)}px;--r:${(a*57.3).toFixed(0)}deg;animation-delay:${k*28}ms">${sd.sym?`<img src="${sd.sym}" alt="">`:""}</div>`}
      w.insertAdjacentHTML("beforeend",h);for(let k=0;k<Math.min(n,14);k++)setTimeout(()=>sfx.tick(),k*60);confetti(n>=20?2:1,i.col);
      $("#bxhint").innerHTML=`<div class="cinfo"><div class="cv">+${n} sobres</div><div class="mu">de ${setName(i.s)} añadidos a tu stock</div><div class="btns" style="justify-content:center"><button class="b pri" id="bxok">¡Genial!</button></div></div>`;
      $("#bxok").onclick=()=>{G.BOXO=null;closeM()}},900);
  };
  const tape=w.querySelector(".tape i");
  st.addEventListener("pointerdown",e=>{ac();x0=e.clientX});
  st.addEventListener("pointermove",e=>{if(x0==null||B.done)return;const p=clamp(Math.abs(e.clientX-x0)/(w.getBoundingClientRect().width*.7),0,1);tape.style.setProperty("--cut",(p*100)+"%");if(p>=1)cut()});
  st.addEventListener("pointerup",()=>{if(x0!=null&&!B.done&&!(+getComputedStyle(tape).getPropertyValue("--cut").replace("%","")>5))cut();x0=null});
}
