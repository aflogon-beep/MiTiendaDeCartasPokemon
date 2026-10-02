// Historia por capítulos con objetivos y premios.
import { REGS } from "./constants.js";
import { S } from "./state.js";
import { albPct } from "./achievements.js";
import { medCount } from "./medals.js";
export const CHAP=[
  {t:"La gran apertura",i:"¡Por fin abrimos! Vamos a demostrar que esta tienda vale la pena.",g:[["Vende sobres","psold",5],["Atiende clientes","served",8]],e:"¡Primer gran día! Los vecinos ya hablan de nosotros.",r:50},
  {t:"Coleccionista novato",i:"Una buena tienda tiene que conocer bien sus cartas. ¡A llenar el álbum!",g:[["Completa % de un set del álbum","alb",15]],e:"¡Así se hace! Ya pareces un experto.",r:60},
  {t:"Clientes fieles",i:"Los clientes que vuelven son los mejores. Trátales con cariño.",g:[["Habituales con 3 corazones","fans",2]],e:"Ya tenemos fans. ¡Y eso se nota en la caja!",r:80},
  {t:"Ojo de tasador",i:"Comprar bien es tan importante como vender bien. Compra una carta a un cliente por debajo del 75 % de su valor.",g:[["Buenas compras","goodbuys",1]],e:"¡Eso es negociar!",r:80},
  {t:"La gran caja",i:"Hoy toca algo grande: abre una caja de 36 sobres.",g:[["Cajas abiertas","boxes",1]],e:"¡Qué emoción! Ahora a vender todos esos sobres.",r:100},
  {t:"Detective de cartas",i:"Hay alguien colando cartas falsas por el barrio… ¡Pilla una con la lupa!",g:[["Falsificaciones pilladas","caught",1]],e:"¡Caso resuelto! Nadie engaña a esta tienda.",r:120},
  {t:"Amigos de cartas",i:"Los habituales a veces quieren cambiar cartas. ¡Haz un intercambio!",g:[["Intercambios","trades",1]],e:"¡Intercambiar es lo mejor de coleccionar!",r:100},
  {t:"Leyenda de la calle",i:"El último reto: consigue 4 medallas de la ciudad.",g:[["Medallas","med",4]],e:"¡Eres una leyenda de la calle! Gracias por hacer esta tienda tan especial.",r:300}
];
export function chapVal(k){if(k==="alb")return Math.round(Math.max(0,...S.sets.map(albPct))*100);if(k==="fans")return REGS.filter(r=>S.regs[r.id]&&S.regs[r.id].loy>=60).length;if(k==="med")return medCount();return S.lt[k]||0}
export function story(){if(!S.story){S.story={ch:0,base:{},intro:false};CHAP[0].g.forEach(([,k])=>S.story.base[k]=chapVal(k))}return S.story}
export function chapProg(){const st=story(),c=CHAP[st.ch];if(!c)return null;return c.g.map(([n,k,g])=>{const abs=k==="alb"||k==="fans"||k==="med",v=abs?chapVal(k):chapVal(k)-(st.base[k]||0);return {n,v:Math.max(0,Math.min(g,v)),g}})}
