// Zona Funko: dibujo de las figuras (SVG) a partir de sus piezas (core/funko/catalog.js) y de su caja.
// Todas comparten el cuerpo de vinilo (cabezón, ojos negros, cuerpo pequeño); cada figura es una lista de
// piezas: piel o máscara, pelo, ojos, orejas, extras, capa, emblema y accesorio. Las variantes cambian el
// acabado: flocked (aterciopelado), brilla en la oscuridad, metálica, Diamond (purpurina) y oro.
import { FKCOL, parseLook } from "../../core/funko/catalog.js";

let UID = 0;
const SVG_CACHE = new Map();

const EM = {
  spider: '<path d="M50 80 L44 92 L50 89 L56 92Z" fill="#111"/><circle cx="50" cy="84" r="3" fill="#111"/>',
  bat: '<ellipse cx="50" cy="86" rx="11" ry="5.5" fill="#f2c21a"/><path d="M41 86 Q45 82 50 85 Q55 82 59 86 Q50 84 41 86Z" fill="#111"/>',
  S: '<path d="M40 79 L60 79 L64 85 L50 97 L36 85Z" fill="#f2c21a"/><text x="50" y="91" font-size="11" font-weight="900" text-anchor="middle" fill="#d0202a">S</text>',
  star: '<path d="M50 78 L52.5 84 L59 84 L54 88 L56 94 L50 90.5 L44 94 L46 88 L41 84 L47.5 84Z" fill="#fff"/>',
  arc: '<circle cx="50" cy="86" r="6" fill="#bff3ff"/><circle cx="50" cy="86" r="3" fill="#fff"/>',
  bolt: '<path d="M52 77 L44 88 L50 88 L47 97 L56 85 L50 85Z" fill="#f2c21a"/>',
  x: '<circle cx="50" cy="86" r="7" fill="#f2c21a"/><path d="M45 81 L55 91 M55 81 L45 91" stroke="#111" stroke-width="2.4"/>',
  hp: '<path d="M42 72 L50 84 L58 72" fill="#7a1018"/><path d="M44 72 L50 80 L56 72" fill="#e3b33c"/>',
  belt: '<rect x="28" y="96" width="44" height="6" fill="#6b4426"/><rect x="46" y="95" width="8" height="8" rx="1" fill="#e3b33c"/>',
  stripe: '<rect x="28" y="88" width="44" height="7" fill="#fff" opacity=".85"/>',
  dot: '<circle cx="50" cy="86" r="4" fill="#fff"/>',
  w: '<path d="M38 80 L42 92 L46 84 L50 92 L54 84 L58 92 L62 80" stroke="#f2c21a" stroke-width="3" fill="none"/>',
  bat2: '<path d="M38 84 Q44 78 50 83 Q56 78 62 84 Q56 82 50 88 Q44 82 38 84Z" fill="#111"/>',
  heart: '<path d="M50 92 L42 84 A4.5 4.5 0 0 1 50 79 A4.5 4.5 0 0 1 58 84Z" fill="#ff4d6d"/>',
  pkb: '<circle cx="50" cy="86" r="7" fill="#fff"/><path d="M43 86 A7 7 0 0 1 57 86Z" fill="#e3350d"/><circle cx="50" cy="86" r="2.2" fill="#fff" stroke="#111"/>',
  tie: '<path d="M48 74 L52 74 L54 92 L50 96 L46 92Z" fill="#d0202a"/>',
  bones: '<path d="M38 82 H62 M38 89 H62 M50 76 V96" stroke="#eee" stroke-width="2.4"/>',
};

