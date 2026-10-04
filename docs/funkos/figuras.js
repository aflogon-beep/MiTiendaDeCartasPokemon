// Generador de figuras de los mockups (docs/funkos): cabezón + cuerpo + capas (pelo, máscara, casco, capa, emblema, accesorio).
// F(opciones) devuelve un SVG. FIG: ejemplos de varias colecciones.
let UID = 0;
function F(o) {
  const id = "f" + UID++;
  const skin = o.skin || "#f2c9a0", body = o.body || "#3d6fd1", leg = o.leg || body, head = o.mask || skin;
  let back = "", over = "", eyes = "", acc = "", hair = "";
  if (o.cape) back += `<path d="M26 70 Q16 118 22 124 L78 124 Q84 118 74 70Z" fill="${o.cape}"/>`;
  if (o.ears === "bat") over += `<path d="M18 16 L14 -8 L30 10Z M82 16 L86 -8 L70 10Z" fill="${head}"/>`;
  if (o.ears === "yoda") back += `<path d="M10 40 L-16 26 L-10 46 L12 52Z M90 40 L116 26 L110 46 L88 52Z" fill="${skin}"/><path d="M8 42 L-8 32 L-4 44Z M92 42 L108 32 L104 44Z" fill="#e8a5a0"/>`;
  // pelo
  const hc = o.hairc || "#3b2414";
  if (o.hair === "short") hair = `<path d="M8 34 Q8 6 50 6 Q92 6 92 34 Q80 20 50 22 Q20 20 8 34Z" fill="${hc}"/>`;
  if (o.hair === "messy") hair = `<path d="M6 36 Q2 2 50 4 Q98 2 94 36 L86 24 L78 30 L68 18 L58 26 L48 16 L38 26 L28 18 L18 30Z" fill="${hc}"/>`;
  if (o.hair === "long") { back += `<rect x="6" y="20" width="88" height="70" rx="22" fill="${hc}"/>`; hair = `<path d="M8 36 Q8 4 50 4 Q92 4 92 36 Q74 18 50 20 Q26 18 8 36Z" fill="${hc}"/>`; }
  if (o.hair === "spiky") hair = `<path d="M4 34 L-6 6 L18 14 L16 -12 L36 6 L50 -18 L64 6 L84 -12 L82 14 L106 6 L96 34 Q50 14 4 34Z" fill="${hc}"/>`;
  if (o.hair === "naruto") hair = `<path d="M4 34 L-4 10 L16 16 L14 -6 L32 8 L50 -10 L68 8 L86 -6 L84 16 L104 10 L96 34 Q50 18 4 34Z" fill="${hc}"/><rect x="10" y="22" width="80" height="9" rx="3" fill="#3a5bd0"/><rect x="40" y="22" width="20" height="9" rx="2" fill="#c9d3e6"/>`;
  if (o.hair === "cap") hair = `<path d="M6 30 Q8 2 50 2 Q92 2 94 30Z" fill="${o.capc}"/><rect x="2" y="26" width="58" height="8" rx="4" fill="${o.capc}"/><circle cx="50" cy="16" r="8" fill="#fff"/><text x="50" y="20" font-size="10" font-weight="900" text-anchor="middle" fill="${o.capc}">M</text>`;
  if (o.hair === "link") hair = `<path d="M8 32 Q10 4 50 4 Q90 4 92 32 Q70 20 50 22 Q30 20 8 32Z" fill="#e7c25a"/><path d="M50 4 Q84 0 104 40 L86 30 Q72 8 50 8Z" fill="#3c9a4a"/>`;
  // ojos
  const eyeN = `<ellipse cx="33" cy="44" rx="6.5" ry="8" fill="#111"/><ellipse cx="67" cy="44" rx="6.5" ry="8" fill="#111"/><circle cx="35" cy="41" r="2" fill="#fff"/><circle cx="69" cy="41" r="2" fill="#fff"/>`;
  eyes = o.lens === "none" ? "" : eyeN;
  if (o.lens === "spidey") eyes = `<path d="M22 34 Q34 30 42 46 Q30 52 22 34Z M78 34 Q66 30 58 46 Q70 52 78 34Z" fill="#fff" stroke="#111" stroke-width="2.5"/>`;
  if (o.lens === "iron") eyes = `<rect x="24" y="38" width="18" height="6" rx="2" fill="#bff3ff"/><rect x="58" y="38" width="18" height="6" rx="2" fill="#bff3ff"/>`;
  if (o.lens === "bat") eyes = `<path d="M24 40 L42 42 L40 47 L26 45Z M76 40 L58 42 L60 47 L74 45Z" fill="#fff"/>`;
  if (o.lens === "vader") eyes = `<path d="M22 36 Q32 32 44 40 L40 48 Q28 48 22 36Z M78 36 Q68 32 56 40 L60 48 Q72 48 78 36Z" fill="#111" stroke="#555" stroke-width="1.5"/><path d="M36 56 L64 56 L58 70 L42 70Z" fill="#2b2b2b" stroke="#666" stroke-width="1.5"/>`;
  if (o.lens === "trooper") eyes = `<path d="M22 38 Q32 32 44 42 L38 48 Q26 46 22 38Z M78 38 Q68 32 56 42 L62 48 Q74 46 78 38Z" fill="#111"/><path d="M42 60 L58 60 L56 66 L44 66Z" fill="#555"/><path d="M30 64 L36 70 M70 64 L64 70" stroke="#555" stroke-width="2"/>`;
  if (o.lens === "ghost") eyes = `<path d="M24 32 Q34 26 40 44 Q30 54 24 32Z M76 32 Q66 26 60 44 Q70 54 76 32Z" fill="#111"/><path d="M42 56 Q50 74 58 56 Q50 64 42 56Z" fill="#111"/>`;
  if (o.lens === "cap") eyes = eyeN + `<path d="M14 26 Q50 14 86 26 L86 40 Q50 30 14 40Z" fill="#2a5bd0" opacity=".95"/><path d="M50 22 L46 30 L54 30Z" fill="#fff"/>`;
  // máscara con telaraña
  if (o.web) over += `<path d="M50 10 L50 72 M10 40 L90 40 M18 18 L82 64 M82 18 L18 64" stroke="#7a0f10" stroke-width="1.2" opacity=".7"/>`;
  if (o.glasses) over += `<circle cx="33" cy="44" r="11" fill="none" stroke="#222" stroke-width="3"/><circle cx="67" cy="44" r="11" fill="none" stroke="#222" stroke-width="3"/><path d="M44 44 L56 44" stroke="#222" stroke-width="3"/><path d="M52 18 L46 26 L54 26 L48 34" stroke="#b5121b" stroke-width="2.5" fill="none"/>`;
  if (o.moustache) over += `<path d="M30 60 Q40 54 50 60 Q60 54 70 60 Q60 66 50 62 Q40 66 30 60Z" fill="#3b2414"/><ellipse cx="50" cy="54" rx="7" ry="6" fill="#f0a882"/>`;
  if (o.cheeks) over += `<circle cx="22" cy="58" r="7" fill="#e8483a"/><circle cx="78" cy="58" r="7" fill="#e8483a"/>`;
  if (o.buzz) hair = `<path d="M10 30 Q10 8 50 8 Q90 8 90 30 Q70 22 50 22 Q30 22 10 30Z" fill="${hc}" opacity=".85"/>`;
  if (o.nose) over += `<path d="M47 52 L46 62 M53 52 L54 60" stroke="#c0201a" stroke-width="2.2" stroke-linecap="round"/>`;
  if (o.petals) over += `<g fill="#7a3a3a" stroke="#4a1f1f" stroke-width="1.5">${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a} 50 38)" d="M50 38 Q36 6 50 -12 Q64 6 50 38Z"/>`).join("")}</g><circle cx="50" cy="38" r="12" fill="#2a0e0e"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path transform="rotate(${a} 50 38)" d="M50 27 L48 31 L52 31Z" fill="#f4efe0"/>`).join("")}`;
  if (o.pika) over += `<path d="M24 22 L10 -16 L36 14Z M76 22 L90 -16 L64 14Z" fill="${head}"/><path d="M10 -16 L15 -2 L19 -9Z M90 -16 L85 -2 L81 -9Z" fill="#222"/>`;
  // accesorios en la mano
  if (o.saber) acc = `<rect x="84" y="20" width="5" height="64" rx="2.5" fill="${o.saber}" filter="url(#g${id})"/><rect x="82" y="80" width="9" height="16" rx="2" fill="#999"/>`;
  if (o.wand) acc = `<path d="M82 92 L98 60" stroke="#6b4426" stroke-width="4" stroke-linecap="round"/>`;
  if (o.shield) acc = `<circle cx="84" cy="94" r="16" fill="#b5121b"/><circle cx="84" cy="94" r="11" fill="#fff"/><circle cx="84" cy="94" r="7" fill="#2a5bd0"/><path d="M84 89 L85.5 93 L89 93 L86 95.5 L87 99 L84 97 L81 99 L82 95.5 L79 93 L82.5 93Z" fill="#fff"/>`;
  if (o.knife) acc = `<path d="M84 94 L96 60 L100 62 L90 96Z" fill="#cfd6df"/><rect x="80" y="92" width="10" height="12" rx="2" fill="#222"/>`;
  if (o.ball) acc = `<circle cx="86" cy="104" r="10" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M86 96 L80 101 L82 108 L90 108 L92 101Z" fill="#222"/>`;
  const em = o.emblem || "";
  return `<svg viewBox="-20 -22 140 152" xmlns="http://www.w3.org/2000/svg"><defs><filter id="g${id}" x="-2" y="-1" width="5" height="3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  ${back}
  <rect x="28" y="70" width="44" height="46" rx="14" fill="${body}"/>
  ${em}
  <rect x="18" y="76" width="13" height="24" rx="6" fill="${o.arm || body}"/><rect x="69" y="76" width="13" height="24" rx="6" fill="${o.arm || body}"/>
  <rect x="30" y="110" width="17" height="13" rx="6" fill="${leg}"/><rect x="53" y="110" width="17" height="13" rx="6" fill="${leg}"/>
  ${o.ears === "bat" ? over.match(/<path d="M18 16[^>]*>/)[0] : ""}
  <rect x="6" y="8" width="88" height="64" rx="${o.square ? 18 : 26}" fill="${head}"/>
  ${o.mouthArea ? `<path d="M14 50 Q50 80 86 50 L86 60 Q50 92 14 60Z" fill="${skin}"/>` : ""}
  ${hair}${eyes}${over.replace(/<path d="M18 16[^>]*>/, "")}
  ${acc}</svg>`;
}

