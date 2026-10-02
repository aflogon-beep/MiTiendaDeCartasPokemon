// Tráfico: coches, bicis, autobús, furgoneta del mayorista y semáforos.
import { ui } from "../core/bus.js";
import { CX0, CX1, CY0, CY1, XS0, XS1 } from "../world/layout.js";
import { EMIS } from "./bloom.js";
import { LITE, VIS, cx, rr, txt } from "./canvas.js";
import { S, hasState } from "../core/state.js";
import { SKINS, drawPerson } from "./people.js";
import { clamp } from "../core/util.js";
import { deliverNow } from "../core/delivery.js";
import { mkOutfit } from "../core/customers/outfit.js";
import { nightK } from "./lighting.js";
import { pick, rnd } from "../core/rng.js";
export function drawCar(c){
  if(c.bike){drawBike(c);return}
  if(c.van){drawVan(c);return}
  const L=c.bus?100:c.len,Wd=c.bus?28:22,x=c.x-L/2,y=c.y-Wd/2,f=c.dir>0?x+L:x,n=nightK();
  cx.fillStyle="rgba(0,0,0,.3)";rr(x+3,y+4,L,Wd,6);cx.fill();
  cx.fillStyle=c.bus?"#2f6fb3":c.col;rr(x,y,L,Wd,6);cx.fill();cx.fillStyle="rgba(255,255,255,.18)";cx.fillRect(x+4,y+2,L-8,3);
  if(c.bus){cx.fillStyle="#bfe3f5";for(let i=0;i<6;i++)cx.fillRect(x+8+i*15,y+4,10,Wd-8);cx.fillStyle="#fff";cx.fillRect(x,y+Wd/2-1,L,2)}
  else{cx.fillStyle="#1d2633";rr(x+L*.28,y+3,L*.44,Wd-6,4);cx.fill();cx.fillStyle="#9fc3d6";cx.fillRect(c.dir>0?x+L*.62:x+L*.28,y+4,L*.1,Wd-8)}
  cx.fillStyle="#fff6c0";cx.fillRect(c.dir>0?f-3:f,y+2,3,4);cx.fillRect(c.dir>0?f-3:f,y+Wd-6,3,4);cx.fillStyle="#d62828";cx.fillRect(c.dir>0?x:x+L-3,y+2,3,4);cx.fillRect(c.dir>0?x:x+L-3,y+Wd-6,3,4);
  if(n>.2){cx.save();cx.globalCompositeOperation="lighter";const g=cx.createLinearGradient(f,0,f+c.dir*90,0);g.addColorStop(0,`rgba(255,240,190,${.35*n})`);g.addColorStop(1,"rgba(255,240,190,0)");cx.fillStyle=g;cx.beginPath();cx.moveTo(f,y+2);cx.lineTo(f+c.dir*90,y-14);cx.lineTo(f+c.dir*90,y+Wd+14);cx.lineTo(f,y+Wd-2);cx.fill();cx.restore()}
}
export const tlT=()=>(performance.now()/1000)%17;
export const tl=()=>{const c=tlT();return c<9?"g":c<11?"y":"r"};
export function drawTL(x,y){cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+2,y,6,2.5,0,0,7);cx.fill();cx.fillStyle="#2b2f38";cx.fillRect(x-1.5,y-56,3,56);rr(x-5,y-80,10,26,3);cx.fill();
  const st=tl();[["r","#ff3b30",-75],["y","#ffcc00",-67],["g","#34c759",-59]].forEach(([k,c,o])=>{cx.fillStyle=st===k?c:"#444";cx.beginPath();cx.arc(x,y+o,3,0,7);cx.fill();if(st===k)EMIS.push({x:x-3,y:y+o-3,w:6,h:6,c,a:1})})}
