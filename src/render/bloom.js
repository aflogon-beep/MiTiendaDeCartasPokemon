// Brillo (bloom) de las luces.
import { CITYWIN, LAMPS } from "./city.js";
import { LAY, LUX, W } from "../world/layout.js";
import { LITE, VIS, cx } from "./canvas.js";
import { S } from "../core/state.js";
import { VIEW } from "./camera.js";
import { level, tierOf } from "../core/economy.js";
import { nightK } from "./lighting.js";
import { season } from "../core/events.js";
export const EMIS=[];
export let BLM=null;
export function emitStatic(){
  EMIS.length=0;const n=nightK(),t=tierOf(level()),E=(x,y,w,h,c,a)=>EMIS.push({x,y,w,h,c,a});
  const c=LAY.counter,ry=c.y+76;E(c.x+13,ry-8,30,10,"#7fe3a0",.7);E(c.x+17,ry+43,14,9,"#a8f0b8",.6);E(680,38,56,30,"#4cc98a",.45);
  const cs=LAY.cs();E(cs.x-6,cs.y+cs.h-21,cs.w+12,2,"#7fe3ff",.9);
  if(S.decor.neon)E(566,16,92,14,"#ff4fd8",.85);
  if(t===3)E(W/2-160,4,320,36,"#ffd54a",.4);else if(t===2)E(W/2-140,5,280,33,"#ff6a5d",.2);
  LAMPS.forEach(([x,y,s])=>E(s>0?x+6:x-18,y-66,12,8,"#fff3b0",n));
  CITYWIN.forEach(([x,y,w,h],i)=>{if((i*7)%5)E(x,y,w,h,"#ffc070",.75*n)});
  (VIS.cars||[]).forEach(cr=>{if(cr.bike)return;const L=cr.bus?100:cr.len,f=cr.dir>0?cr.x+L/2:cr.x-L/2,b=cr.dir>0?cr.x-L/2:cr.x+L/2;E(f-3,cr.y-11,6,22,"#fff6c0",n);E(b-2,cr.y-11,4,22,"#ff3030",.6*n+(cr.v<cr.sp*.5?.5:0))});
  if(S.decor.lux)LUX.forEach(([x,y])=>E(x-6,y-118,12,64,"#fff4c8",.2+.3*n));
  E(6,520,310,28,"#ffe0a0",.3*n);E(396,520,398,28,"#ffe0a0",.3*n);
  if(season()==="xmas")for(let x=10;x<W;x+=20)if(Math.sin(performance.now()/333+x)>0)E(x-2,2,4,6,["#ff4d4d","#ffd54a","#4dd2ff","#7dff7a"][(x/20)%4|0],.8);
}
export function bloom(){
  if(!EMIS.length||LITE())return;const V=VIEW,q=4,bw=Math.ceil(V.cw/q),bh=Math.ceil(V.ch/q);
  if(!BLM)BLM=document.createElement("canvas");if(BLM.width!==bw||BLM.height!==bh){BLM.width=bw;BLM.height=bh}
  const b=BLM.getContext("2d"),k=.35+.65*nightK();b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,bw,bh);b.setTransform(V.s/q,0,0,V.s/q,V.ox/q,V.oy/q);
  EMIS.forEach(e=>{const a=Math.min(1,e.a*k);if(a<.02)return;b.globalAlpha=a;b.fillStyle=e.c;b.fillRect(e.x,e.y,e.w,e.h)});b.globalAlpha=1;
  cx.save();cx.setTransform(V.dpr,0,0,V.dpr,0,0);cx.globalCompositeOperation="lighter";cx.filter="blur(5px)";cx.drawImage(BLM,0,0,V.cw,V.ch);cx.filter="none";cx.restore();
}