function hairSVG(o, hc) {
  const H = o.hair;
  if (!H || H === "bald") return "";
  const P = {
    short: `<path d="M8 34 Q8 6 50 6 Q92 6 92 34 Q80 20 50 22 Q20 20 8 34Z" fill="${hc}"/>`,
    messy: `<path d="M6 36 Q2 2 50 4 Q98 2 94 36 L86 24 L78 30 L68 18 L58 26 L48 16 L38 26 L28 18 L18 30Z" fill="${hc}"/>`,
    spiky: `<path d="M4 34 L-6 6 L18 14 L16 -12 L36 6 L50 -18 L64 6 L84 -12 L82 14 L106 6 L96 34 Q50 14 4 34Z" fill="${hc}"/>`,
    wild: `<path d="M2 40 L-10 20 L6 18 L-2 -2 L22 8 L26 -14 L44 2 L56 -16 L64 4 L84 -10 L82 12 L106 16 L96 40 Q50 16 2 40Z" fill="${hc}"/>`,
    naruto: `<path d="M4 34 L-4 10 L16 16 L14 -6 L32 8 L50 -10 L68 8 L86 -6 L84 16 L104 10 L96 34 Q50 18 4 34Z" fill="${hc}"/><rect x="10" y="22" width="80" height="9" rx="3" fill="#3a5bd0"/><rect x="40" y="22" width="20" height="9" rx="2" fill="#c9d3e6"/>`,
    buzz: `<path d="M10 30 Q10 8 50 8 Q90 8 90 30 Q70 22 50 22 Q30 22 10 30Z" fill="${hc}" opacity=".85"/>`,
    bun: `<circle cx="50" cy="0" r="12" fill="${hc}"/><path d="M8 34 Q8 6 50 6 Q92 6 92 34 Q80 18 50 20 Q20 18 8 34Z" fill="${hc}"/>`,
    mohawk: `<path d="M38 22 L40 -16 L50 -4 L56 -18 L62 22Z" fill="${hc}"/>`,
    curly: `${[10, 26, 42, 58, 74, 90].map((x) => `<circle cx="${x}" cy="${x === 10 || x === 90 ? 26 : 12}" r="12" fill="${hc}"/>`).join("")}`,
    pony: `<path d="M86 24 Q112 34 100 64 Q96 44 84 34Z" fill="${hc}"/><path d="M8 34 Q8 4 50 4 Q92 4 92 34 Q74 16 50 18 Q26 16 8 34Z" fill="${hc}"/>`,
    crown: `<path d="M8 34 Q8 6 50 6 Q92 6 92 34 Q80 20 50 22 Q20 20 8 34Z" fill="${hc}"/><path d="M26 10 L32 -8 L42 4 L50 -12 L58 4 L68 -8 L74 10Z" fill="#e3b33c"/>`,
    tiara: `<path d="M8 36 Q8 4 50 4 Q92 4 92 36 Q74 16 50 18 Q26 16 8 36Z" fill="${hc}"/><path d="M34 14 L50 6 L66 14 L50 18Z" fill="#e3b33c"/><circle cx="50" cy="12" r="2.5" fill="#d0202a"/>`,
    hood: `<path d="M0 50 Q-2 -6 50 -6 Q102 -6 100 50 L90 50 Q90 10 50 10 Q10 10 10 50Z" fill="${hc}"/>`,
    hat: `<path d="M-2 22 L102 22 L102 28 L-2 28Z" fill="${hc}"/><path d="M18 22 Q20 -10 50 -10 Q80 -10 82 22Z" fill="${hc}"/>`,
    witch: `<path d="M-6 24 L106 24 L106 30 L-6 30Z" fill="${hc}"/><path d="M24 24 L56 -30 L76 24Z" fill="${hc}"/>`,
    cap: `<path d="M6 30 Q8 2 50 2 Q92 2 94 30Z" fill="${o.cc || hc}"/><rect x="2" y="26" width="58" height="8" rx="4" fill="${o.cc || hc}"/><circle cx="50" cy="16" r="8" fill="#fff"/><text x="50" y="20" font-size="10" font-weight="900" text-anchor="middle" fill="${o.cc || hc}">${o.capl || "M"}</text>`,
    link: `<path d="M8 32 Q10 4 50 4 Q90 4 92 32 Q70 20 50 22 Q30 20 8 32Z" fill="${hc}"/><path d="M50 4 Q84 0 104 40 L86 30 Q72 8 50 8Z" fill="${o.cc || "#3c9a4a"}"/>`,
    long: `<path d="M8 36 Q8 4 50 4 Q92 4 92 36 Q74 18 50 20 Q26 18 8 36Z" fill="${hc}"/>`,
    side: `<path d="M8 34 Q10 4 52 6 Q92 8 92 30 Q66 14 40 26 Q20 24 8 34Z" fill="${hc}"/>`,
    elsa: `<path d="M8 36 Q8 4 50 4 Q92 4 92 36 Q74 18 50 20 Q26 18 8 36Z" fill="${hc}"/><path d="M84 30 Q104 60 82 96 Q92 62 76 40Z" fill="${hc}"/>`,
  };
  return P[H] || "";
}
function backSVG(o, hc, body) {
  let b = "";
  if (o.hair === "long" || o.hair === "elsa") b += `<rect x="6" y="20" width="88" height="70" rx="22" fill="${hc}"/>`;
  if (o.cape) b += `<path d="M26 70 Q16 118 22 124 L78 124 Q84 118 74 70Z" fill="${o.cape}"/>`;
  if (o.ears === "yoda")
    b += `<path d="M10 40 L-16 26 L-10 46 L12 52Z M90 40 L116 26 L110 46 L88 52Z" fill="${o.skin}"/>`;
  if (o.tail)
    b += `<path d="M70 104 Q96 102 94 80" stroke="${o.tail}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  if (o.flame)
    b += `<path d="M92 82 Q84 66 94 56 Q104 68 96 82Z" fill="#ff5a1f"/><path d="M93 78 Q89 69 94 63 Q99 70 95 78Z" fill="#ffd23a"/>`;
  if (o.zig) b += `<path d="M72 96 L92 84 L84 74 L100 62 L104 70 L92 80 L98 90 L74 104Z" fill="${o.zig}"/>`;
  if (o.shell) b += `<ellipse cx="50" cy="92" rx="30" ry="24" fill="${o.shell}"/>`;
  if (o.bulb) b += `<path d="M50 54 Q24 58 30 84 Q50 96 70 84 Q76 58 50 54Z" fill="${o.bulb}"/>`;
  if (o.wings) b += `<path d="M28 80 L-6 60 L4 96Z M72 80 L106 60 L96 96Z" fill="${o.wings}"/>`;
  return b;
}
function earsSVG(o, head) {
  const E = o.ears,
    c = o.earc || head;
  if (!E || E === "yoda") return "";
  const P = {
    pika: `<path d="M24 22 L10 -16 L36 14Z M76 22 L90 -16 L64 14Z" fill="${c}"/><path d="M10 -16 L15 -2 L19 -9Z M90 -16 L85 -2 L81 -9Z" fill="#222"/>`,
    bat: `<path d="M18 16 L14 -8 L30 10Z M82 16 L86 -8 L70 10Z" fill="${c}"/>`,
    mouse: `<circle cx="14" cy="10" r="16" fill="${c}"/><circle cx="86" cy="10" r="16" fill="${c}"/>`,
    cat: `<path d="M12 22 L10 -6 L34 10Z M88 22 L90 -6 L66 10Z" fill="${c}"/>`,
    bunny: `<ellipse cx="32" cy="-8" rx="8" ry="22" fill="${c}"/><ellipse cx="68" cy="-8" rx="8" ry="22" fill="${c}"/>`,
    horns: `<path d="M22 14 Q10 -4 22 -14 Q22 2 32 10Z M78 14 Q90 -4 78 -14 Q78 2 68 10Z" fill="${o.earc || "#e8e0c8"}"/>`,
    fox: `<path d="M14 22 L2 -16 L38 10Z M86 22 L98 -16 L62 10Z" fill="${c}"/><path d="M8 -6 L20 14 L28 10Z M92 -6 L80 14 L72 10Z" fill="#3a2a20"/>`,
    big: `<ellipse cx="2" cy="38" rx="14" ry="22" fill="${c}"/><ellipse cx="98" cy="38" rx="14" ry="22" fill="${c}"/>`,
    antenna: `<path d="M30 10 L22 -16 M70 10 L78 -16" stroke="${c}" stroke-width="3"/><circle cx="22" cy="-16" r="4" fill="${c}"/><circle cx="78" cy="-16" r="4" fill="${c}"/>`,
    elf: `<path d="M8 40 L-14 26 L10 50Z M92 40 L114 26 L90 50Z" fill="${o.skin}"/>`,
  };
  return P[E] || "";
}
function eyesSVG(o) {
  const n = `<ellipse cx="33" cy="44" rx="6.5" ry="8" fill="#111"/><ellipse cx="67" cy="44" rx="6.5" ry="8" fill="#111"/><circle cx="35" cy="41" r="2" fill="#fff"/><circle cx="69" cy="41" r="2" fill="#fff"/>`;
  const P = {
    spidey: `<path d="M22 34 Q34 30 42 46 Q30 52 22 34Z M78 34 Q66 30 58 46 Q70 52 78 34Z" fill="#fff" stroke="#111" stroke-width="2.5"/>`,
    iron: `<rect x="24" y="38" width="18" height="6" rx="2" fill="#bff3ff"/><rect x="58" y="38" width="18" height="6" rx="2" fill="#bff3ff"/>`,
    bat: `<path d="M24 40 L42 42 L40 47 L26 45Z M76 40 L58 42 L60 47 L74 45Z" fill="#fff"/>`,
    vader: `<path d="M22 36 Q32 32 44 40 L40 48 Q28 48 22 36Z M78 36 Q68 32 56 40 L60 48 Q72 48 78 36Z" fill="#111" stroke="#555" stroke-width="1.5"/><path d="M36 56 L64 56 L58 70 L42 70Z" fill="#2b2b2b" stroke="#666" stroke-width="1.5"/>`,
    trooper: `<path d="M22 38 Q32 32 44 42 L38 48 Q26 46 22 38Z M78 38 Q68 32 56 42 L62 48 Q74 46 78 38Z" fill="#111"/><path d="M42 60 L58 60 L56 66 L44 66Z" fill="#555"/>`,
    ghost: `<path d="M24 32 Q34 26 40 44 Q30 54 24 32Z M76 32 Q66 26 60 44 Q70 54 76 32Z" fill="#111"/><path d="M42 56 Q50 74 58 56 Q50 64 42 56Z" fill="#111"/>`,
    visor: `<rect x="18" y="34" width="64" height="16" rx="8" fill="${o.visor || "#e3b33c"}" opacity=".9"/>`,
    mando: `<path d="M20 32 H80 V40 H56 V64 H44 V40 H20Z" fill="#111"/>`,
    robot: `<circle cx="33" cy="44" r="8" fill="#bff3ff" stroke="#555" stroke-width="2"/><circle cx="67" cy="44" r="8" fill="#bff3ff" stroke="#555" stroke-width="2"/>`,
    red: `<ellipse cx="33" cy="44" rx="6.5" ry="8" fill="#c0201a"/><ellipse cx="67" cy="44" rx="6.5" ry="8" fill="#c0201a"/>`,
    glow: `<ellipse cx="33" cy="44" rx="7" ry="6" fill="#ffe066"/><ellipse cx="67" cy="44" rx="7" ry="6" fill="#ffe066"/>`,
    none: "",
    one: `<ellipse cx="50" cy="42" rx="12" ry="12" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="50" cy="42" r="5" fill="#111"/>`,
  };
  return o.eyes in P ? P[o.eyes] : n;
}
function extrasSVG(o, head, skin) {
  let s = "";
  if (o.cap2)
    s += `<path d="M14 26 Q50 14 86 26 L86 40 Q50 30 14 40Z" fill="${o.cap2}" opacity=".95"/><path d="M50 22 L46 30 L54 30Z" fill="#fff"/>`;
  if (o.web)
    s += `<path d="M50 10 L50 72 M10 40 L90 40 M18 18 L82 64 M82 18 L18 64" stroke="#7a0f10" stroke-width="1.2" opacity=".7"/>`;
  if (o.glasses)
    s += `<circle cx="33" cy="44" r="11" fill="none" stroke="#222" stroke-width="3"/><circle cx="67" cy="44" r="11" fill="none" stroke="#222" stroke-width="3"/><path d="M44 44 L56 44" stroke="#222" stroke-width="3"/>`;
  if (o.scar) s += `<path d="M52 16 L46 24 L54 24 L48 32" stroke="#b5121b" stroke-width="2.5" fill="none"/>`;
  if (o.stache)
    s += `<path d="M30 60 Q40 54 50 60 Q60 54 70 60 Q60 66 50 62 Q40 66 30 60Z" fill="${o.stache === true ? "#3b2414" : o.stache}"/>`;
  if (o.beard)
    s += `<path d="M10 46 Q12 84 50 86 Q88 84 90 46 Q80 70 50 70 Q20 70 10 46Z" fill="${o.beard === true ? "#7a5030" : o.beard}"/>`;
  if (o.cheeks)
    s += `<circle cx="22" cy="58" r="7" fill="${o.cheeks === true ? "#e8483a" : o.cheeks}"/><circle cx="78" cy="58" r="7" fill="${o.cheeks === true ? "#e8483a" : o.cheeks}"/>`;
  if (o.nose) s += `<path d="M47 52 L46 62 M53 52 L54 60" stroke="#c0201a" stroke-width="2.2" stroke-linecap="round"/>`;
  if (o.grin) s += `<path d="M30 56 Q50 70 70 56 Q50 64 30 56Z" fill="#fff"/>`;
  if (o.smile)
    s += `<path d="M38 58 Q50 66 62 58" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (o.teeth)
    s += `<path d="M30 58 L70 58 L64 68 L36 68Z" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M40 58 V68 M50 58 V68 M60 58 V68" stroke="#111" stroke-width="1.2"/>`;
  if (o.mouth) s += `<path d="M14 50 Q50 80 86 50 L86 60 Q50 92 14 60Z" fill="${skin}"/>`;
  if (o.petals)
    s += `<g fill="#7a3a3a" stroke="#4a1f1f" stroke-width="1.5">${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a} 50 38)" d="M50 38 Q36 6 50 -12 Q64 6 50 38Z"/>`).join("")}</g><circle cx="50" cy="38" r="12" fill="#2a0e0e"/>`;
  if (o.stitch)
    s += `<path d="M20 30 L80 30 M30 26 V34 M45 26 V34 M60 26 V34 M72 26 V34" stroke="#333" stroke-width="2"/>`;
  if (o.mask2) s += `<rect x="12" y="34" width="76" height="18" rx="6" fill="${o.mask2}"/>`;
  if (o.clown)
    s += `<circle cx="50" cy="54" r="7" fill="#e8202a"/><path d="M28 62 Q50 82 72 62" stroke="#e8202a" stroke-width="4" fill="none"/>`;
  if (o.horn) s += `<path d="M46 8 L50 -14 L54 8Z" fill="#e3b33c"/>`;
  if (o.leaf) s += `<path d="M50 6 Q40 -18 62 -20 Q66 -2 50 6Z" fill="#3c9a4a"/>`;
  if (o.spots)
    s += `<circle cx="24" cy="24" r="5" fill="${o.spots}"/><circle cx="74" cy="20" r="6" fill="${o.spots}"/><circle cx="60" cy="62" r="4" fill="${o.spots}"/>`;
  return s;
}
function accSVG(o, id) {
  const a = o.acc;
  if (!a) return "";
  const [k, c] = a.split("/");
  const P = {
    saber: `<rect x="84" y="20" width="5" height="64" rx="2.5" fill="${c || "#4dd2ff"}" filter="url(#g${id})"/><rect x="82" y="80" width="9" height="16" rx="2" fill="#999"/>`,
    wand: `<path d="M82 92 L98 60" stroke="#6b4426" stroke-width="4" stroke-linecap="round"/>`,
    shield: `<circle cx="84" cy="94" r="16" fill="#b5121b"/><circle cx="84" cy="94" r="11" fill="#fff"/><circle cx="84" cy="94" r="7" fill="#2a5bd0"/>`,
    knife: `<path d="M84 94 L96 60 L100 62 L90 96Z" fill="#cfd6df"/><rect x="80" y="92" width="10" height="12" rx="2" fill="#222"/>`,
    ball: `<circle cx="86" cy="104" r="10" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M86 96 L80 101 L82 108 L90 108 L92 101Z" fill="#222"/>`,
    hammer: `<rect x="84" y="62" width="4" height="40" fill="#6b4426"/><rect x="74" y="54" width="24" height="14" rx="2" fill="#9aa3ad"/>`,
    sword: `<path d="M86 30 L90 30 L90 86 L86 86Z" fill="#cfd6df"/><rect x="80" y="84" width="16" height="4" fill="#e3b33c"/><rect x="86" y="88" width="4" height="10" fill="#6b4426"/>`,
    bow: `<path d="M90 50 Q110 80 90 110" stroke="#6b4426" stroke-width="3" fill="none"/><path d="M90 50 L90 110" stroke="#ddd" stroke-width="1"/>`,
    staff: `<path d="M88 34 L88 112" stroke="${c || "#6b4426"}" stroke-width="4"/><circle cx="88" cy="32" r="6" fill="${c || "#7af7ff"}"/>`,
    claws: `<path d="M80 92 L96 80 M80 96 L98 86 M80 100 L96 94" stroke="#cfd6df" stroke-width="2.5" stroke-linecap="round"/>`,
    axe: `<rect x="86" y="58" width="4" height="46" fill="#6b4426"/><path d="M90 58 Q106 66 90 76Z" fill="#9aa3ad"/>`,
    pumpkin: `<ellipse cx="86" cy="102" rx="12" ry="10" fill="#f07a1e"/><rect x="84" y="90" width="4" height="5" fill="#3c9a4a"/>`,
    balloon: `<path d="M86 100 L90 50" stroke="#ddd" stroke-width="1"/><ellipse cx="90" cy="40" rx="11" ry="14" fill="#d0202a"/>`,
    book: `<rect x="76" y="88" width="20" height="16" rx="2" fill="${c || "#7a1018"}"/><rect x="78" y="90" width="16" height="12" fill="#f4ecd8" opacity=".5"/>`,
    guitar: `<ellipse cx="86" cy="104" rx="10" ry="12" fill="#b5121b"/><rect x="84" y="62" width="4" height="36" fill="#3a2a20"/>`,
    ring: `<circle cx="86" cy="96" r="5" fill="none" stroke="#e3b33c" stroke-width="2.5"/>`,
    gauntlet: `<rect x="76" y="86" width="20" height="18" rx="5" fill="#e3b33c"/>${["#d0202a", "#2a5bd0", "#3c9a4a", "#7b52b8", "#f07a1e"].map((g, i) => `<circle cx="${79 + i * 3.6}" cy="91" r="1.6" fill="${g}"/>`).join("")}`,
    lantern: `<rect x="78" y="88" width="16" height="16" rx="3" fill="#3c9a4a"/><circle cx="86" cy="96" r="4" fill="#bfffc8"/>`,
    lasso: `<path d="M86 96 Q104 80 90 70 Q76 80 86 96" stroke="#e3b33c" stroke-width="2.5" fill="none"/>`,
    phone: `<rect x="80" y="88" width="10" height="16" rx="2" fill="#222"/>`,
    eggo: `<rect x="76" y="90" width="20" height="14" rx="3" fill="#e3b33c"/>`,
    trident: `<path d="M88 40 V112 M80 40 V52 H96 V40" stroke="#e3b33c" stroke-width="3" fill="none"/>`,
    sai: `<path d="M86 64 V104 M80 74 L86 80 L92 74" stroke="#cfd6df" stroke-width="2.5" fill="none"/>`,
    controller: `<rect x="74" y="92" width="24" height="12" rx="6" fill="#333"/><circle cx="92" cy="98" r="2" fill="#ff4d4d"/>`,
  };
  return P[k] || "";
}

