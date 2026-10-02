// Navegación de los clientes: cuadrícula de obstáculos, A* y rutas desde la calle hasta su destino.
import { AX, FRONT_Y, LAY, LUX, TROPHY, W } from "./layout.js";
import { S, slotCount } from "../core/state.js";
import { caseCap } from "../core/economy.js";
import { season } from "../core/events.js";
import { trophyOn } from "../core/trophies.js";
export const NG={cs:10,x0:-280,y0:44,cols:108,rows:54,g:null,sig:""};
export function navSig(){return [trophyOn()?1:0,S.annex?1:0,slotCount(),caseCap(),S.decor.table,S.decor.sofa,S.decor.coffee,S.decor.lux,S.decor.plants,season(),!!(S.prodSeen||Object.keys(S.prod||{}).some(k=>S.prod[k]>0))].join("|")}
export function navObstacles(){
  const o=[],P=(x0,y0,x1,y1,pad)=>o.push([x0,y0,x1,y1,pad==null?9:pad]);
  P(-600,0,AX()+8,620,0);P(792,0,840,620,0);P(-600,-40,840,54,0);P(-600,544,322,584,0);if(S.annex){[[-215,365],[-150,405],[-85,362]].forEach(([x,y])=>P(x-16,y-12,x+16,y+10,4));P(-14,44,14,64,2);P(-14,510,14,560,2)}P(394,544,840,584,0);
  for(let i=0;i<slotCount();i++){const s=LAY.shelf(i);P(s.x-4,s.y+s.h-26,s.x+s.w+4,s.y+s.h)}
  if(S.prodSeen||Object.keys(S.prod||{}).some(k=>S.prod[k]>0)){const b=LAY.prod;P(b.x-4,b.y+b.h-26,b.x+b.w+4,b.y+b.h)}
  {const c=LAY.cs();P(c.x-6,c.y,c.x+c.w+6,c.y+c.h)}
  {const c=LAY.counter;P(c.x-4,c.y-4,c.x+c.w+4,c.y+c.h)}
  P(712,120,800,480,0);P(642,98,772,128);
  [[20,490],[782,500],[610,118]].concat(S.decor.plants?[[562,248],[20,300],[610,450]]:[]).forEach(([x,y])=>P(x-10,y+2,x+10,y+18,6));
  if(S.decor.table){P(140,276,336,330);[[175,256],[300,256],[175,346],[300,346]].forEach(([x,y])=>P(x-8,y,x+8,y+10,4))}
  if(S.decor.sofa)P(510,488,610,518);
  if(trophyOn())P(TROPHY.x,TROPHY.y-6,TROPHY.x+TROPHY.w,TROPHY.y+TROPHY.d);
  if(S.decor.coffee)P(560,306,598,330);
  if(S.decor.lux)LUX.forEach(([x,y])=>P(x-17,y-20,x+17,y));
  const se=season();if(se==="xmas")P(452,512,488,532,6);if(se==="hallo")[[300,548],[412,548]].forEach(([x,y])=>P(x-12,y-10,x+12,y+2,4));
  return o;
}
export function navBuild(){
  const g=new Uint8Array(NG.cols*NG.rows);
  navObstacles().forEach(([x0,y0,x1,y1,p])=>{const c0=Math.max(0,Math.floor((x0-p-NG.x0)/NG.cs)),c1=Math.min(NG.cols-1,Math.floor((x1+p-NG.x0)/NG.cs)),r0=Math.max(0,Math.floor((y0-p-NG.y0)/NG.cs)),r1=Math.min(NG.rows-1,Math.floor((y1+p-NG.y0)/NG.cs));for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r*NG.cols+c]=1});
  NG.g=g;NG.sig=navSig();
}
export const navOk=(c,r)=>c>=0&&r>=0&&c<NG.cols&&r<NG.rows&&!NG.g[r*NG.cols+c];
export const navCell=(x,y)=>[Math.floor((x-NG.x0)/NG.cs),Math.floor((y-NG.y0)/NG.cs)];
export function navFree(c,r){if(navOk(c,r))return [c,r];for(let d=1;d<10;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;if(navOk(c+dx,r+dy))return [c+dx,r+dy]}return [c,r]}
export function navLOS(x0,y0,x1,y1){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/4);for(let i=1;i<=n;i++){const [c,r]=navCell(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);if(!navOk(c,r))return false}return true}
export function navPath(sx,sy,gx,gy){
  if(!NG.g||navSig()!==NG.sig)navBuild();
  if(navLOS(sx,sy,gx,gy))return [];
  const [sc,sr]=navFree(...navCell(sx,sy)),[gc,gr]=navFree(...navCell(gx,gy)),C=NG.cols,N=C*NG.rows;
  const gs=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),cl=new Uint8Array(N),hp=[];
  const h=(c,r)=>{const dx=Math.abs(c-gc),dy=Math.abs(r-gr);return dx+dy-.586*Math.min(dx,dy)};
  const push=(f,i)=>{hp.push([f,i]);let k=hp.length-1;while(k){const p=(k-1)>>1;if(hp[p][0]<=hp[k][0])break;[hp[p],hp[k]]=[hp[k],hp[p]];k=p}};
  const pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let k=0;for(;;){const a=2*k+1,b=a+1;let m=k;if(a<hp.length&&hp[a][0]<hp[m][0])m=a;if(b<hp.length&&hp[b][0]<hp[m][0])m=b;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];k=m}}return t};
  const si=sr*C+sc,gi=gr*C+gc;gs[si]=0;push(h(sc,sr),si);
  const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(hp.length){const [,i]=pop();if(cl[i])continue;cl[i]=1;if(i===gi)break;const c=i%C,r=(i-c)/C;
    for(const [dx,dy,w] of D){const nc=c+dx,nr=r+dy;if(!navOk(nc,nr))continue;if(dx&&dy&&(!navOk(c+dx,r)||!navOk(c,r+dy)))continue;const ni=nr*C+nc,ng=gs[i]+w;if(ng<gs[ni]){gs[ni]=ng;par[ni]=i;push(ng+h(nc,nr),ni)}}}
  if(gi!==si&&par[gi]<0)return [];
  const cells=[];for(let i=gi;i!==si&&i>=0;i=par[i])cells.push(i);cells.reverse();
  const pts=cells.map(i=>({x:NG.x0+(i%C+.5)*NG.cs,y:NG.y0+(Math.floor(i/C)+.5)*NG.cs}));
  const out=[];let cur={x:sx,y:sy},k=0;
  while(k<pts.length){let j=pts.length-1;while(j>k&&!navLOS(cur.x,cur.y,pts[j].x,pts[j].y))j--;out.push(pts[j]);cur=pts[j];k=j+1}
  while(out.length&&Math.hypot(out[out.length-1].x-gx,out[out.length-1].y-gy)<16&&navLOS(out.length>1?out[out.length-2].x:sx,out.length>1?out[out.length-2].y:sy,gx,gy))out.pop();
  return out;
}
export function routeTo(c,gx,gy){
  const inS=(x,y)=>x>AX()+4&&x<W-4&&y<FRONT_Y-6,si=inS(c.x,c.y),gi=inS(gx,gy),pts=[];
  if(!si&&!gi){c.wps=[];return}
  let sx=c.x,sy=c.y;if(!si){pts.push({x:358,y:600},{x:358,y:560});sx=358;sy=560}
  pts.push(...navPath(sx,sy,gi?gx:358,gi?gy:560));
  if(!gi)pts.push({x:358,y:560},{x:358,y:600});
  c.wps=pts;
}
