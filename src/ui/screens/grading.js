// Gradeo: cartas enviadas y revelación de notas.
import { certOf, slabOver } from "../slab.js";
import { $ } from "../../render/canvas.js";
import { BYID, setName } from "../../core/cards/sets.js";
import { COND, GSVC, GTXT } from "../../core/constants.js";
import { S } from "../../core/state.js";
import { TILT, askGyro, closeM, confetti, face, faceBig, holoOf, openM, ptTilt } from "../modals.js";
import { cardTabs } from "../nav.js";
import { fmt } from "../../core/util.js";
import { itemVal, price } from "../../core/economy.js";
import { rnd } from "../../core/rng.js";
import { rvr } from "../../core/cards/prices.js";
import { save } from "../../core/save.js";
import { sfx, vibe } from "../../audio/sfx.js";
import { toast } from "../toast.js";
import { quip } from "../quips.js";
export let GR = null;
export function slabHTML(c, rv, g, hide, it) {
  const h = holoOf(c, rv);
  // Etiqueta como la de verdad: marca, nombre, colección, nota, n.º de certificado y código de barras
  return `<div class="slab${hide ? "" : " g" + g}" style="--ho:${h.ho}"><div class="slab-lb"><div><i class="slab-brand">PGS</i><b>${c.name}</b><span>${setName(c.s)}${c.num ? " #" + c.num : ""}${rv ? " · Reverse" : ""}</span></div><div class="gnum">${hide ? "?" : g}</div><div class="gtx">${hide ? "" : GTXT[g]}</div>${it ? `<div class="slab-cert"><span>Cert. ${certOf(it)}</span><i class="slab-bar"></i></div>` : ""}</div><div class="slab-card">${faceBig(c, rv)}<div class="holo ${h.cl}"></div><div class="glare"></div></div><div class="glare2"></div></div>`;
}
export function openGrades() {
  if (!S.grNew || !S.grNew.length) {
    toast("No hay resultados nuevos");
    return;
  }
  GR = { ids: S.grNew.slice(), idx: 0 };
  S.grNew = [];
  save();
  openM("grev");
}
export function mountGR() {
  const g = GR;
  let it = null;
  while (g.idx < g.ids.length && !(it = S.items.find((i) => i.i === g.ids[g.idx]))) g.idx++;
  if (!it) {
    GR = null;
    TILT.el = null;
    closeM();
    return;
  }
  const c = BYID[it.c];
  g.ready = false;
  $("#ovh").innerHTML =
    `<div class="px" id="px" style="--sc:#c0392b"><div class="pxbar"><div><b>Resultados de gradeo</b><div class="pxrun">${g.idx + 1} de ${g.ids.length}</div></div><div class="step"><button class="ib" id="grclose">Cerrar</button></div></div><div class="pxstage" id="pxst"><div class="rays" id="pxrays"></div>${slabHTML(c, it.rv, it.gr, true, it)}</div><div class="pxhint" id="pxhint"><div class="cinfo"><div class="cv">Calificando…</div></div></div><div class="flash" id="pxflash"></div></div>`;
  const sl = $("#pxst .slab"),
    gn = sl.querySelector(".gnum");
  TILT.el = sl;
  $("#grclose").onclick = () => {
    GR = null;
    TILT.el = null;
    closeM();
  };
  $("#pxst").addEventListener("pointermove", ptTilt);
  $("#pxst").addEventListener("pointerdown", askGyro);
  sfx.charge(it.gr >= 9 ? 3 : 1);
  const iv = setInterval(() => {
    gn.textContent = 1 + rnd(10);
    sfx.tick();
  }, 85);
  setTimeout(() => {
    clearInterval(iv);
    if (!$("#px") || GR !== g) return;
    gn.textContent = it.gr;
    gn.classList.add("land");
    sl.querySelector(".gtx").textContent = GTXT[it.gr];
    sl.classList.add("g" + it.gr);
    const lv = it.gr >= 10 ? 3 : it.gr === 9 ? 2 : it.gr === 8 ? 1 : 0,
      v = itemVal(it),
      before = price(it.c) * (it.rv ? rvr(c) : 1) * COND[it.k];
    if (lv) {
      const fl = $("#pxflash");
      fl.classList.add("on");
      const ry = $("#pxrays");
      ry.style.setProperty("--rc", lv >= 3 ? "#ffd54a" : "#e3350d");
      ry.classList.add("on");
      confetti(lv, "#e3350d");
      sfx.hit(lv);
      vibe(lv >= 3 ? [60, 40, 140] : 40);
      $("#pxst").insertAdjacentHTML(
        "beforeend",
        `<div class="banner" style="--rc:#c0392b">${it.gr >= 10 ? "💎 GEM MINT 10 💎" : it.gr === 9 ? "MINT 9" : "NM-MT 8"}</div>`,
      );
    } else sfx.sad();
    if (it.gr >= 10) quip("gem");
    else if (it.gr <= 6) quip("lowgrade");
    $("#pxhint").innerHTML =
      `<div class="cinfo"><div><b style="color:#fff">${c.name}</b> · PGS ${it.gr} ${GTXT[it.gr]}</div><div class="cv ${v >= before ? "up" : "down"}">${fmt(v)}</div><div class="mu">Antes ${fmt(before)} · toca para ${g.idx < g.ids.length - 1 ? "la siguiente" : "terminar"}</div></div>`;
    g.ready = true;
  }, 1500);
  $("#pxst").addEventListener("click", () => {
    if (!g.ready) return;
    g.idx++;
    if (g.idx >= g.ids.length) {
      GR = null;
      TILT.el = null;
      closeM();
    } else mountGR();
  });
}
export function mGrading() {
  const q = S.items.filter((i) => i.gq),
    g = S.items.filter((i) => i.gr).sort((a, b) => itemVal(b) - itemVal(a));
  return (
    cardTabs("grading") +
    `<p class="mu">Envía cartas desde «Cartas»: selecciona una y pulsa Gradear. La nota depende del estado (una NM tiene más opciones de 9 o 10). Un 10 multiplica el valor ×4; una nota baja lo reduce.</p>
  ${S.grNew && S.grNew.length ? `<button class="b pri big" data-a="grades">📬 Ver ${S.grNew.length} resultado(s)</button>` : ""}
  <h3>En camino (${q.length})</h3>${
    q.length
      ? q
          .map((i) => {
            const c = BYID[i.c],
              d = i.gq.due - S.day;
            return `<div class="pn row"><span><b>${c.name}</b> <span class="mu">${i.k} · ${GSVC[i.gq.svc].n}</span></span><span class="mu">${d <= 1 ? "llega mañana" : "llega en " + d + " días"}</span></div>`;
          })
          .join("")
      : '<p class="mu">Nada en gradeo.</p>'
  }
  <h3>Cartas gradeadas (${g.length})</h3><div class="tiles">${g
    .slice(0, 120)
    .map((i) => {
      const c = BYID[i.c];
      return `<div class="tile zoomable" data-a="zoom" data-k="${c.id}" data-n="${i.rv ? 1 : 0}" data-g="${i.i}">${face(c, i.rv)}${slabOver(i.gr)}<div class="pt">${fmt(itemVal(i))}</div><div class="gb">PGS ${i.gr}</div></div>`;
    })
    .join("")}</div>`
  );
}
