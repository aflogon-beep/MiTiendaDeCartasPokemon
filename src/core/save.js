// Guardado en localStorage (claves pcs-save-real-v3 / pcs-save-offline-v3) y exportación {app,v,mode,date,S}.
import { emit } from "./bus.js";
import { S, G, hasState } from "./state.js";

export const skey=()=>"pcs-save-"+G.MODE+"-v3";
export const save=()=>saveNow();
export function saveNow(){
  if(!hasState())return false;S.savedAt=Date.now();const js=JSON.stringify(S);
  try{localStorage.setItem(skey(),js);return true}catch(e){
    try{Object.keys(localStorage).filter(k=>k.startsWith("pcs-set")).forEach(k=>localStorage.removeItem(k));localStorage.setItem(skey(),js);return true}
    catch(e2){emit("toast","⚠️ No se pudo guardar. Exporta una copia en Más → Partida");return false}}
}
export const exportStr=()=>JSON.stringify({app:"pcs",v:5,mode:G.MODE,date:new Date().toISOString(),S});