/** SVG de una figura. v: variante (chase/flock, glow, metal, diamond, gold, exc). */
export function figSVG(f, v = "") {
  const key = f.id + "|" + v;
  if (SVG_CACHE.has(key)) return SVG_CACHE.get(key);
  const o = Object.assign({}, f.lk || (f.lk = parseLook(f.look)));
  const id = "f" + UID++;
  let skin = o.skin || "#f2c9a0",
    head = o.mask || skin,
    body = o.body || "#3d6fd1",
    hc = o.hc || "#3b2414";
  if (v === "glow") [skin, head, body, hc] = ["#c8f7cf", "#c8f7cf", "#a6ecb4", "#8fdc9f"];
  if (v === "gold") [skin, head, body, hc] = ["#e3b33c", "#e3b33c", "#c99a22", "#b8891a"];
  o.skin = skin;
  const leg = v === "glow" || v === "gold" ? body : o.leg || body,
    arm = v === "glow" || v === "gold" ? body : o.arm || body;
  const fill = v === "metal" ? `url(#m${id})` : v === "diamond" ? `url(#d${id})` : null;
  const svg =
    `<svg viewBox="-20 -24 140 152" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g${id}" x="-2" y="-1" width="5" height="3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="m${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient><pattern id="d${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#fff"/><circle cx="4.5" cy="4" r=".7" fill="#ffd1ff"/></pattern><pattern id="fl${id}" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#fff8"/></pattern></defs>${
      v === "glow"
        ? `<g filter="url(#g${id})" opacity=".5"><rect x="6" y="8" width="88" height="64" rx="26" fill="#9dffb0"/></g>`
        : ""
    }
  ${backSVG(o, hc, body)}
  <rect x="28" y="70" width="44" height="46" rx="14" fill="${body}"/>
  ${o.belly ? `<ellipse cx="50" cy="96" rx="13" ry="14" fill="${o.belly}"/>` : ""}
  ${o.em && EM[o.em] ? EM[o.em] : ""}
  <rect x="18" y="76" width="13" height="24" rx="6" fill="${arm}"/><rect x="69" y="76" width="13" height="24" rx="6" fill="${arm}"/>
  <rect x="30" y="110" width="17" height="13" rx="6" fill="${leg}"/><rect x="53" y="110" width="17" height="13" rx="6" fill="${leg}"/>
  ${earsSVG(o, head)}
  <rect x="6" y="8" width="88" height="64" rx="${o.square ? 18 : 26}" fill="${head}"/>
  ${hairSVG(o, hc)}${eyesSVG(o)}${extrasSVG(o, head, skin)}
  ${v === "chase" || v === "flock" ? `<rect x="6" y="8" width="88" height="64" rx="26" fill="url(#fl${id})"/><rect x="28" y="70" width="44" height="46" rx="14" fill="url(#fl${id})"/>` : ""}
  ${fill ? `<rect x="6" y="8" width="88" height="64" rx="26" fill="${fill}"/><rect x="28" y="70" width="44" height="46" rx="14" fill="${fill}"/>` : ""}
  ${accSVG(o, id)}</svg>`.replace(/\s*\n\s*/g, "");
  SVG_CACHE.set(key, svg);
  return svg;
}

