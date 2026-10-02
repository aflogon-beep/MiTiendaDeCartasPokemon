// Luz: sol y sombras, noche y ambiente según la hora.
import { AX, CX0, CX1, CY0, CY1, FRONT_Y, W } from "../world/layout.js";
import { CITYWIN, LAMPS } from "./city.js";
import { LITE, VIS, cx } from "./canvas.js";
import { S } from "../core/state.js";
import { clamp } from "../core/util.js";
import { dayT } from "../core/day.js";
import { level, tierOf } from "../core/economy.js";
export function lighting(){
  const t=dayT(),n=nightK(),gold=t>.45&&t<.9?Math.sin((t-.45)/.45*Math.PI):0,A=CX0,B=CY0,Wd=CX1-CX0,Hd=CY1-CY0;
  if(t<.1&&S.phase!=="closed"){cx.fillStyle=`rgba(255,230,190,${.08*(1-t/.1)})`;cx.fillRect(A,B,Wd,Hd)}
  if(gold>0){cx.fillStyle=`rgba(255,140,50,${.12*gold})`;cx.fillRect(A,B,Wd,Hd)}
  if(n>0){
    cx.fillStyle=`rgba(12,18,52,${.62*n})`;cx.fillRect(AX(),0,W-AX(),FRONT_Y);
    cx.fillStyle=`rgba(8,12,40,${.66*n})`;cx.fillRect(A,B,Wd,-B);cx.fillRect(A,0,AX()-A,FRONT_Y);cx.fillRect(W,0,CX1-W,FRONT_Y);cx.fillRect(A,FRONT_Y,Wd,CY1-FRONT_Y);
    cx.save();cx.globalCompositeOperation="lighter";
    const pool=(x,y,r,a,c)=>{const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2)};
    [[170,190],[450,190],[170,430],[450,430],[700,300]].forEach(([x,y])=>pool(x,y,150,.075*n,"255,236,190"));
    pool(195,430,140,(S.decor.lights?.2:.08)*n,"190,235,255");
    LAMPS.forEach(([x,y,s])=>pool(x+(s>0?12:-12),y-30,85,.3*n,"255,230,160"));
    CITYWIN.forEach(([x,y,w,h],i)=>{if((i*7)%5===0)return;cx.fillStyle=`rgba(255,200,110,${.42*n})`;cx.fillRect(x,y,w,h);pool(x+w/2,y+h,40,.12*n,"255,200,120")});
    pool(W/2,600,200,.18*n,"255,230,190");
    if(S.decor.neon)pool(612,24,70,.35*n,"255,90,220");
    if(tierOf(level())===3)pool(W/2,22,180,.25*n,"255,215,90");
    cx.restore();
  }
}
export function nightK(){if(VIS.endAt)return 1;if(S.phase==="closed"&&VIS.dawn>0)return VIS.dawn;return clamp((dayT()-.72)/.28,0,1)}
export function ambient(){
  if(LITE())return;
  const t=dayT(),now=performance.now()/1000;
  if(S.phase==="closed"||t<.35){const k=S.phase==="closed"?.7:1-t/.35;
    cx.save();cx.globalCompositeOperation="lighter";
    [[120,560],[250,560],[520,560],[660,560]].forEach(([x,y],i)=>{const g=cx.createLinearGradient(x,y,x-90,y-260);g.addColorStop(0,`rgba(255,240,200,${.1*k})`);g.addColorStop(1,"rgba(255,240,200,0)");cx.fillStyle=g;cx.beginPath();cx.moveTo(x-30,y);cx.lineTo(x+30,y);cx.lineTo(x-60,y-260);cx.lineTo(x-140,y-260);cx.fill()});
    for(let i=0;i<36;i++){const bx=[120,250,520,660][i%4],ph=i*1.7,yy=560-((now*9+i*23)%240),xx=bx-(560-yy)*.35+Math.sin(now*.7+ph)*10;cx.fillStyle=`rgba(255,250,220,${.5*k*(.4+.6*Math.sin(now*2+ph)**2)})`;cx.beginPath();cx.arc(xx,yy,1.1,0,7);cx.fill()}
    cx.restore();}
}
export const SUN={dx:10,a:.2};
export function sunUpd(){const t=S.phase==="closed"?(VIS.endAt?1:.18):dayT(),n=nightK();SUN.dx=(.5-t)*30;SUN.a=.2*(1-n*.7)}
