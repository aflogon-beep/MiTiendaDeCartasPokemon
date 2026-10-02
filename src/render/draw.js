// Dibuja un fotograma completo: ciudad, tienda, personas y efectos, ordenados por profundidad.
import { buildBG, decorObjs, drawAnnex, drawCams, drawCase, drawCounter, drawDecorFloor, drawDesk, drawFrontWall, drawHunt, drawLQ, drawLux, drawProd, drawShelf, drawShutter, drawTrophy, drawWall, launchQ } from "./shop.js";
import { CAT, drawPet } from "./pets.js";
import { LAMPS, buildCity, cityTrees, drawBird, drawBusStop, drawColeKids, drawCross, drawFountain, drawMarket, drawRival, drawStreet, drawSweeper, drawSwings, drawTerrace, drawTree, streetLamp } from "./city.js";
import { CV, LITE, VIS, cx, txt } from "./canvas.js";
import { CX0, CX1, CY0, CY1, FRONT_Y, LAY, LUX, TROPHY, W } from "../world/layout.js";
import { FX, drawAlarm, drawEvBanner, drawPfx, drawThiefFx } from "./effects.js";
import { G, S, meCfg, slotCount } from "../core/state.js";
import { VIEW } from "./camera.js";
import { ambient, lighting, sunUpd } from "./lighting.js";
import { bloom, emitStatic } from "./bloom.js";
import { custs, front } from "../core/customers/move.js";
import { drawCar, drawTL, drawVCar, drawVanExtras } from "./cars.js";
import { drawCust, drawPed, drawPersonAt, reflect } from "./people.js";
import { level, tierOf } from "../core/economy.js";
import { season } from "../core/events.js";
import { streetFx } from "./weather.js";
import { trophyOn } from "../core/trophies.js";
// Fondos ya dibujados (se rehacen cuando cambian G.BGk / G.CITYk)
let BG=null,CITY=null;
export function draw(){
  sunUpd();emitStatic();
  const V=VIEW,t=tierOf(level()),se=season();cx.setTransform(1,0,0,1,0,0);cx.fillStyle="#0b0e14";cx.fillRect(0,0,CV.width,CV.height);
  const sk=VIS.shake||0,sx=(Math.random()-.5)*sk,sy=(Math.random()-.5)*sk;VIS.shake=sk>.2?sk*.88:0;
  cx.setTransform(V.dpr*V.s,0,0,V.dpr*V.s,V.dpr*(V.ox+sx),V.dpr*(V.oy+sy));
  cx.save();cx.beginPath();cx.rect(CX0,CY0,CX1-CX0,CY1-CY0);cx.clip();
  {const ck=se+(S.annex?"A":"");if(G.CITYk!==ck){CITY=buildCity(se);G.CITYk=ck}}
  {const bk=t+"|"+(S.style||"clasico")+"|"+(S.annex?1:0);if(G.BGk!==bk){BG=buildBG(t);G.BGk=bk}}
  cx.drawImage(CITY,CX0,CY0);drawStreet();drawCross();
  cx.drawImage(BG,0,0,W,FRONT_Y);if(S.annex){cx.drawImage(BG,40,0,552,FRONT_Y*2,-276,0,276,FRONT_Y);drawAnnex()}drawWall();drawCams();drawDecorFloor();drawHunt();
  custs.forEach(reflect);
  const f=front();if(f){cx.strokeStyle="#f2b705";cx.lineWidth=3;cx.beginPath();cx.ellipse(f.x,f.y,18,8,0,0,7);cx.stroke()}
  const L=[];
  if((S.pet||"cat")!=="none")L.push({y:CAT.y,f:drawPet});if(S.decor.lux)for(let i=0;i<3;i++)L.push({y:LUX[i][1],f:()=>drawLux(i)});
  {const lq=launchQ();if(lq)lq.forEach(p=>L.push({y:p.y,f:()=>drawLQ(p)}))}
  for(let i=0;i<slotCount();i++){const s=LAY.shelf(i);L.push({y:s.y+s.h,f:()=>drawShelf(i)})}
  L.push({y:128,f:drawDesk});L.push({y:LAY.prod.y+LAY.prod.h,f:drawProd});
  {const c=LAY.cs();L.push({y:c.y+c.h,f:drawCase})}
  L.push({y:LAY.counter.y+LAY.counter.h,f:drawCounter});
  L.push({y:LAY.cashier.y,f:()=>drawPersonAt(LAY.cashier.x,LAY.cashier.y,{col:meCfg().shirt,hair:meCfg().hair,cap:meCfg().cap,sc:1},"#f2c9a0",0,false,"cashier")});
  if(S.staff.cashier)L.push({y:250,f:()=>drawPersonAt(748,250,{col:"#2fa557",hair:"#5a3a2a",sc:1,cap:"#2fa557"},"#e0a878",0,false,"cashier")});
  if(S.staff.appraiser)L.push({y:150,f:()=>drawPersonAt(706,150,{col:"#6b4ea8",hair:"#ddd",sc:1},"#f2c9a0",0,false,"collector")});
  if(S.tour&&S.decor.table&&S.phase!=="closed")[[175,262],[300,262],[175,356],[300,356]].forEach(([x,y],i)=>L.push({y,f:()=>drawPersonAt(x,y,{col:["#3d7bd9","#d9402a","#2fa557","#8e4cb5"][i],hair:"#222",sc:.9},["#f2c9a0","#e0a878","#a9714b","#f2c9a0"][i],0,false,i%2?"collector":"kid")}));
  decorObjs(L);if(trophyOn())L.push({y:TROPHY.y+TROPHY.d,f:drawTrophy});
  custs.forEach(c=>L.push({y:c.y,f:()=>drawCust(c)}));custs.forEach(c=>{if(c.run&&!c.caught)L.push({y:c.y+.5,f:()=>drawThiefFx(c)})});
  L.push({y:FRONT_Y+1,f:drawFrontWall});L.push({y:FRONT_Y+2,f:drawShutter});
  VIS.ped.forEach(p=>L.push({y:p.y,f:()=>drawPed(p)}));
  (VIS.cars||[]).forEach(c=>L.push({y:c.y,f:()=>drawCar(c)}));
  cityTrees().forEach(([x,y])=>L.push({y,f:()=>drawTree(x,y)}));
  LAMPS.forEach(([x,y,s])=>L.push({y,f:()=>streetLamp(x,y,s)}));
  L.push({y:606,f:drawBusStop});L.push({y:600,f:drawTerrace});L.push({y:598,f:drawSweeper});L.push({y:871,f:drawFountain});L.push({y:800,f:drawSwings});L.push({y:860,f:drawColeKids});L.push({y:781,f:drawMarket});L.push({y:740,f:drawRival});if(VIS.van)L.push({y:612,f:()=>drawVanExtras(VIS.van)});(VIS.vcars||[]).forEach(c=>L.push({y:c.y,f:()=>drawVCar(c)}));
  L.push({y:612,f:()=>drawTL(546,612)});L.push({y:694,f:()=>drawTL(642,694)});
  if(!LITE())(VIS.birds||[]).forEach(b=>L.push({y:b.y+(b.st==="fly"?400:0),f:()=>drawBird(b)}));
  L.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  streetFx();ambient();lighting();drawPfx();
  FX.forEach(f=>{cx.globalAlpha=Math.min(1,f.a);txt(f.t,f.x,f.y,18,f.col,"center");cx.globalAlpha=1});
  cx.restore();
  bloom();
  cx.save();cx.setTransform(V.dpr,0,0,V.dpr,0,0);drawAlarm();if(S.ui&&S.ui.fps){cx.fillStyle="#000a";cx.fillRect(6,6,104,20);txt(`${Math.round(VIS.fpsE||0)} FPS${LITE()?" · ahorro":""}`,12,21,12,"#7fe3a0")}cx.restore();
  cx.setTransform(V.dpr,0,0,V.dpr,0,0);
  const vg=cx.createRadialGradient(V.cw/2,V.ch/2,Math.min(V.cw,V.ch)*.35,V.cw/2,V.ch/2,Math.max(V.cw,V.ch)*.75);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.25)");cx.fillStyle=vg;cx.fillRect(0,0,V.cw,V.ch);
  drawEvBanner();
  if(G.paused){cx.fillStyle="rgba(10,14,22,.6)";cx.fillRect(0,0,V.cw,V.ch);txt("PAUSA",V.cw/2,V.ch/2,46,"#fff","center");txt("Pulsa ⏸ o el botón de abajo para seguir",V.cw/2,V.ch/2+30,14,"#cbd5e1","center")}
}