const STK = {
  chase: ["CHASE", "radial-gradient(circle,#fff6c4,#e2b12c)", "#3a2a00"],
  flock: ["FLOCKED", "radial-gradient(circle,#fff,#e9e2d6)", "#4a3a28"],
  glow: ["BRILLA<br>OSCURO", "radial-gradient(circle,#d9ffe2,#34c26b)", "#05341a"],
  metal: ["METÁ-<br>LICA", "radial-gradient(circle,#ffffff,#9aa3ad)", "#222"],
  diamond: ["DIA-<br>MOND", "radial-gradient(circle,#ffe3ff,#c85bd8)", "#3a0040"],
  exc: ["EXCLU-<br>SIVA", "radial-gradient(circle,#dbe6ff,#3f6fe0)", "#fff"],
  gold: ["ORO<br>24 K", "radial-gradient(circle,#fff6c4,#c99a22)", "#3a2a00"],
};
/** Caja de la figura (HTML), con número, nombre, color de la colección y pegatina de la variante. */
export function boxHTML(f, v = "", cls = "", dmg = false) {
  const col = (FKCOL[f.c] || {}).col || "#555",
    st = STK[v];
  return `<div class="fkbox${cls ? " " + cls : ""}${dmg ? " dmg" : ""}${f.dlx ? " dlx" : ""}" style="--fc:${col}"><div class="fkb-top">POP! VINILO</div><div class="fkb-num">#${f.n}</div><div class="fkb-win">${figSVG(f, v)}</div><div class="fkb-lb">${f.name}</div>${st ? `<div class="fkb-stk" style="background:${st[1]};color:${st[2]}">${st[0]}</div>` : ""}</div>`;
}
