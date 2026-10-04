// Zona Funko · catálogo (docs/funkos/DISENO.md §5): 11 colecciones de 20 figuras (4 olas de 5; la 5.ª de cada
// ola es rara), más Deluxe (nivel 6), grails legendarios (nivel 9) y el Funko de oro (nivel 10).
// Personajes de ficción con su nombre real; el dibujo es nuestro (ui/funko/fig.js) y sale de «look»: piezas
// «clave:valor» (piel o máscara, pelo, ojos, orejas, extras, capa, emblema y accesorio).

/** Colecciones: nombre, color de la caja, nivel de la zona que las desbloquea y fans (tipo de cliente). */
export const FKCOL = {
  pk: { n: "Pokémon", col: "#f2c21a", lv: 1 },
  vj: { n: "Videojuegos", col: "#d0202a", lv: 1 },
  ds: { n: "Disney y Pixar", col: "#2a6fd0", lv: 1 },
  mv: { n: "Marvel", col: "#b5121b", lv: 2 },
  sw: { n: "Star Wars", col: "#2b2b33", lv: 2 },
  st: { n: "Stranger Things", col: "#9b1530", lv: 2 },
  hp: { n: "Harry Potter", col: "#7a1018", lv: 3 },
  dc: { n: "DC", col: "#1d3f8a", lv: 3 },
  an: { n: "Anime", col: "#f07a1e", lv: 3 },
  se: { n: "Series y películas", col: "#3c9a4a", lv: 4 },
  te: { n: "Terror", col: "#4a3a5a", lv: 4 },
};
export const FKCOLS = Object.keys(FKCOL);

/** Piezas de una figura: «clave:valor» separadas por espacios (p. ej. "mask:#d0202a eyes:spidey web em:spider"). */
export function parseLook(s) {
  const o = {};
  String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .forEach((p) => {
      const i = p.indexOf(":");
      if (i < 0) o[p] = true;
      else o[p.slice(0, i)] = p.slice(i + 1);
    });
  return o;
}
/** Color de la cabeza (para las cajas pequeñas de la tienda). */
export const headCol = (f) => {
  const o = f.lk || (f.lk = parseLook(f.look));
  return o.mask || o.skin || "#f2c9a0";
};