export function updCars(dt){
  VIS.carT=(VIS.carT||0)-dt;VIS.cars=VIS.cars||[];
  if(VIS.carT<=0){VIS.carT=1.6+Math.random()*3.2;if(VIS.cars.length<(LITE()?4:8)){const dir=Math.random()<.5?1:-1,bike=Math.random()<.16,sp=bike?140:85+rnd(60);VIS.cars.push({x:dir>0?CX0-90:CX1+90,y:bike?(dir>0?625:681):(dir>0?637:671),dir,sp,v:sp,col:pick(["#e3350d","#3f7fc4","#f2b705","#2fa557","#eeeeee","#222","#8e4cb5","#e07a2f"]),len:bike?22:pick([46,50,58]),bus:!bike&&Math.random()<.1,bike,out:bike?mkOutfit("collector",null):null,skin:pick(SKINS),ph:0})}}
  const Ln=c=>c.bus?100:c.len,st=tl();
  VIS.cars.forEach(c=>{let tgt=c.van&&c.st==="unload"?0:c.sp;if(c.bus&&c.dir>0){if(!c.stopped&&c.x>=725&&c.x<770){c.stopped=1;c.hold=3;VIS.busP=null}if(c.hold>0){c.hold-=dt;tgt=0}}const fr=c.x+c.dir*Ln(c)/2;
    if(st!=="g")(c.dir>0?[552,1084]:[638,1166]).forEach(stop=>{const dist=(stop-fr)*c.dir;if(dist>-3&&dist<80)tgt=dist<3?0:Math.min(tgt,dist*1.6)});
    VIS.cars.forEach(o=>{if(o===c||o.dir!==c.dir||Math.abs(o.y-c.y)>8)return;const gap=(o.x-c.x)*c.dir-(Ln(o)+Ln(c))/2;if(gap>-5&&gap<70)tgt=Math.min(tgt,Math.max(0,(gap-12)*2))});
    c.v+=clamp(tgt-c.v,-240*dt,110*dt);c.x+=c.dir*c.v*dt;c.ph+=c.v*dt*.25});
  VIS.cars=VIS.cars.filter(c=>c.x>CX0-140&&c.x<CX1+140);
}
export function drawBike(c){
  const x=c.x,y=c.y;cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+2,y+2,14,3,0,0,7);cx.fill();
  cx.strokeStyle="#222";cx.lineWidth=2;[-8,8].forEach(d=>{cx.beginPath();cx.arc(x+d,y-4,5,0,7);cx.stroke()});cx.beginPath();cx.moveTo(x-8,y-4);cx.lineTo(x,y-11);cx.lineTo(x+8,y-4);cx.stroke();
  const o=c.out;o.skin=c.skin;o.mv=true;o.ph=c.ph;o.mood="happy";o.face=c.dir;o.arm=null;o.bag=false;o.phone=false;o.sc=.85;drawPerson(x-c.dir*2,y-8,o);
  cx.fillStyle="#e07a2f";rr(x-c.dir*14-7,y-34,14,13,2);cx.fill();cx.fillStyle="#fff";cx.fillRect(x-c.dir*14-4,y-29,8,2);
}
export function updVan(dt){
  const d=hasState()&&S.deliv;if(!d)return;let v=VIS.van;
  if(!v&&d.length){v=VIS.van={x:-160,y:637,dir:1,sp:150,v:150,van:true,st:"in",t:0,len:62,col:"#f4f4f4"};VIS.cars=VIS.cars||[];VIS.cars.push(v)}
  if(!v)return;
  if(v.st==="in"&&v.x>=410){v.st="unload";v.t=2.4;v.v=0;ui.tone(520,0,.12,"square",.03);ui.tone(520,.18,.12,"square",.03)}
  if(v.st==="unload"){v.t-=dt;v.v=0;if(v.t<=0){deliverNow();v.st="out"}}
  if(v.st==="out"&&v.x>CX1+60){VIS.cars=VIS.cars.filter(c=>c!==v);VIS.van=null}
}
export function drawVanExtras(v){if(!v||v.st!=="unload")return;const k=1-v.t/2.4,ph=(k*2)%1,go=Math.floor(k*2)%2===0,px=v.x-10+(358-(v.x-10))*(go?ph:1-ph),py=622+(578-622)*(go?ph:1-ph);
  const o=VIS.drv||(VIS.drv=Object.assign(mkOutfit("collector",null),{shirt:"#e07a2f",hat:"cap",hatc:"#e07a2f"}));o.skin="#c98a5c";o.mv=true;o.ph=performance.now()/80;o.mood="happy";o.face=go?-1:1;o.arm=null;o.bag=false;o.phone=false;drawPerson(px,py,o);if(go){cx.fillStyle="#c49a5a";rr(px-8,py-38,16,13,2);cx.fill();cx.fillStyle="#8a6a3a";cx.fillRect(px-8,py-33,16,2)}}
export function drawVan(c){const L=c.len,x=c.x-L/2,y=c.y-12;cx.fillStyle="rgba(0,0,0,.3)";rr(x+3,y+4,L,24,6);cx.fill();cx.fillStyle="#f4f4f4";rr(x,y,L,24,5);cx.fill();cx.fillStyle="#e07a2f";cx.fillRect(x+4,y+9,L-24,6);cx.fillStyle="#1d2633";rr(x+L-18,y+3,14,18,3);cx.fill();txt("MAYORISTA",x+(L-20)/2,y+21,6,"#2a2f3a","center");cx.fillStyle="#fff6c0";cx.fillRect(x+L-3,y+2,3,4);cx.fillRect(x+L-3,y+18,3,4)}
export function updVCars(dt){
  VIS.vT=(VIS.vT||2)-dt;VIS.vcars=VIS.vcars||[];
  if(VIS.vT<=0){VIS.vT=4+Math.random()*5;if(VIS.vcars.length<3){const dir=Math.random()<.5?1:-1;VIS.vcars.push({x:dir>0?XS0+18:XS1-18,y:dir>0?CY0-60:CY1+60,dir,sp:90,v:90,col:pick(["#e3350d","#3f7fc4","#f2b705","#2fa557","#eeeeee","#222"]),len:pick([46,50])})}}
  const st=tl();VIS.vcars.forEach(c=>{let tgt=c.sp;const fr=c.y+c.dir*c.len/2;if(st!=="r"){const stop=c.dir>0?566:742,dist=(stop-fr)*c.dir;if(dist>-3&&dist<80)tgt=dist<3?0:Math.min(tgt,dist*1.6)}
    VIS.vcars.forEach(o=>{if(o===c||o.dir!==c.dir)return;const gap=(o.y-c.y)*c.dir-(o.len+c.len)/2;if(gap>-5&&gap<60)tgt=Math.min(tgt,Math.max(0,(gap-12)*2))});
    c.v+=clamp(tgt-c.v,-240*dt,110*dt);c.y+=c.dir*c.v*dt});VIS.vcars=VIS.vcars.filter(c=>c.y>CY0-120&&c.y<CY1+120);
}
export function drawVCar(c){cx.save();cx.translate(c.x,c.y);cx.rotate(c.dir>0?Math.PI/2:-Math.PI/2);drawCar(Object.assign({},c,{x:0,y:0,dir:1,bike:false,bus:false}));cx.restore()}
