// Personalizar: tu personaje, la tienda y la mascota.
import { HAIRC2, PETS, SHIRTC, STYLES } from "../core/constants.js";
import { S, meCfg } from "../core/state.js";
import { portrait } from "../render/people.js";
export function mCustom() {
  const me = meCfg(),
    sw = (k, list) =>
      `<div class="sw">${list.map((c) => `<button class="swc${me[k] === c ? " on" : ""}" style="background:${c}" data-a="meset" data-k="${k}" data-n="${c}" aria-label="${c}"></button>`).join("")}</div>`;
  return `<h2>🎨 Personalizar</h2><div class="pn"><b>Nombre de la tienda</b><input class="inp" data-i="shopn" maxlength="22" placeholder="Poké Cards" value="${(S.shopName || "").replace(/"/g, "")}" style="margin:6px 0 0"><div class="mu">Sale en el cartel, en el escaparate y en el ticket.</div></div>
  <div class="pn" style="display:flex;gap:12px;align-items:center"><img src="${portrait(Object.assign({ pants: "#2c3350", shoes: "#141414", skin: "#f2c9a0", hat: "cap", hatc: me.cap, sc: 1, seed: 2 }, me))}" alt="" style="width:80px;height:100px;border-radius:12px;background:var(--panel2)"><div style="flex:1"><b>Tu tendero</b><div class="mu">Camiseta</div>${sw("shirt", SHIRTC)}<div class="mu">Gorra</div>${sw("cap", SHIRTC)}<div class="mu">Pelo</div>${sw("hair", HAIRC2)}</div></div>
  <div class="pn"><b>Mascota de la tienda</b><div class="btns">${Object.keys(PETS)
    .map(
      (k) =>
        `<button class="b ${(S.pet || "cat") === k ? "on" : ""}" data-a="petset" data-k="${k}">${PETS[k]}</button>`,
    )
    .join("")}</div></div>
  <div class="pn"><b>Estilo de la tienda</b><div class="btns">${Object.keys(STYLES)
    .map(
      (k) =>
        `<button class="b ${(S.style || "clasico") === k ? "on" : ""}" data-a="styset" data-k="${k}">${STYLES[k].c ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${STYLES[k].c};margin-right:6px;vertical-align:-1px"></span>` : ""}${STYLES[k].n}</button>`,
    )
    .join("")}</div></div>`;
}
