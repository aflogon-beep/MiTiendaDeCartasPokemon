// Las 8 medallas de la ciudad.
import { ui } from "./bus.js";
import { REGS } from "./constants.js";
import { S } from "./state.js";
import { albPct } from "./achievements.js";
export const MEDALS=[
  {id:"roca",n:"Medalla Roca",e:"🪨",c:"#a0826d",d:"Vende 25 sobres en la tienda.",v:()=>S.lt.psold||0,g:25,r:60},
  {id:"cascada",n:"Medalla Cascada",e:"💧",c:"#3f8fd9",d:"Atiende a 30 clientes.",v:()=>S.lt.served||0,g:30,r:60},
  {id:"trueno",n:"Medalla Trueno",e:"⚡",c:"#f2b705",d:"Saca de un sobre una carta de 20 € o más.",v:()=>S.lt.bestPull||0,g:20,r:80,eur:1},
  {id:"arcoiris",n:"Medalla Arcoíris",e:"🌈",c:"#2fa557",d:"Completa el 30 % de un set en el álbum.",v:()=>Math.round(Math.max(0,...S.sets.map(albPct))*100),g:30,r:80,pc:1},
  {id:"alma",n:"Medalla Alma",e:"💜",c:"#b13e93",d:"Ten 3 clientes habituales con 3 corazones o más.",v:()=>REGS.filter(r=>S.regs[r.id]&&S.regs[r.id].met&&S.regs[r.id].loy>=60).length,g:3,r:100},
  {id:"pantano",n:"Medalla Pantano",e:"🔮",c:"#6b4ea8",d:"Gana 5 minijuegos.",v:()=>S.lt.mgwins||0,g:5,r:80},
  {id:"volcan",n:"Medalla Volcán",e:"🔥",c:"#e3350d",d:"Ingresa 1.000 € en ventas.",v:()=>Math.round(S.lt.earned||0),g:1000,r:150,eur:1},
  {id:"tierra",n:"Medalla Tierra",e:"🌍",c:"#7a5a2b",d:"Consigue un 9 o un 10 en el gradeo.",v:()=>S.lt.gem9||0,g:1,r:150}
];
export function checkMedals(){if(!S.med)S.med={};MEDALS.forEach(m=>{if(!S.med[m.id]&&m.v()>=m.g){S.med[m.id]=S.day;S.money+=m.r;S.repB+=2;ui.medal(m.id)}})}
export const medCount=()=>Object.keys(S.med||{}).length;
