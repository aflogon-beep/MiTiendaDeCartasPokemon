// Ropa y aspecto de cada cliente (colores, peinado, gorra, mochila…).
import { pick, rnd } from "../rng.js";
import { season } from "../events.js";
export const SHIRTS=["#4a90d9","#e3350d","#2fa557","#f2b705","#8e4cb5","#e07a2f","#1abc9c","#34495e","#d65fae","#95a5a6"];
export const PANTS=["#2c3350","#3b3b3b","#5a4632","#1f3a5f","#6b6b6b"];
export const HAIRC=["#2a1a0a","#6b3a1e","#c47a45","#111","#d9b36c","#8a8a8a"];
export function mkOutfit(type,R){
  const o={shirt:pick(SHIRTS),pants:pick(PANTS),shoes:pick(["#141414","#f4f4f4","#7a3b1a"]),hair:pick(HAIRC),hs:rnd(5),sc:type==="kid"?.82:1,seed:Math.random()*4};
  if(type==="kid"){o.hat=Math.random()<.5?"cap":null;o.hatc=pick(["#d9534f","#3f7fc4","#2fa557"]);o.acc=Math.random()<.6?"backpack":null;o.bp=pick(["#c0392b","#f2b705","#3f7fc4"]);o.logo=Math.random()<.5}
  if(type==="investor"){o.shirt=pick(["#2d3142","#3d4257","#1f2233"]);o.suit=true;o.hs=0}
  if(type==="whale"){o.chain=true;o.shades=Math.random()<.7;o.shirt=pick(["#d0a52a","#f5f5f5","#111"])}
  if(type==="collector"){o.glasses=Math.random()<.5;o.acc=Math.random()<.35?"backpack":null;o.bp="#555"}
  if(type==="seller"){o.shirt=pick(["#a25fb5","#555","#6b4527"]);o.hs=4}
  if(type==="lot"){o.hs=3;o.hair="#cfcfcf";o.shirt="#8a5a2b";o.glasses=true}
  if(R){o.shirt=R.col;o.hair=R.hair;({rafa:()=>{o.shades=true;o.hs=0},lucia:()=>{o.hs=2;o.glasses=true},iker:()=>{o.hat="cap";o.hatc="#3f7fc4";o.acc="backpack";o.bp="#f2b705"},marcos:()=>{o.suit=true;o.hs=0},aitana:()=>{o.hs=1;o.chain=true;o.shades=true},hugo:()=>{o.logo=true;o.acc="backpack";o.bp="#2f2f38"},paco:()=>{o.hs=3;o.glasses=true}}[R.id]||(()=>{}))()}
  const se=season();if(!o.hat){if(se==="xmas"&&Math.random()<.35)o.hat="santa";if(se==="hallo"&&Math.random()<.25)o.hat="witch"}if(se==="summer"&&Math.random()<.35)o.shades=true;
  return o;
}