// [nombre, número, piezas]
const RAW = {
  pk: [
    ["Pikachu", 353, "skin:#f7d02c body:#f7d02c ears:pika cheeks zig:#d9a816"],
    ["Charmander", 455, "skin:#f08a3c body:#f08a3c belly:#ffe1a8 tail:#d86f24 flame"],
    ["Bulbasaur", 453, "skin:#78c8b4 body:#78c8b4 bulb:#3f9a4a spots:#5aa996"],
    ["Squirtle", 504, "skin:#8fd3f0 body:#8fd3f0 shell:#a8642a belly:#f4e2b0"],
    ["Mewtwo", 581, "skin:#d6c8e3 body:#d6c8e3 ears:horns earc:#d6c8e3 tail:#8c5bb5"],
    ["Eevee", 577, "skin:#b07a46 body:#b07a46 ears:fox belly:#f3e1bf"],
    ["Jigglypuff", 568, "skin:#ffb3cf body:#ffb3cf hair:mohawk hc:#ffb3cf eyes:glow"],
    ["Psyduck", 781, "skin:#f7d84a body:#f7d84a hair:mohawk hc:#333 em:dot"],
    ["Snorlax", 452, "skin:#4a7a8c body:#4a7a8c belly:#f4e2c0 ears:cat earc:#4a7a8c smile"],
    ["Gengar", 455, "skin:#6b4a9c body:#6b4a9c ears:horns earc:#6b4a9c grin eyes:red"],
    [
      "Charizard",
      843,
      "skin:#f08a3c body:#f08a3c belly:#ffe1a8 wings:#3d8fa8 ears:horns earc:#f08a3c flame tail:#d86f24",
    ],
    ["Lucario", 856, "skin:#2a6fd0 mask:#222 body:#2a6fd0 ears:fox earc:#2a6fd0 eyes:red belly:#f4e2b0"],
    ["Togepi", 616, "skin:#fff6e0 body:#fff6e0 hair:mohawk hc:#f4e2b0 em:star"],
    ["Meowth", 780, "skin:#f4e2b0 body:#f4e2b0 ears:cat earc:#5a3a2a em:dot horn"],
    ["Mew", 643, "skin:#ffc4dc body:#ffc4dc ears:cat earc:#ffc4dc tail:#ffc4dc"],
    ["Lapras", 864, "skin:#5aa8e0 body:#5aa8e0 shell:#cfd6df ears:horns earc:#e8e0c8"],
    ["Dragonite", 851, "skin:#f2a93c body:#f2a93c belly:#f4e2b0 antenna ears:antenna earc:#f2a93c wings:#3c9a4a"],
    ["Vaporeon", 627, "skin:#5aa8e0 body:#5aa8e0 ears:fox earc:#5aa8e0 tail:#3d8fa8"],
    ["Umbreon", 629, "skin:#222 body:#222 ears:fox earc:#222 eyes:red spots:#f2c21a"],
    ["Rayquaza", 795, "skin:#2f8a4a body:#2f8a4a ears:horns earc:#2f8a4a spots:#f2c21a eyes:glow"],
  ],
  vj: [
    ["Mario", 32, "hair:cap cc:#d0202a capl:M stache body:#d0202a leg:#2a4bb8 em:belt"],
    ["Luigi", 33, "hair:cap cc:#3c9a4a capl:L stache body:#3c9a4a leg:#2a4bb8"],
    ["Princesa Peach", 37, "hair:tiara hc:#f2d36a body:#ff8ad8 leg:#ff8ad8"],
    ["Bowser", 39, "skin:#e3c35a body:#3c9a4a hair:wild hc:#e8502a ears:horns belly:#f4e2b0"],
    ["Link", 270, "hair:link hc:#e7c25a body:#3c9a4a leg:#e9dcc0 acc:sword em:belt ears:elf"],
    ["Zelda", 271, "hair:tiara hc:#e7c25a body:#ffffff leg:#ff8ad8 ears:elf"],
    ["Sonic", 283, "skin:#2a5bd0 body:#2a5bd0 hair:spiky hc:#2a5bd0 belly:#f4e2b0 leg:#d0202a"],
    ["Kirby", 299, "skin:#ffb3cf body:#ffb3cf cheeks:#ff6b9a leg:#d0202a"],
    ["Master Chief", 7, "mask:#5a7a3a body:#5a7a3a eyes:visor visor:#e3b33c square"],
    ["Steve", 316, "skin:#c69c6d hair:buzz hc:#3b2414 body:#3fb8c8 leg:#3a3aa0 square"],
    ["Creeper", 320, "skin:#5fbf4a body:#5fbf4a eyes:mando square"],
    ["Pac-Man", 81, "skin:#f2c21a body:#f2c21a eyes:dot"],
    ["Donkey Kong", 47, "skin:#e8c49a mask:#6b4426 mouth body:#6b4426 em:tie"],
    ["Yoshi", 52, "skin:#5fbf4a body:#ffffff belly:#ffffff hair:mohawk hc:#d0202a"],
    ["Crash Bandicoot", 273, "skin:#f07a1e body:#2a5bd0 hair:mohawk hc:#d0202a grin"],
    ["Lara Croft", 168, "hair:pony hc:#5a3a2a body:#3fb8c8 leg:#8a6a4a"],
    ["Pikmin", 99, "skin:#d0202a body:#d0202a leaf"],
    ["Samus", 23, "mask:#e8502a body:#e8502a eyes:visor visor:#5fbf4a"],
    ["Inkling", 57, "skin:#f2c9a0 hair:wild hc:#ff4fd8 mask2:#222 body:#2a2a3a"],
    ["Pacman fantasma", 82, "skin:#ff4d6d body:#ff4d6d eyes:robot"],
  ],
  ds: [
    ["Mickey", 1, "skin:#f6dcc4 mask:#1a1a1a mouth ears:mouse earc:#1a1a1a body:#d0202a em:dot"],
    ["Minnie", 23, "skin:#f6dcc4 mask:#1a1a1a mouth ears:mouse earc:#1a1a1a body:#d0202a em:heart"],
    ["Stitch", 159, "skin:#3d6fd1 body:#3d6fd1 ears:big earc:#3d6fd1 belly:#9fc3e6"],
    ["Woody", 168, "hair:hat hc:#8a5a2b body:#f2c21a leg:#3a5bd0 em:star"],
    ["Buzz Lightyear", 169, "skin:#f2c9a0 hair:hood hc:#7b52b8 body:#ffffff leg:#3c9a4a em:dot"],
    ["Elsa", 82, "hair:elsa hc:#f4ecd8 body:#7fc8e8 leg:#7fc8e8"],
    ["Olaf", 83, "skin:#ffffff body:#ffffff spots:#222 hair:mohawk hc:#6b4426"],
    ["Simba", 85, "skin:#e3a24a body:#e3a24a ears:cat earc:#e3a24a hair:mohawk hc:#c0592a"],
    ["Rapunzel", 147, "hair:long hc:#f2d36a body:#9b6bd0"],
    ["Ariel", 220, "hair:long hc:#d0202a body:#3c9a4a tail:#3c9a4a"],
    ["Wall-E", 45, "skin:#e3b33c body:#e3b33c eyes:robot square"],
    ["Sully", 1156, "skin:#4ab8d0 body:#4ab8d0 ears:horns spots:#9b6bd0"],
    ["Mike Wazowski", 1157, "skin:#7ad04a body:#7ad04a eyes:one ears:horns"],
    ["Pato Donald", 2, "skin:#ffffff body:#2a6fd0 hair:hat hc:#2a6fd0 em:tie"],
    ["Goofy", 3, "skin:#f6dcc4 mask:#1a1a1a mouth hair:hat hc:#3c9a4a body:#f07a1e ears:big earc:#1a1a1a"],
    ["Rayo McQueen", 282, "skin:#d0202a body:#d0202a eyes:visor visor:#bff3ff em:bolt"],
    ["Moana", 213, "hair:curly hc:#2a1a10 skin:#b98a5a body:#d0202a"],
    ["Maléfica", 232, "mask:#1a1a1e skin:#a8d8a0 mouth ears:horns earc:#1a1a1e body:#1a1a1e cape:#3a1a4a"],
    ["Baymax", 105, "skin:#ffffff body:#ffffff eyes:robot"],
    ["Bella", 221, "hair:bun hc:#5a3a2a body:#f2c21a"],
  ],
  mv: [
    ["Spider-Man", 593, "mask:#d0202a body:#d0202a leg:#2a4bb8 eyes:spidey web em:spider"],
    ["Iron Man", 285, "mask:#b5121b skin:#e2b33c body:#b5121b eyes:iron em:arc square"],
    ["Capitán América", 450, "body:#2a5bd0 cap2:#2a5bd0 acc:shield em:star"],
    ["Thor", 451, "hair:long hc:#e7c25a beard:#c9a227 body:#3a3a44 cape:#b5121b acc:hammer"],
    ["Hulk", 449, "skin:#5fbf4a hair:short hc:#222 body:#7b52b8 leg:#7b52b8"],
    ["Viuda Negra", 603, "hair:long hc:#d0302a body:#1a1a1e em:dot"],
    ["Thanos", 289, "skin:#9b6bd0 body:#2a5bd0 acc:gauntlet square"],
    ["Groot", 49, "skin:#8a5a2b body:#8a5a2b leaf hair:mohawk hc:#5a3a1a"],
    ["Deadpool", 20, "mask:#b5121b body:#b5121b eyes:bat mask2:#1a1a1e"],
    ["Lobezno", 5, "mask:#f2c21a skin:#f2c9a0 mouth body:#f2c21a ears:bat earc:#1a1a1e acc:claws em:x"],
    ["Pantera Negra", 273, "mask:#1a1a1e body:#1a1a1e ears:cat earc:#1a1a1e eyes:bat"],
    ["Doctor Strange", 169, "hair:short hc:#2a1a10 stache body:#2a3a7a cape:#b5121b"],
    ["Loki", 36, "hair:long hc:#111 body:#3c9a4a ears:horns earc:#e3b33c"],
    ["Rocket", 48, "skin:#8a6a4a body:#d07a2a ears:fox earc:#8a6a4a"],
    ["Venom", 363, "mask:#111 body:#111 eyes:spidey teeth"],
    ["Black Widow Yelena", 604, "hair:short hc:#e7c25a body:#2a2a3a"],
    ["Ojo de Halcón", 70, "hair:short hc:#5a3a2a body:#7b52b8 acc:bow"],
    ["Ant-Man", 85, "mask:#b5121b body:#b5121b eyes:robot"],
    ["Bruja Escarlata", 823, "hair:long hc:#b5121b body:#b5121b em:dot"],
    ["Miles Morales", 402, "mask:#1a1a1e body:#1a1a1e leg:#1a1a1e eyes:spidey em:spider web"],
  ],
  sw: [
    ["Darth Vader", 1, "mask:#1a1a1e body:#1a1a1e eyes:vader cape:#0d0d10 acc:saber/#ff2a2a square"],
    ["Luke Skywalker", 2, "hair:side hc:#e7c25a body:#f4ecd8 acc:saber/#4dd2ff"],
    ["Princesa Leia", 3, "hair:bun hc:#5a3a2a body:#ffffff"],
    ["Han Solo", 4, "hair:side hc:#5a3a2a body:#f4ecd8 leg:#2a3a5a"],
    ["Chewbacca", 6, "skin:#8a5a2b body:#8a5a2b hair:messy hc:#6b4426 em:belt"],
    ["Yoda", 124, "skin:#a9c98d body:#c7a77a ears:yoda acc:saber/#5fbf4a"],
    ["Grogu", 368, "skin:#a9c98d body:#c7a77a ears:yoda"],
    ["Mandaloriano", 326, "mask:#9aa3ad body:#6b5a4a eyes:mando cape:#5a4a3a"],
    ["Stormtrooper", 7, "mask:#f2f4f7 body:#f2f4f7 eyes:trooper square em:belt"],
    ["Boba Fett", 297, "mask:#3c7a6a body:#6b7a4a eyes:mando"],
    ["R2-D2", 31, "skin:#e8eef5 body:#e8eef5 eyes:robot em:dot"],
    ["C-3PO", 13, "skin:#e3b33c body:#e3b33c eyes:glow"],
    ["Kylo Ren", 104, "mask:#1a1a1e body:#1a1a1e eyes:vader acc:saber/#ff2a2a"],
    ["Obi-Wan Kenobi", 538, "hair:short hc:#c9a46a beard:#c9a46a body:#c9a46a cape:#6b4426 acc:saber/#4dd2ff"],
    ["Darth Maul", 1, "skin:#c0201a stripe ears:horns earc:#e8e0c8 body:#1a1a1e acc:saber/#ff2a2a"],
    ["Rey", 54, "hair:bun hc:#5a3a2a body:#e9dcc0 acc:staff"],
    ["Ahsoka", 268, "skin:#e8763a hair:hood hc:#f4f4f4 body:#5a3a2a acc:saber/#f4f4f4"],
    ["Palpatine", 31, "hair:hood hc:#1a1a1e skin:#e8e0d0 body:#1a1a1e eyes:glow"],
    ["Ewok", 290, "skin:#8a6a4a body:#8a6a4a hair:hood hc:#c9a46a"],
    ["BB-8", 61, "skin:#f4f4f4 body:#f4f4f4 eyes:robot em:pkb"],
  ],
  st: [
    ["Eleven", 421, "hair:buzz hc:#6b4426 nose body:#f2a7c3 arm:#2a5bd0 acc:eggo"],
    ["Mike", 422, "hair:messy hc:#2a1a10 body:#3c9a4a"],
    ["Dustin", 424, "hair:cap cc:#2a5bd0 capl:☆ hc:#6b4426 body:#d0202a teeth"],
    ["Lucas", 423, "hair:hood hc:#3c7a3a skin:#7a4a2b body:#3c7a3a"],
    ["Will", 425, "hair:short hc:#5a3a2a body:#b5121b"],
    ["Max", 806, "hair:long hc:#d0602a body:#2a5bd0"],
    ["Steve Harrington", 512, "hair:messy hc:#6b4426 body:#f2c21a acc:sword"],
    ["Jim Hopper", 513, "hair:hat hc:#8a6a4a stache body:#c9a46a"],
    ["Joyce", 514, "hair:long hc:#3b2414 body:#c9a46a"],
    ["Eddie Munson", 1462, "hair:long hc:#2a1a10 body:#1a1a1e acc:guitar"],
    ["Robin", 1243, "hair:short hc:#e7c25a body:#ffffff cap2:#2a5bd0"],
    ["Demogorgon", 428, "mask:#8a6a5e body:#6e554b eyes:none petals"],
    ["Vecna", 1464, "mask:#8a4a3a body:#4a2a1a eyes:red stitch"],
    ["Erica", 1240, "hair:curly hc:#2a1a10 skin:#7a4a2b body:#ff8ad8"],
    ["Nancy", 513, "hair:long hc:#5a3a2a body:#f4ecd8"],
    ["Jonathan", 515, "hair:side hc:#3b2414 body:#6b4426"],
    ["Murray", 1300, "hair:short hc:#c9a46a glasses body:#5a6a7a"],
    ["Eleven punk", 717, "hair:messy hc:#2a1a10 body:#1a1a1e nose"],
    ["Demoperro", 1307, "skin:#6e554b body:#6e554b eyes:none petals ears:fox earc:#6e554b"],
    ["Mind Flayer", 1308, "mask:#3a2a3a body:#3a2a3a eyes:red ears:antenna earc:#3a2a3a"],
  ],
  hp: [
    ["Harry Potter", 1, "hair:messy hc:#2a1a10 glasses scar body:#2b2b33 em:hp acc:wand"],
    ["Hermione", 3, "hair:long hc:#7a4a24 body:#2b2b33 em:hp acc:wand"],
    ["Ron", 2, "hair:messy hc:#d0602a body:#2b2b33 em:hp acc:wand"],
    ["Dumbledore", 15, "hair:witch hc:#5a2a7a beard:#e8e4dc body:#5a2a7a acc:wand"],
    ["Snape", 5, "hair:long hc:#111 body:#111 cape:#0d0d10 acc:wand"],
    ["Hagrid", 7, "hair:wild hc:#3b2414 beard:#3b2414 body:#5a3a2a"],
    ["Voldemort", 6, "skin:#e8e4dc body:#1a1a1e eyes:red acc:wand"],
    ["Dobby", 17, "skin:#d8c8a0 body:#c9b88a ears:big earc:#d8c8a0 eyes:glow"],
    ["Luna", 41, "hair:long hc:#f2d36a body:#2b2b33 em:dot"],
    ["Draco", 13, "hair:side hc:#f2e6b8 body:#2b2b33 em:dot"],
    ["Hedwig", 44, "skin:#ffffff body:#ffffff spots:#222 eyes:glow"],
    ["Sirius Black", 16, "hair:long hc:#2a1a10 beard:#2a1a10 body:#3a3a44"],
    ["McGonagall", 37, "hair:witch hc:#1f5a36 body:#1f5a36 glasses"],
    ["Neville", 23, "hair:short hc:#5a3a2a body:#2b2b33 em:hp"],
    ["Ginny", 46, "hair:long hc:#d0602a body:#2b2b33 em:hp"],
    ["Bellatrix", 35, "hair:wild hc:#1a1a1e body:#1a1a1e acc:wand"],
    ["Fawkes", 87, "skin:#d0402a body:#d0402a wings:#f2c21a eyes:glow"],
    ["Hagrid con Norberto", 99, "hair:wild hc:#3b2414 beard:#3b2414 body:#5a3a2a acc:pumpkin"],
    ["Sombrero Seleccionador", 21, "skin:#8a6a4a body:#8a6a4a hair:witch hc:#6b4a2a eyes:none smile"],
    ["Dementor", 18, "hair:hood hc:#1a1a1e mask:#1a1a1e body:#1a1a1e eyes:none cape:#0d0d10"],
  ],
  dc: [
    ["Batman", 1, "mask:#2b2d36 mouth body:#5a5e6a leg:#2b2d36 arm:#2b2d36 eyes:bat ears:bat cape:#1d1f26 em:bat"],
    ["Superman", 7, "hair:short hc:#111 body:#2a5bd0 cape:#d0202a em:S"],
    ["Wonder Woman", 172, "hair:long hc:#111 body:#b5121b leg:#2a5bd0 em:w acc:lasso"],
    ["Joker", 36, "skin:#f4f4f4 hair:side hc:#3c9a4a body:#7b52b8 clown"],
    ["Harley Quinn", 301, "skin:#f4f4f4 hair:pony hc:#f2d36a body:#d0202a acc:hammer"],
    ["Flash", 10, "mask:#d0202a mouth body:#d0202a em:bolt ears:bat earc:#f2c21a"],
    ["Aquaman", 245, "hair:long hc:#e7c25a beard:#c9a227 body:#e3a24a leg:#3c9a4a acc:trident"],
    ["Robin", 104, "hair:short hc:#111 mask2:#111 body:#d0202a cape:#f2c21a"],
    ["Catwoman", 129, "mask:#1a1a1e mouth ears:cat earc:#1a1a1e body:#1a1a1e eyes:visor visor:#cfd6df"],
    ["Linterna Verde", 9, "hair:short hc:#3b2414 mask2:#3c9a4a body:#3c9a4a acc:ring em:dot"],
    ["Cyborg", 247, "skin:#7a4a2b body:#9aa3ad eyes:robot"],
    ["Pingüino", 22, "skin:#f2c9a0 hair:hat hc:#1a1a1e body:#1a1a1e glasses em:stripe"],
    ["Acertijo", 11, "mask2:#3c9a4a hair:hat hc:#3c9a4a body:#3c9a4a"],
    ["Hiedra Venenosa", 160, "skin:#a8d8a0 hair:long hc:#d0302a body:#3c9a4a leaf"],
    ["Bane", 13, "mask:#3a3a44 body:#3a3a44 eyes:robot teeth"],
    ["Batgirl", 210, "hair:long hc:#d0302a mask:#5a5e6a mouth ears:bat earc:#5a5e6a body:#5a5e6a em:bat2"],
    ["Shazam", 260, "hair:short hc:#111 body:#d0202a cape:#ffffff em:bolt"],
    ["Supergirl", 223, "hair:long hc:#f2d36a body:#2a5bd0 cape:#d0202a em:S"],
    ["Black Adam", 1235, "hair:short hc:#111 body:#1a1a1e em:bolt cape:#e3b33c"],
    ["Krypto", 434, "skin:#ffffff body:#ffffff ears:big earc:#c9a46a cape:#d0202a em:S"],
  ],
  an: [
    ["Goku", 109, "hair:spiky hc:#1a1a1a body:#f07a1e leg:#f07a1e arm:#f2c9a0 em:belt"],
    ["Vegeta", 10, "hair:spiky hc:#1a1a1a body:#2a5bd0 em:stripe"],
    ["Naruto", 71, "hair:naruto hc:#f2c21a body:#f07a1e leg:#f07a1e arm:#2b2b33"],
    ["Sasuke", 72, "hair:spiky hc:#2a2a4a body:#ffffff leg:#2a2a4a acc:sword"],
    ["Luffy", 98, "hair:hat hc:#e3c35a body:#d0202a leg:#2a5bd0 smile"],
    ["Zoro", 327, "hair:short hc:#3c9a4a body:#ffffff acc:sword"],
    ["Tanjiro", 867, "hair:messy hc:#5a1a1a body:#3c9a4a scar acc:sword"],
    ["Nezuko", 868, "hair:long hc:#1a1a1a body:#ff8ad8 eyes:glow"],
    ["Totoro", 157, "skin:#7a8a8c body:#7a8a8c belly:#f4ecd8 ears:cat earc:#7a8a8c grin"],
    ["Deku", 247, "hair:messy hc:#2f6f4a body:#3c7a6a cheeks:#f4c09a"],
    ["All Might", 248, "hair:wild hc:#f2c21a body:#2a5bd0 grin em:stripe"],
    ["Gojo", 1373, "hair:wild hc:#f4f4f4 mask2:#1a1a1e body:#1a1a2a"],
    ["Pikachu Ash", 1, "hair:cap cc:#d0202a capl:A hc:#1a1a1a body:#2a5bd0"],
    ["Sailor Moon", 89, "hair:pony hc:#f2d36a body:#ffffff leg:#2a5bd0 em:heart"],
    ["Levi", 235, "hair:side hc:#1a1a1a body:#c9a46a acc:sword"],
    ["Ichigo", 59, "hair:spiky hc:#f07a1e body:#1a1a1e acc:sword"],
    ["Saitama", 255, "skin:#f2c9a0 hair:bald body:#f2c21a cape:#ffffff"],
    ["Kakashi", 182, "hair:wild hc:#cfd6df mask2:#2a2a3a body:#3c7a3a"],
    ["Chopper", 99, "skin:#e3a24a body:#e3a24a hair:hat hc:#ff8ad8 ears:horns earc:#8a5a2b"],
    ["Mikasa", 145, "hair:side hc:#1a1a1a body:#c9a46a acc:sword"],
  ],
  se: [
    ["Miércoles", 1309, "hair:long hc:#111 skin:#ececec body:#1a1a1e em:stripe"],
    ["Homer", 497, "skin:#f2d36a hair:bald stache:#8a6a4a body:#ffffff leg:#2a5bd0"],
    ["Bart", 498, "skin:#f2d36a hair:mohawk hc:#f2d36a body:#f07a1e leg:#2a5bd0"],
    ["Bob Esponja", 25, "skin:#f2e04a body:#c9a46a teeth square em:tie"],
    ["Patricio", 26, "skin:#ff8ab0 body:#3c9a4a smile"],
    ["E.T.", 1252, "skin:#a8865a body:#ffffff eyes:glow"],
    ["Marty McFly", 49, "hair:side hc:#5a3a2a body:#d0202a"],
    ["Doc Brown", 50, "hair:wild hc:#f4f4f4 body:#f4f4f4 glasses"],
    ["Jon Nieve", 49, "hair:long hc:#2a1a10 beard:#2a1a10 body:#1a1a1e cape:#3a3a44 acc:sword"],
    ["Daenerys", 3, "hair:long hc:#f4ecd8 body:#5a6a7a"],
    ["Eleven Hawkins", 1000, "hair:short hc:#6b4426 body:#f2a7c3"],
    ["Shrek", 278, "skin:#9bc94a ears:antenna earc:#9bc94a body:#f4ecd8 em:belt"],
    ["Jack Sparrow", 273, "hair:hat hc:#5a3a2a beard:#3b2414 body:#ffffff acc:sword"],
    ["Indiana Jones", 199, "hair:hat hc:#8a5a2b body:#c9a46a stache:#5a3a2a"],
    ["Gandalf", 443, "hair:witch hc:#9aa3ad beard:#e8e4dc body:#9aa3ad acc:staff"],
    ["Frodo", 444, "hair:curly hc:#5a3a2a body:#f4ecd8 acc:ring"],
    ["Gollum", 532, "skin:#a8a08a body:#a8a08a ears:big earc:#a8a08a eyes:glow acc:ring"],
    ["Ted Lasso", 1351, "hair:short hc:#5a3a2a stache:#5a3a2a body:#2a3a7a"],
    ["Walter White", 162, "hair:hat hc:#1a1a1e beard:#8a6a4a glasses body:#3c9a4a"],
    ["Mr. Bean", 786, "hair:short hc:#3b2414 body:#6b4426 em:tie"],
  ],
  te: [
    ["Ghostface", 1607, "mask:#f4f4f4 body:#1a1a1e cape:#1a1a1e eyes:ghost acc:knife"],
    ["Freddy Krueger", 2, "hair:hat hc:#6b4426 skin:#c9785a body:#b5121b em:stripe acc:claws"],
    ["Jason Voorhees", 1, "mask:#f4f4f4 body:#3a4a3a eyes:mando spots:#d0202a acc:axe"],
    ["Pennywise", 472, "skin:#f4f4f4 hair:wild hc:#e8502a body:#cfd6df clown acc:balloon"],
    ["Chucky", 56, "hair:messy hc:#e8502a body:#2a5bd0 em:stripe acc:knife"],
    ["Michael Myers", 3, "mask:#ececec body:#2a3a4a eyes:none hair:short hc:#3b2414 acc:knife"],
    ["Annabelle", 469, "hair:long hc:#5a3a2a skin:#f4ecd8 body:#f4f4f4"],
    ["Jack Skellington", 15, "mask:#f4f4f4 body:#1a1a1e eyes:ghost em:bat2"],
    ["Beetlejuice", 5, "skin:#cfd6c0 hair:wild hc:#9bc94a body:#f4f4f4 em:stripe"],
    ["Pinhead", 4, "skin:#e8e4dc body:#1a1a1e spots:#555"],
    ["Samara", 6, "hair:long hc:#111 body:#f4f4f4 eyes:none"],
    ["Leatherface", 11, "skin:#c9a46a body:#c9a46a stitch acc:axe"],
    ["Drácula", 1000, "hair:side hc:#111 skin:#ececec body:#1a1a1e cape:#7a1018 teeth"],
    ["Frankenstein", 1001, "skin:#9bc94a hair:buzz hc:#111 body:#3a3a44 square stitch"],
    ["La Momia", 1002, "skin:#e8e0c8 body:#e8e0c8 stitch eyes:glow"],
    ["Hombre Lobo", 1003, "skin:#6b5a4a body:#6b5a4a ears:fox earc:#6b5a4a teeth"],
    ["Slimer", 1004, "skin:#7af05a body:#7af05a grin"],
    ["Gremlin", 1005, "skin:#5fbf4a body:#5fbf4a ears:big earc:#5fbf4a eyes:red teeth"],
    ["Gizmo", 1006, "skin:#c9a46a body:#c9a46a ears:big earc:#c9a46a"],
    ["Carrie", 1007, "hair:long hc:#e7c25a body:#ff8ad8 spots:#d0202a"],
  ],
};

