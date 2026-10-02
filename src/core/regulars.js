// Clientes habituales: datos, fidelidad y corazones.
import { REGS } from "./constants.js";
import { S } from "./state.js";
import { pick } from "./rng.js";
export const RG=id=>REGS.find(r=>r.id===id);
export function regS(id){return S.regs[id]||(S.regs[id]={loy:30,visits:0,note:"",met:false,fav:pick(S.sets)})}
export const hearts=l=>{const n=Math.round(l/20);return "❤️".repeat(n)+"🤍".repeat(5-n)};
