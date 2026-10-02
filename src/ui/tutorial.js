// Tutorial de 12 pasos con Carla.
import { $, VIS } from "../render/canvas.js";
import { G, S, hasState } from "../core/state.js";
import { caseItems, sealedCount } from "../core/economy.js";
import { clamp } from "../core/util.js";
import { front } from "../core/customers/move.js";
import { hud } from "./hud.js";
import { portrait } from "../render/people.js";
import { saveNow } from "../core/save.js";
import { sfx } from "../audio/sfx.js";
import { toast } from "./toast.js";
export const TUT = [
  {
    t: "¡Hola! Soy Carla, tu socia 👋 Vamos a montar la tienda de cartas más top de la isla. Te enseño lo básico en un par de minutos.",
    next: true,
  },
  {
    t: "Primero necesitas producto. Toca «Stock».",
    sel: () => (G.M && G.M !== "packs" ? "[data-a=close]" : "#nav [data-k=packs]"),
    done: () => G.M === "packs",
  },
  {
    t: "Compra 6 sobres de este set. Los clientes los cogen de las estanterías.",
    sel: () => (G.M === "packs" ? '[data-a=buyp][data-n="6"]' : "#nav [data-k=packs]"),
    done: () => sealedCount() > 0,
  },
  {
    t: "Este es el precio de venta de cada sobre. Si lo pones muy alto, los clientes se van sin comprar. Se ajusta con − y +.",
    sel: () => (G.M === "packs" ? ".pn .step" : null),
    next: true,
  },
  {
    t: "¡Ahora lo divertido! Abre un sobre.",
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
    t: "Toca una carta y luego «A la vitrina». Lo que está en la vitrina lo pueden comprar los clientes.",
    sel: () => (G.M === "card" ? "[data-a=caseadd]" : G.M !== "coll" ? "#nav [data-k=coll]" : ".tiles .tile"),
    done: () => caseItems().length > 0,
  },
  {
    t: "¡Todo listo! Cierra el panel y abre la tienda.",
    sel: () => (G.M ? "[data-a=close]" : "#act"),
    done: () => S.phase !== "closed",
  },
  {
    t: "Los clientes entran, cogen lo que quieren y hacen cola en la caja. Cuando haya alguien esperando, pulsa «Cobrar».",
    sel: () => (front() && !G.M ? "#act" : null),
    float: true,
    done: () => G.M === "ck" || G.M === "hag" || (S.lt.served || 0) >= 1,
  },
  {
    t: "Si paga en efectivo, dale el cambio exacto tocando billetes y monedas del cajón. Si paga con tarjeta, teclea el total en el TPV y pulsa OK.",
    float: true,
    done: () => (S.lt.served || 0) >= 1,
  },
  {
    t: "¡Primera venta! 🎉 Últimos consejos: en «Tareas» tienes encargos, misiones y logros; en «Álbum», tu colección; y en «Más» → Colecciones puedes añadir cualquier set de Pokémon. Ojo con las cartas falsas: examínalas antes de comprar. ¡Te regalo 100 € para empezar!",
    next: true,
    last: true,
  },
];
export let TUTV = { i: -1, el: null };
export function guideImg() {
  return (
    VIS.guide ||
    (VIS.guide = portrait({
      shirt: "#e3350d",
      pants: "#2c3350",
      shoes: "#141414",
      hair: "#6b3a1e",
      hs: 2,
      skin: "#f2c9a0",
      logo: true,
      sc: 1,
      seed: 1,
    }))
  );
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
  r.innerHTML = `<div class="tdim" id="tdim"></div><div class="tspot" id="tspot" style="display:none"></div><div class="tbub" id="tbub"><img src="${guideImg()}" alt=""><div style="flex:1;min-width:0"><b>Carla</b><p>${st.t}</p><div class="tbtn"><span class="n">${T.i + 1}/${TUT.length}</span>${st.last ? "" : '<button id="tskip">Saltar tutorial</button>'}${st.next ? `<button class="go" id="tnext">${st.last ? "¡A jugar!" : "Siguiente"}</button>` : ""}</div></div></div>`;
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
