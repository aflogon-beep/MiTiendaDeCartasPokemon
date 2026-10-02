// Tutorial de 12 pasos con Emma (textos de docs/intro/HISTORIA.md → «Emma en el tutorial»).
import { $, VIS } from "../render/canvas.js";
import { G, S, hasState } from "../core/state.js";
import { caseItems, sealedCount } from "../core/economy.js";
import { clamp } from "../core/util.js";
import { front } from "../core/customers/move.js";
import { hud } from "./hud.js";
import { CHARS, drawPortrait } from "../render/characters.js";
import { saveNow } from "../core/save.js";
import { sfx } from "../audio/sfx.js";
import { toast } from "./toast.js";
export const TUT = [
  {
    t: "Vale, hermanito. Te lo explico una vez y despacio, como a papá con el móvil.",
    next: true,
  },
  {
    t: "Primero, mercancía. Toca «Stock».",
    sel: () => (G.M && G.M !== "packs" ? "[data-a=close]" : "#nav [data-k=packs]"),
    done: () => G.M === "packs",
  },
  {
    t: "Compra 6 sobres. SEIS, Álvaro, no 600. Los clientes los cogen de las estanterías.",
    ex: "sweat",
    sel: () => (G.M === "packs" ? '[data-a=buyp][data-n="6"]' : "#nav [data-k=packs]"),
    done: () => sealedCount() > 0,
  },
  {
    t: "Este es el precio de cada sobre: se ajusta con − y +. La etiqueta verde ✅ significa que se venderán bien. Verde = dinero = sofá nuevo.",
    sel: () => (G.M === "packs" ? ".pn .step" : null),
    next: true,
  },
  {
    t: "Puedes abrir UNO. Uno. Para ver qué sale. No me mires así.",
    ex: "angry",
    sel: () => (G.M === "packs" ? '[data-a=open][data-n="1"]' : "#nav [data-k=packs]"),
    done: () => G.M === "open",
  },
  {
    t: "Desliza el dedo por el sobre para abrirlo y pasa las cartas. Las buenas brillan 😉",
    float: true,
    done: () => G.M !== "open" || (G.openState && G.openState.mode === "sum"),
  },
  {
    t: "Vamos a poner una carta a la venta. Cierra y toca «Cartas».",
    sel: () => (G.M && G.M !== "coll" ? "[data-a=close]" : "#nav [data-k=coll]"),
    done: () => G.M === "coll",
  },
  {
    t: "Las cartas buenas, a la vitrina. Se venden mejor que en tu mochila. Toca una carta y luego «A la vitrina».",
    sel: () => (G.M === "card" ? "[data-a=caseadd]" : G.M !== "coll" ? "#nav [data-k=coll]" : ".tiles .tile"),
    done: () => caseItems().length > 0,
  },
  {
    t: "¡Todo listo! Cierra el panel y sube la persiana. Yo vigilo… desde aquí.",
    sel: () => (G.M ? "[data-a=close]" : "#act"),
    done: () => S.phase !== "closed",
  },
  {
    t: "Los clientes entran, cogen lo que quieren y hacen cola en la caja. Cuando haya alguien esperando, pulsa «Cobrar» y cóbrale.",
    sel: () => (front() && !G.M ? "#act" : null),
    float: true,
    done: () => G.M === "ck" || G.M === "hag" || (S.lt.served || 0) >= 1,
  },
  {
    t: "Si paga en efectivo, devuelve bien el cambio tocando billetes y monedas del cajón. Lo voy a comprobar. Si paga con tarjeta, teclea el total en el TPV y pulsa OK.",
    float: true,
    done: () => (S.lt.served || 0) >= 1,
  },
  {
    t: "¡Lo hiciste! 🎉 Últimos consejos: en «Tareas» tienes encargos, misiones y logros; en «Álbum», tu colección; y en «Más» → Colecciones puedes añadir cualquier set de Pokémon. Ojo con las cartas falsas: examínalas antes de comprar. ¡Te regalo 100 € para empezar! Ahora a ganar dinero. Y Álvaro… nada de abrirlo todo.",
    ex: "stars",
    next: true,
    last: true,
  },
];
export let TUTV = { i: -1, el: null };
/** Retrato de Emma (la guía) como imagen, con la expresión pedida. Mismo tamaño que tenía el de Carla. */
export function guideImg(ex = "happy") {
  VIS.guide = VIS.guide || {};
  if (!VIS.guide[ex]) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 200;
    drawPortrait(c.getContext("2d"), CHARS.emma, ex, 160);
    VIS.guide[ex] = c.toDataURL();
  }
  return VIS.guide[ex];
}
export function tutEnd(done) {
  if (!S.tut) return;
  S.tut.on = false;
  const r = $("#tut");
  if (r) r.remove();
  TUTV.i = -1;
  if (done) {
    S.money += 100;
    toast("🎓 Tutorial completado · +100 €");
    sfx.ach();
  }
  saveNow();
  hud();
}
export function tutStep() {
  const T = S.tut,
    st = TUT[T.i];
  let r = $("#tut");
  if (!r) {
    r = document.createElement("div");
    r.id = "tut";
    document.body.appendChild(r);
  }
  r.innerHTML = `<div class="tdim" id="tdim"></div><div class="tspot" id="tspot" style="display:none"></div><div class="tbub" id="tbub"><img src="${guideImg(st.ex)}" alt=""><div style="flex:1;min-width:0"><b>Emma</b><p>${st.t}</p><div class="tbtn"><span class="n">${T.i + 1}/${TUT.length}</span>${st.last ? "" : '<button id="tskip">Saltar tutorial</button>'}${st.next ? `<button class="go" id="tnext">${st.last ? "¡A jugar!" : "Siguiente"}</button>` : ""}</div></div></div>`;
  const nx = $("#tnext");
  if (nx)
    nx.onclick = () => {
      if (st.last) tutEnd(true);
      else {
        T.i++;
        TUTV.i = -1;
      }
    };
  const sk = $("#tskip");
  if (sk)
    sk.onclick = () => {
      if (confirm("¿Saltar el tutorial? Puedes repetirlo en Más.")) tutEnd(false);
    };
  TUTV.i = T.i;
  TUTV.scrolled = false;
}
export function tutTick() {
  const T = hasState() && S.tut;
  if (!T || !T.on) {
    const r = $("#tut");
    if (r) {
      r.remove();
      TUTV.i = -1;
    }
    return;
  }
  if (T.i >= TUT.length) {
    tutEnd(true);
    return;
  }
  const st = TUT[T.i];
  if (st.done && st.done()) {
    T.i++;
    TUTV.i = -1;
    saveNow();
    return;
  }
  if (TUTV.i !== T.i) tutStep();
  const sel = st.sel ? st.sel() : null,
    el = sel ? document.querySelector(sel) : null,
    sp = $("#tspot"),
    dim = $("#tdim"),
    bub = $("#tbub");
  if (!bub) return;
  const H0 = innerHeight,
    bh = bub.offsetHeight;
  if (el && el.offsetParent !== null) {
    if (!TUTV.scrolled || TUTV.el !== el) {
      TUTV.scrolled = true;
      TUTV.el = el;
      const rr0 = el.getBoundingClientRect();
      if (rr0.top < 60 || rr0.bottom > H0 - 90) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const q = el.getBoundingClientRect(),
      pd = 6;
    sp.style.display = "block";
    dim.style.display = "none";
    sp.style.left = q.left - pd + "px";
    sp.style.top = q.top - pd + "px";
    sp.style.width = q.width + pd * 2 + "px";
    sp.style.height = q.height + pd * 2 + "px";
    let top = q.top + q.height / 2 > H0 / 2 ? q.top - bh - 18 : q.bottom + 18;
    top = clamp(top, 8, H0 - bh - 8);
    bub.style.top = top + "px";
    bub.style.bottom = "auto";
  } else {
    sp.style.display = "none";
    dim.style.display = st.float ? "none" : "block";
    if (st.float) {
      bub.style.top = (G.M === "open" ? 62 : 8) + "px";
      bub.style.bottom = "auto";
    } else {
      bub.style.top = Math.max(8, (H0 - bh) / 2) + "px";
      bub.style.bottom = "auto";
    }
  }
}
