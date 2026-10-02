// Lluvia, nieve, hojas y pétalos según el evento y la temporada.
import { AX, FRONT_Y, W } from "../world/layout.js";
import { LITE, cx } from "./canvas.js";
import { S } from "../core/state.js";
import { VIEW } from "./camera.js";
import { season } from "../core/events.js";
export function streetFx(){
  const se=season(),t=performance.now()/1000,V=VIEW,vx0=-V.ox/V.s,vy0=-V.oy/V.s,vw=V.cw/V.s,vh=V.ch/V.s;
  const inShop=(x,y)=>x>AX()&&x<W&&y>0&&y<FRONT_Y;
  if(S.ev&&S.ev.t==="rain"){cx.strokeStyle="rgba(170,200,255,.6)";cx.lineWidth=1.2;cx.beginPath();for(let i=0,n=LITE()?40:140;i<n;i++){const x=vx0+((i*97+t*60)%vw),y=vy0+((i*37+t*300)%vh);if(inShop(x,y))continue;cx.moveTo(x,y);cx.lineTo(x-3,y+9)}cx.stroke()}
  let k=null;if(se==="xmas"||se==="winter")k="snow";else if(se==="autumn")k="leaf";else if(se==="spring")k="petal";if(!k)return;
  for(let i=0,n=LITE()?30:90;i<n;i++){const x=vx0+((i*71+t*(k==="snow"?12:25)+Math.sin(t+i)*14)%vw),y=vy0+((i*43+t*(k==="snow"?24:18))%vh);if(inShop(x,y))continue;
    if(k==="snow"){cx.fillStyle="rgba(255,255,255,.9)";cx.beginPath();cx.arc(x,y,1.8,0,7);cx.fill()}else{cx.fillStyle=k==="leaf"?["#d9822b","#b5451b","#e0b43a"][i%3]:"#ffb3d9";cx.beginPath();cx.ellipse(x,y,3,1.6,t*2+i,0,7);cx.fill()}}
}
