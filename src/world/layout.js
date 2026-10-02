// Distribución de la tienda y la ciudad (coordenadas del mundo): muebles, cola, vitrina, peanas, trofeos y ampliación.
import { S, hasState } from "../core/state.js";
import { caseCap } from "../core/economy.js";
import { rnd } from "../core/rng.js";
export const W=800;
export const H=640;
export const LAY={
  // Estanterías: 3 (o 6 con la segunda fila) en la tienda y 2 más en la ampliación (v16)
  shelf:i=>{const m=3+3*S.up.shelf;return i<m?({x:40+(i%3)*205,y:i<3?46:170,w:150,h:54}):{x:-258,y:i-m?170:46,w:150,h:54}},
  cs:()=>({x:60,y:390,w:270,h:caseCap()>8?92:58}),
  counter:{x:650,y:190,w:56,h:250},
  qx:622,qy:262,qs:32,door:{x:355,y:650},cashier:{x:748,y:330},
  prod:{x:372,y:258,w:170,h:62} // mueble de sellado y accesorios
};
export const FLOOR_T=48;
export const FRONT_Y=556;
export const CX0=-560;
export const CX1=W+560;
export const CY0=-300;
export const CY1=980;
export const LUX=[[452,452],[512,452],[572,452]];
export const AX=()=>hasState()&&S.annex?-276:0;
export const XS0=1090;
export const XS1=1160;
export const TROPHY={x:36,y:316,w:104,d:28};
export const admireSpot=()=>({x:TROPHY.x+TROPHY.w/2+rnd(30)-15,y:TROPHY.y+TROPHY.d+22+rnd(8)});