const FIG = [
  ["Spider-Man", "Marvel", { mask: "#d0202a", body: "#d0202a", leg: "#2a4bb8", arm: "#d0202a", lens: "spidey", web: 1, emblem: '<path d="M50 80 L44 90 L50 88 L56 90Z" fill="#111"/>' }],
  ["Iron Man", "Marvel", { mask: "#b5121b", body: "#b5121b", leg: "#b5121b", lens: "iron", mouthArea: 0, skin: "#e2b33c", emblem: '<circle cx="50" cy="86" r="6" fill="#bff3ff"/>', square: 1 }],
  ["Capitán América", "Marvel", { body: "#2a5bd0", leg: "#2a5bd0", lens: "cap", shield: 1, emblem: '<path d="M50 80 L52 85 L57 85 L53 88 L55 93 L50 90 L45 93 L47 88 L43 85 L48 85Z" fill="#fff"/>' }],
  ["Batman", "DC", { mask: "#2b2d36", body: "#5a5e6a", leg: "#2b2d36", arm: "#2b2d36", lens: "bat", ears: "bat", cape: "#1d1f26", mouthArea: 1, emblem: '<ellipse cx="50" cy="86" rx="10" ry="5" fill="#f2c21a"/><path d="M42 86 Q50 80 58 86 Q50 84 42 86Z" fill="#111"/>' }],
  ["Darth Vader", "Star Wars", { mask: "#1a1a1e", body: "#1a1a1e", lens: "vader", cape: "#0d0d10", saber: "#ff2a2a", square: 1, emblem: '<rect x="42" y="80" width="16" height="10" rx="2" fill="#555"/><circle cx="46" cy="85" r="1.6" fill="#e33"/><circle cx="51" cy="85" r="1.6" fill="#3e3"/>' }],
  ["Stormtrooper", "Star Wars", { mask: "#f2f4f7", body: "#f2f4f7", leg: "#f2f4f7", lens: "trooper", square: 1, emblem: '<rect x="40" y="82" width="20" height="6" rx="2" fill="#222"/>' }],
  ["Grogu", "Star Wars", { skin: "#a9c98d", body: "#c7a77a", ears: "yoda" }],
  ["Harry Potter", "Harry Potter", { hair: "messy", hairc: "#2a1a10", glasses: 1, body: "#2b2b33", wand: 1, emblem: '<path d="M42 72 L50 84 L58 72" fill="#7a1018"/><path d="M44 72 L50 80 L56 72" fill="#e3b33c"/>' }],
  ["Hermione", "Harry Potter", { hair: "long", hairc: "#7a4a24", body: "#2b2b33", wand: 1, emblem: '<path d="M42 72 L50 84 L58 72" fill="#7a1018"/>' }],
  ["Goku", "Dragon Ball", { hair: "spiky", hairc: "#1a1a1a", body: "#f07a1e", leg: "#f07a1e", arm: "#f2c9a0", emblem: '<rect x="28" y="96" width="44" height="6" fill="#2a5bd0"/>' }],
  ["Naruto", "Naruto", { hair: "naruto", hairc: "#f2c21a", body: "#f07a1e", leg: "#f07a1e", arm: "#2b2b33", emblem: '<path d="M44 76 L50 84 L56 76" fill="#2b2b33"/>' }],
  ["Mario", "Nintendo", { hair: "cap", capc: "#d0202a", moustache: 1, body: "#d0202a", leg: "#2a4bb8", emblem: '<rect x="34" y="88" width="32" height="28" rx="8" fill="#2a4bb8"/><circle cx="40" cy="92" r="3" fill="#f2c21a"/><circle cx="60" cy="92" r="3" fill="#f2c21a"/>' }],
  ["Link", "Zelda", { hair: "link", body: "#3c9a4a", leg: "#e9dcc0", ears: "", emblem: '<rect x="28" y="96" width="44" height="5" fill="#6b4426"/>', saber: "#cfd6df" }],
  ["Pikachu", "Pokémon", { skin: "#f7d02c", body: "#f7d02c", pika: 1, cheeks: 1 }],
  ["Ghostface", "Terror", { mask: "#f4f4f4", body: "#1a1a1e", cape: "#1a1a1e", lens: "ghost", knife: 1 }],
  ["Eleven", "Stranger Things", { buzz: 1, hairc: "#6b4426", nose: 1, body: "#f2a7c3", arm: "#2a5bd0", leg: "#f2a7c3" }],
  ["Demogorgon", "Stranger Things", { skin: "#8a6a5e", mask: "#8a6a5e", body: "#6e554b", petals: 1, lens: "none" }],
  ["Mickey", "Disney", { skin: "#f6dcc4", mask: "#1a1a1a", mouthArea: 1, body: "#d0202a", leg: "#d0202a", arm: "#1a1a1a", ears: "", emblem: '<circle cx="42" cy="84" r="3" fill="#fff"/><circle cx="58" cy="84" r="3" fill="#fff"/>' }],
];