/** Edición especial de cada figura (se compra suelta cuando el nivel de la zona la desbloquea). */
const SPV = ["glow", "metal", "flock", "glow", "metal"];
export const FIGS = [];
for (const c of FKCOLS)
  RAW[c].forEach(([name, n, look], i) => {
    const w = Math.floor(i / 5) + 1,
      r = i % 5 === 4 ? 1 : 0,
      h = (i * 37 + c.charCodeAt(0) * 13) % 100;
    FIGS.push({
      id: c + (i + 1),
      c,
      n,
      name,
      look,
      w,
      r,
      b: r ? 26 + (h % 11) : 12 + (h % 5), // precio base de mercado (€)
      sp: i % 4 === 1 ? SPV[(i + c.length) % SPV.length] : null, // edición especial
      dia: i % 7 === 3, // Diamond (nivel 8)
    });
  });

/** Deluxe (nivel 6): escenas y figuras grandes, sueltas. */
export const DLX = [
  ["dx1", "sw", "Halcón Milenario con Han", "skin:#c9ccd2 body:#c9ccd2 eyes:robot", 95],
  ["dx2", "se", "Trono de Hierro", "skin:#9aa3ad body:#6b7a8a eyes:none spots:#cfd6df", 110],
  ["dx3", "mv", "Hulkbuster", "mask:#b5121b body:#e3b33c eyes:iron square", 85],
  ["dx4", "pk", "Snorlax gigante", "skin:#4a7a8c body:#4a7a8c belly:#f4e2c0 ears:cat earc:#4a7a8c smile", 70],
  ["dx5", "hp", "Hogwarts Express", "skin:#b5121b body:#1a1a1e eyes:robot", 90],
  ["dx6", "dc", "Batmóvil", "skin:#1a1a1e body:#2b2d36 eyes:visor visor:#f2c21a", 80],
  ["dx7", "an", "Shenron", "skin:#3c9a4a body:#3c9a4a ears:horns earc:#e3b33c eyes:red", 100],
  ["dx8", "ds", "Castillo de Disney", "skin:#e8eef5 body:#7fc8e8 hair:crown hc:#2a6fd0", 120],
].map(([id, c, name, look, b]) => ({ id, c, n: 1000 + parseInt(id.slice(2)), name, look, w: 0, r: 2, b, dlx: true }));

