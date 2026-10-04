// Zona Funko de los mockups (docs/funkos): el local de la librería, a la derecha de la tienda, visto desde arriba
// como el resto del juego. Coordenadas del mundo del juego: x 808–1084 (ancho del local), y 0–572 (con la fachada).
// zona({ n: true }) añade los números de la leyenda.
function zona(o = {}) {
  const n = (x, y, t) =>
    o.n
      ? `<g><circle cx="${x}" cy="${y}" r="9" fill="#ffd54a" stroke="#111" stroke-width="2"/><text x="${x}" y="${y + 4}" font-size="11" font-weight="900" text-anchor="middle" fill="#111">${t}</text></g>`
      : "";
  const boxes = (x, y, w, cols, h = 16, bw = 11) => {
    let s = "";
    for (let i = 0; i * (bw + 3) + bw <= w; i++)
      s += `<rect x="${x + i * (bw + 3)}" y="${y}" width="${bw}" height="${h}" rx="1.5" fill="${cols[i % cols.length]}"/><rect x="${x + i * (bw + 3) + 2}" y="${y + 4}" width="${bw - 4}" height="${h - 7}" rx="1" fill="#ffffffaa"/>`;
    return s;
  };
  const MAR = ["#d0202a", "#2a4bb8", "#d0202a", "#b5121b"],
    SW = ["#1a1a1e", "#f2f4f7", "#a9c98d", "#1a1a1e"],
    HP = ["#7a1018", "#2b2b33", "#1f5a36", "#e3b33c"],
    PK = ["#f7d02c", "#f08a3c", "#78c8b4", "#6b4a9c"],
    AN = ["#f07a1e", "#f2c21a", "#3c9a4a", "#2a5bd0"];
  const person = (x, y, c, h = "#3b2414") =>
    `<ellipse cx="${x}" cy="${y + 6}" rx="9" ry="5" fill="#0004"/><rect x="${x - 7}" y="${y - 12}" width="14" height="16" rx="6" fill="${c}"/><circle cx="${x}" cy="${y - 17}" r="7" fill="#f2c9a0"/><path d="M${x - 7} ${y - 19} Q${x} ${y - 28} ${x + 7} ${y - 19}Z" fill="${h}"/>`;
  return `<svg viewBox="808 0 276 572" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
<defs>
<pattern id="hex" width="24" height="41.6" patternUnits="userSpaceOnUse"><path d="M12 0 L24 6.9 L24 20.8 L12 27.7 L0 20.8 L0 6.9Z M12 27.7 L12 41.6" fill="none" stroke="#4a3f7a" stroke-width="1.4"/></pattern>
<radialGradient id="spot"><stop offset="0" stop-color="#fff6c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></radialGradient>
<radialGradient id="glowp"><stop offset="0" stop-color="#ff4fd8" stop-opacity=".45"/><stop offset="1" stop-color="#ff4fd8" stop-opacity="0"/></radialGradient>
<filter id="neon"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<!-- suelo de nave espacial (hexágonos) y luz morada -->
<rect x="808" y="48" width="276" height="470" fill="#2b2440"/>
<rect x="808" y="48" width="276" height="470" fill="url(#hex)"/>
<rect x="808" y="48" width="276" height="470" fill="url(#glowp)" opacity=".6"/>
<!-- pared del fondo con neón y estandartes de Hogwarts -->
<rect x="808" y="0" width="276" height="48" fill="#1d1630"/>
<text x="946" y="30" font-size="22" font-weight="900" text-anchor="middle" fill="#ffd1ff" filter="url(#neon)" font-family="Fredoka,system-ui">ZONA FUNKO</text>
${["#7a1018", "#1f5a36", "#1d3f8a", "#c9a227"].map((c, i) => `<path d="M${816 + i * 12} 4 h9 v26 l-4.5 -5 l-4.5 5Z" fill="${c}"/>`).join("")}
${["#7a1018", "#1f5a36", "#1d3f8a", "#c9a227"].map((c, i) => `<path d="M${1030 + i * 12} 4 h9 v26 l-4.5 -5 l-4.5 5Z" fill="${c}"/>`).join("")}
<!-- estantería iluminada del fondo: Marvel y Star Wars -->
<rect x="818" y="50" width="244" height="44" rx="3" fill="#3a2a58"/>
<rect x="818" y="50" width="244" height="3" fill="#7af7ff" filter="url(#neon)"/>
${boxes(822, 56, 112, MAR)}${boxes(946, 56, 112, SW)}${boxes(822, 75, 112, MAR)}${boxes(946, 75, 112, SW)}
${n(940, 99, 1)}
<!-- vitrinas altas de cristal en la pared derecha: Harry Potter y anime -->
${[112, 212, 312].map((y, i) => `<rect x="1040" y="${y}" width="34" height="88" rx="3" fill="#bfe7ff55" stroke="#bfe7ff" stroke-width="2"/><rect x="1040" y="${y}" width="34" height="3" fill="#7af7ff" filter="url(#neon)"/>${[0, 1, 2, 3].map((k) => `<rect x="${1044}" y="${y + 8 + k * 20}" width="11" height="15" rx="1.5" fill="${(i === 2 ? AN : HP)[k]}"/><rect x="${1059}" y="${y + 8 + k * 20}" width="11" height="15" rx="1.5" fill="${(i === 2 ? AN : HP)[(k + 2) % 4]}"/>`).join("")}`).join("")}
${n(1030, 118, 2)}
<!-- estatua de Darth Vader a tamaño real -->
<ellipse cx="842" cy="150" rx="22" ry="10" fill="#0006"/>
<path d="M822 150 Q842 112 862 150 Q842 160 822 150Z" fill="#0d0d10"/>
<circle cx="842" cy="126" r="11" fill="#1a1a1e" stroke="#555" stroke-width="1.5"/>
<path d="M836 128 l5 2 l-5 2Z M848 128 l-5 2 l5 2Z" fill="#555"/>
<rect x="860" y="104" width="3.5" height="40" rx="1.7" fill="#ff2a2a" filter="url(#neon)"/>
${n(822, 112, 3)}
<!-- Halcón Milenario colgado del techo (con su sombra en el suelo) -->
<ellipse cx="955" cy="170" rx="44" ry="16" fill="#0005"/>
<g transform="translate(955 140)"><circle r="34" fill="#c9ccd2" stroke="#8a8f99" stroke-width="2"/><circle r="12" fill="#a9adb6"/><path d="M-6 -33 L-12 -56 L-3 -56 L0 -34 M6 -33 L12 -56 L3 -56 L0 -34" fill="#c9ccd2" stroke="#8a8f99" stroke-width="1.5"/><path d="M26 -18 L42 -22 L40 -10 L28 -10Z" fill="#b6bac2"/><rect x="-30" y="22" width="60" height="6" rx="3" fill="#7af7ff" opacity=".8" filter="url(#neon)"/></g>
${n(990, 112, 4)}
<!-- isla en pirámide con foco: Pokémon -->
<ellipse cx="935" cy="252" rx="62" ry="26" fill="url(#spot)"/>
<rect x="880" y="222" width="110" height="52" rx="8" fill="#8a5a2b"/><rect x="890" y="214" width="90" height="16" rx="5" fill="#a87442"/><rect x="902" y="206" width="66" height="12" rx="4" fill="#c38d54"/>
${boxes(886, 246, 100, PK, 18, 12)}${boxes(896, 226, 80, PK, 14, 10)}
${n(880, 214, 5)}
<!-- alfombra de la Estrella de la Muerte -->
<circle cx="935" cy="350" r="46" fill="#6c717b"/><circle cx="935" cy="350" r="46" fill="none" stroke="#565a63" stroke-width="3"/><path d="M889 352 H981" stroke="#565a63" stroke-width="4"/><circle cx="952" cy="332" r="11" fill="#565a63"/><circle cx="952" cy="332" r="5" fill="#7a7f89"/>
${n(978, 312, 6)}
<!-- cámara de los grails: vitrina dorada con foco -->
<ellipse cx="855" cy="330" rx="40" ry="22" fill="url(#spot)"/>
<rect x="824" y="302" width="62" height="48" rx="4" fill="#ffffff33" stroke="#ffd54a" stroke-width="3"/>
<rect x="830" y="310" width="14" height="20" rx="2" fill="#c9a227"/><rect x="848" y="310" width="14" height="20" rx="2" fill="#1a1a1e"/><rect x="866" y="310" width="14" height="20" rx="2" fill="#d0202a"/>
<text x="855" y="345" font-size="8" font-weight="900" text-anchor="middle" fill="#ffd54a">GRAILS</text>
${n(824, 298, 7)}
<!-- armadura de Iron Man en su cápsula -->
<circle cx="1018" cy="452" r="20" fill="#bff3ff33" stroke="#bff3ff" stroke-width="2"/>
<circle cx="1018" cy="452" r="11" fill="#b5121b"/><rect x="1012" y="444" width="12" height="5" rx="1" fill="#e2b33c"/><circle cx="1018" cy="456" r="3" fill="#bff3ff" filter="url(#neon)"/>
${n(1040, 428, 8)}
<!-- máquina de gancho con Funkos -->
<rect x="824" y="416" width="44" height="50" rx="5" fill="#ff4fd8"/><rect x="829" y="421" width="34" height="32" rx="3" fill="#ffe3ff"/>
${["#f7d02c", "#d0202a", "#1a1a1e", "#3c9a4a"].map((c, i) => `<rect x="${832 + (i % 2) * 15}" y="${436 + Math.floor(i / 2) * 7}" width="10" height="9" rx="1.5" fill="${c}"/>`).join("")}
<path d="M846 421 V432 M842 434 L846 430 L850 434" stroke="#555" stroke-width="2" fill="none"/>
<text x="846" y="462" font-size="7" font-weight="900" text-anchor="middle" fill="#fff">1 €</text>
${n(824, 410, 9)}
<!-- máquina recreativa -->
<rect x="884" y="426" width="34" height="40" rx="4" fill="#2a2f6b"/><rect x="888" y="430" width="26" height="18" rx="2" fill="#7af7ff" filter="url(#neon)"/><circle cx="895" cy="458" r="3" fill="#ff2a2a"/><circle cx="907" cy="458" r="3" fill="#f2c21a"/>
${n(918, 420, 10)}
<!-- Pikachu gigante de 1 metro en la entrada -->
<ellipse cx="1052" cy="500" rx="16" ry="6" fill="#0005"/><rect x="1040" y="470" width="24" height="26" rx="10" fill="#f7d02c"/><path d="M1042 474 L1036 456 L1047 470Z M1062 474 L1068 456 L1057 470Z" fill="#f7d02c"/><path d="M1036 456 L1039 463 L1041 460Z M1068 456 L1065 463 L1063 460Z" fill="#222"/><circle cx="1047" cy="480" r="2" fill="#111"/><circle cx="1057" cy="480" r="2" fill="#111"/>
${n(1074, 466, 11)}
<!-- paso desde la tienda: portal de las estrellas -->
<rect x="796" y="452" width="16" height="64" fill="#2b2440"/>
<path d="M804 446 A10 36 0 0 1 804 522" fill="none" stroke="#7a8aa8" stroke-width="7"/>
${[0, 1, 2, 3, 4].map((k) => `<circle cx="${811 - Math.abs(2 - k) * 3}" cy="${456 + k * 15}" r="2.6" fill="#ff8a3a" filter="url(#neon)"/>`).join("")}
${n(822, 498, 12)}
<!-- el rincón de Emma: sofá gamer, tele y consola (ella es vaga, pero muy lista) -->
<rect x="938" y="404" width="56" height="8" rx="2" fill="#111"/><rect x="941" y="405" width="50" height="5" rx="1" fill="#7af7ff" filter="url(#neon)"/><rect x="962" y="412" width="8" height="6" fill="#333"/>
<rect x="932" y="474" width="68" height="26" rx="9" fill="#6b3fa0"/><rect x="932" y="474" width="68" height="9" rx="5" fill="#8a56c9"/><rect x="928" y="478" width="9" height="22" rx="4" fill="#5a3388"/><rect x="995" y="478" width="9" height="22" rx="4" fill="#5a3388"/>
<rect x="944" y="483" width="40" height="11" rx="5" fill="#3c9a4a"/><circle cx="986" cy="486" r="7" fill="#f2c9a0"/><path d="M979 484 Q986 474 993 484 L993 492 Q990 486 986 486 Q982 486 979 492Z" fill="#7a4a24"/>
<rect x="956" y="478" width="12" height="6" rx="3" fill="#222"/><circle cx="959" cy="481" r="1.2" fill="#ff2a2a"/><circle cx="965" cy="481" r="1.2" fill="#2a5bd0"/>
<text x="966" y="468" font-size="8" font-weight="900" text-anchor="middle" fill="#ffd1ff">Zzz… ¡pausa!</text>
${n(1006, 466, 13)}
<!-- clientes -->
${person(960, 300, "#2a5bd0")}${person(900, 400, "#3c9a4a", "#7a4a24")}${person(1000, 250, "#ff4fd8", "#111")}${person(870, 200, "#f07a1e", "#f2c21a")}
<!-- escaparate y fachada -->
<rect x="808" y="516" width="276" height="56" fill="#3a2a58"/>
<rect x="816" y="520" width="110" height="30" fill="#bfe7ff88"/><rect x="986" y="520" width="90" height="30" fill="#bfe7ff88"/>
${boxes(820, 528, 104, [...MAR, ...SW], 18, 10)}${boxes(990, 528, 86, [...PK, ...HP], 18, 10)}
<rect x="936" y="518" width="40" height="38" fill="#1d1630"/><rect x="940" y="522" width="32" height="34" fill="#bfe7ff66"/>
<text x="946" y="568" font-size="10" font-weight="900" text-anchor="middle" fill="#ffd1ff" filter="url(#neon)">ZONA FUNKO</text>
</svg>`;
}
const ZONA_LEYENDA = [
  "Estantería iluminada del fondo (Marvel y Star Wars)",
  "Vitrinas altas de cristal con LED (Harry Potter y anime)",
  "Estatua de Darth Vader a tamaño real",
  "Halcón Milenario colgado del techo",
  "Isla en pirámide con foco (Pokémon)",
  "Alfombra de la Estrella de la Muerte",
  "Cámara de los grails: vitrina dorada (Chase, exclusivas, descatalogados)",
  "Armadura de Iron Man en su cápsula",
  "Máquina de gancho con Funkos (1 € la partida)",
  "Máquina recreativa",
  "Pikachu gigante de 1 metro en la entrada",
  "Paso desde la tienda: portal de las estrellas",
  "El rincón de Emma: sofá gamer, tele y consola",
];
