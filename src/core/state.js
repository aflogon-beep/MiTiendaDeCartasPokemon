// Estado de la partida.
// S: objeto con identidad estable. Para cargar o empezar una partida se usa replaceState(obj),
// que lo vacía y copia el nuevo; nunca S = …  hasState() dice si ya hay partida (antes S era null).
// G: variables sueltas del juego que se reasignan (modo de cartas, nota del HUD…).
import { SETDEF, BYS } from "./cards/sets.js";

export const S={};
let loaded=false;
export const hasState=()=>loaded;
export function replaceState(o){for(const k of Object.keys(S))delete S[k];Object.assign(S,o);loaded=true}

export const G={
  MODE:"offline", // "real" con cartas de la API; "offline" con cartas ilustradas
  NOTE:"",        // aviso del estado de las cartas que se añade a la pista del HUD
};

export let SETS=[];
export const slotCount=()=>3+3*S.up.shelf+(S.annex?2:0);
export function syncSets(){SETS=S.sets.map(id=>SETDEF.find(d=>d.id===id)).filter(d=>d&&BYS[d.id])}
export function assignSlots(){
  const n=slotCount();S.slots=(S.slots||[]).slice(0,n);while(S.slots.length<n)S.slots.push(null);
  SETS.forEach(sd=>{if(S.sealed[sd.id]>0&&!S.slots.includes(sd.id)){const i=S.slots.indexOf(null);if(i>=0)S.slots[i]=sd.id}});
}