/** Grails legendarios (nivel 9): ediciones de 480 unidades; solo se puede comprar uno de cada. */
export const GRAILS = [
  [
    "gr1",
    "sw",
    "Darth Vader Holográfico",
    "mask:#4dd2ff body:#4dd2ff eyes:vader cape:#2a8fc8 acc:saber/#ff2a2a square",
    420,
  ],
  ["gr2", "mv", "Spider-Man Metálico 2012", "mask:#d0202a body:#d0202a leg:#2a4bb8 eyes:spidey web em:spider", 520],
  ["gr3", "pk", "Pikachu Platino", "skin:#e8eef5 body:#e8eef5 ears:pika cheeks zig:#cfd6df", 650],
  ["gr4", "dc", "Batman Clear Glitter", "mask:#cfe6ff mouth body:#cfe6ff eyes:bat ears:bat cape:#9fc3e6 em:bat", 480],
  ["gr5", "hp", "Harry Potter Dorado", "hair:messy hc:#2a1a10 glasses scar body:#c9a227 acc:wand", 560],
  ["gr6", "st", "Demogorgon Glow", "mask:#7af05a body:#5fbf4a eyes:none petals", 450],
].map(([id, c, name, look, b]) => ({ id, c, n: 480, name, look, w: 0, r: 3, b, grail: true }));

/** El Santo Grial (nivel 10): una sola pieza en el mundo. */
export const GOLD = {
  id: "oro",
  c: "pk",
  n: 24,
  name: "Funko de oro de 24 quilates",
  look: "skin:#e3b33c body:#e3b33c ears:pika cheeks:#c99a22 zig:#c99a22",
  w: 0,
  r: 4,
  b: 9000,
  gold: true,
};

export const ALLF = FIGS.concat(DLX, GRAILS, [GOLD]);
export const FBYID = Object.fromEntries(ALLF.map((f) => [f.id, f]));
