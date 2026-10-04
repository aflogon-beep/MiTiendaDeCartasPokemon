// Guion de la historia de inicio «La tienda de papá» (docs/intro/HISTORIA.md), como datos.
// Cada paso es un toque del jugador:
//   scene   número y título de la escena (se enseña al empezar cada una)
//   shot    "wide": plano general (la tienda o la calle de verdad, con la cámara moviéndose)
//           "close": primer plano (retratos grandes con bandas de cine)
//   cam     (wide) punto del mundo al que va la cámara y zoom (veces la vista normal de la tienda)
//   cast    (wide) muñecos en el mundo: { quién: { at:[x,y], to?:[x,y], pose?: "run"|"fall"|"kid" } }
//   who     (close) retratos: [[personaje, expresión], …] (uno, o dos: izquierda y derecha)
//   look    (close) "dramatic": luz desde abajo
//   tilt    (close) personaje que sale tumbado («desde el suelo»)
//   say     [quién, expresión, texto]; quién puede ser "emma+alvaro" (hablan a la vez) o null (narración)
//   note    nota de dirección: lo que pasa en la escena (no se enseña; lo cuentan el plano y los efectos)
//   pop     palabra de cómic que salta con el efecto (¡Miau!, ¡Guau!…)
//   fx      efecto: sparkle, fall, keys, pet, notes, dong, calc, shutter
//   ask     "name": pedir el nombre de la tienda (no se pide al repetir la historia)
// Expresiones (personajes.html): happy, laugh, wow, angry, sweat, stars.

export const NAMES = {
  alvaro: "Álvaro",
  emma: "Emma",
  alberto: "Papá",
  ramon: "Don Ramón",
  "emma+alvaro": "Emma y Álvaro",
};
export const NAME_SUGGESTIONS = ["Gengar Cards", "Aitana Cards", "Poké Cards"];

// Mascota elegida: sustituye al gato de la escena 3 (sin mascota, ese chiste no sale)
const PET = {
  cat: {
    un: "un gato",
    fx: "¡Miau!",
    note: "El gato salta encima del mostrador.",
    kid: "¡Un gatito!",
    no: "Es naranja.",
  },
  dog: {
    un: "un perro",
    fx: "¡Guau!",
    note: "El perro salta encima del mostrador.",
    kid: "¡Un perrito!",
    no: "Es un perro.",
  },
  bunny: {
    un: "un conejo",
    fx: "¡Boing!",
    note: "El conejo salta encima del mostrador.",
    kid: "¡Un conejito!",
    no: "Es un conejo.",
  },
};

// Puntos del mundo (ver world/layout.js): mostrador y caja a la derecha, puerta abajo, calle debajo
const SHOP = { x: 400, y: 330, z: 1 };
const STREET = { x: 470, y: 660, z: 1.1 };
const SIGN = { x: 400, y: 26, z: 2.3 };
const COUNTER = [735, 330];
const SOFA = [170, 500];
const DOOR_IN = [355, 640];

export function storyScript(pet = "cat") {
  const p = PET[pet];
  const s = [];
  const sc = (n, t, base) => (step) => s.push(Object.assign({ scene: [n, t] }, base, step));

  // 1 · El anuncio
  let a = sc(1, "El anuncio", {
    shot: "wide",
    cam: SHOP,
    cast: { alberto: { at: COUNTER }, emma: { at: SOFA }, alvaro: { at: DOOR_IN, to: [480, 430], pose: "run" } },
  });
  a({
    note: "Papá levanta una mancuerna detrás del mostrador. Álvaro entra corriendo.",
    fx: "sparkle",
    say: ["alberto", "happy", "Chicos, venid. Tengo que contaros algo muy serio."],
  });
  a({ cast: castAt("alvaro", [480, 430]), say: ["emma", "sweat", "¿Has vuelto a comprar otro póster de Bunbury?"] });
  a({ cast: castAt("alvaro", [480, 430]), say: ["alberto", "sweat", "…Sí. Pero no es eso."] });

  // 2 · ¡Me jubilo!
  a = sc(2, "¡Me jubilo!", { shot: "close" });
  a({
    who: [["alberto", "stars"]],
    note: "Papá se pone una cinta en la frente. Las pesas brillan.",
    fx: "sparkle",
    say: ["alberto", "stars", "¡ME JUBILO! Me voy al gimnasio… ¡a tiempo completo!"],
  });
  a({
    who: [["alvaro", "wow"]],
    tilt: "alvaro",
    note: "Álvaro llega corriendo, tropieza con una caja y cae de cara. ¡Las cartas vuelan!",
    fx: "fall",
    say: ["alvaro", "wow", "¡¿QUÉ?!"],
  });
  a({ who: [["emma", "angry"]], say: ["emma", "angry", "Papá, tienes una tienda."] });
  a({ who: [["alberto", "laugh"]], say: ["alberto", "laugh", "La tenía. ¡Ahora es vuestra!"] });
  a({
    who: [["alvaro", "sweat"]],
    note: "Papá lanza las llaves. Álvaro salta a cogerlas, falla… y le caen en la cabeza.",
    fx: "keys",
    say: [null, null, "¡Clonk!"],
  });

  // 3 · Dos herederos muy distintos
  a = sc(3, "Dos herederos muy distintos", { shot: "close" });
  a({
    who: [
      ["alvaro", "stars"],
      ["emma", "happy"],
    ],
    say: ["alvaro", "stars", "¡Una tienda de cartas Pokémon! ¡Puedo abrir TODOS los sobres que quiera!"],
  });
  a({
    who: [
      ["alvaro", "sweat"],
      ["emma", "angry"],
    ],
    say: ["emma", "angry", "NO. Los sobres se VENDEN, Álvaro."],
  });
  a({
    who: [
      ["alvaro", "happy"],
      ["emma", "sweat"],
    ],
    say: ["emma", "sweat", "Yo quería heredar una tienda de maquillaje…"],
  });
  if (p) {
    a({
      who: [["alberto", "happy"]],
      say: ["alberto", "happy", `Hija, en la vida no siempre heredas lo que quieres. A veces heredas… ${p.un}.`],
    });
    a({
      who: [
        ["alvaro", "stars"],
        ["emma", "wow"],
      ],
      note: p.act,
      pop: p.fx,
      fx: "pet",
      say: ["alvaro", "stars", `${p.kid} Se llamará… ¡Gengar!`],
    });
    a({
      who: [
        ["alvaro", "stars"],
        ["emma", "sweat"],
      ],
      say: ["emma", "sweat", p.no],
    });
    a({
      who: [
        ["alvaro", "happy"],
        ["emma", "sweat"],
      ],
      say: ["alvaro", "happy", "Gengar."],
    });
  } else
    a({
      who: [["alberto", "happy"]],
      say: ["alberto", "happy", "Hija, en la vida no siempre heredas lo que quieres."],
    });

  // 4 · Las tres reglas del maestro
  a = sc(4, "Las tres reglas del maestro", { shot: "close", look: "dramatic" });
  a({
    who: [["alberto", "happy"]],
    note: "Papá cruza los brazos como un maestro Jedi.",
    say: ["alberto", "happy", "Escuchadme, jóvenes padawans. Tres reglas tiene el buen tendero."],
  });
  a({ who: [["alberto", "happy"]], say: ["alberto", "happy", "Una: compra barato y vende con cariño."] });
  a({
    who: [["alberto", "wow"]],
    say: ["alberto", "wow", "Dos: cuidado con las cartas falsas. Son el lado oscuro de la colección."],
  });
  a({ who: [["alberto", "angry"]], say: ["alberto", "angry", "Y tres: NUNCA abras toda la mercancía."] });
  a = sc(4, "Las tres reglas del maestro", { shot: "close" });
  a({
    who: [
      ["alvaro", "sweat"],
      ["emma", "happy"],
    ],
    note: "Álvaro esconde un sobre detrás de la espalda.",
    say: ["alvaro", "sweat", "Ejem… ¿y si es solo uno?"],
  });
  a({
    who: [
      ["alvaro", "sweat"],
      ["emma", "angry"],
    ],
    say: ["emma", "angry", "Álvaro."],
  });
  a({
    who: [
      ["alvaro", "sweat"],
      ["emma", "happy"],
    ],
    say: ["alvaro", "sweat", "…Vale."],
  });

  // 5 · Papá se va
  a = sc(5, "Papá se va", { shot: "wide", cam: STREET });
  a({
    cast: { alberto: { at: [355, 600], to: [560, 700], pose: "run" } },
    note: "Papá sale de la tienda en chándal, con la bolsa del gimnasio y tocando una guitarra imaginaria.",
    fx: "notes",
    say: ["alberto", "laugh", "¡Me voy, que hoy toca pierna! ♪ ♫"],
  });
  a({
    cast: castAt("alberto", [560, 700]),
    say: ["alberto", "happy", "Ah, y si necesitáis un consejo, pasaré a veces por aquí."],
  });
  a({
    cast: { alberto: { at: [560, 700], to: [760, 720], pose: "run" } },
    note: "Tropieza con una farola. Se recompone como si nada y sigue tarareando.",
    fx: "dong",
    say: [null, null, "♪ ♫"],
  });

  // 6 · Manos a la obra
  a = sc(6, "Manos a la obra", { shot: "close" });
  a({
    who: [
      ["alvaro", "happy"],
      ["emma", "happy"],
    ],
    note: "Emma saca una calculadora enorme.",
    fx: "calc",
    say: ["emma", "happy", "Bien. Tenemos 1.000 euros, una tienda vacía y un hermano peligroso."],
  });
  a({
    who: [
      ["alvaro", "angry"],
      ["emma", "happy"],
    ],
    say: ["alvaro", "angry", "¡Eh! Yo soy el que sabe de Pokémon."],
  });
  a({
    who: [
      ["alvaro", "angry"],
      ["emma", "laugh"],
    ],
    say: ["emma", "happy", "Y yo la que sabe sumar."],
  });
  a({
    who: [
      ["alvaro", "wow"],
      ["emma", "sweat"],
    ],
    tilt: "alvaro",
    note: "Álvaro va a quejarse, da un paso y tropieza con el cubo de fregar.",
    fx: "fall",
    say: ["emma", "sweat", "…Y yo la que no se cae."],
  });

  // 7 · El nombre de la tienda
  a = sc(7, "El nombre de la tienda", { shot: "wide", cam: SIGN, blankSign: true });
  a({ say: ["emma", "happy", "Falta lo más importante: ¿cómo la llamamos?"] });
  a({ say: ["alvaro", "stars", "¡GENGAR CARDS! ¡La estrella más oscura de la galaxia!"] });
  a({ say: ["emma", "stars", "¡Ni hablar! «Aitana Cards»."] });
  a({ act: "Papá, desde la calle:", say: ["alberto", "sweat", "¿Y «Bunbury Cards»?"] });
  a({ say: ["emma+alvaro", "angry", "¡PAPÁ, VETE AL GIMNASIO!"] });
  a({ ask: "name", say: ["emma", "happy", "Escribe el nombre de la tienda."] });
  a({ blankSign: false, say: ["emma", "happy", "…Vale. No está mal."] });
  a({ blankSign: false, say: ["alvaro", "stars", "¡Me encanta!"] });

  // 8 · ¡Abrimos!
  a = sc(8, "¡Abrimos!", {
    shot: "wide",
    cam: SHOP,
    cast: { emma: { at: SOFA }, alvaro: { at: [480, 430] }, kid: { at: [355, 680], to: DOOR_IN, pose: "kid" } },
  });
  a({
    note: "La persiana sube y entra la luz de la mañana. En la puerta se asoma un niño.",
    fx: "shutter",
    say: ["alvaro", "stars", "¡Nuestro primer cliente!"],
  });
  a({
    cast: { emma: { at: SOFA }, alvaro: { at: [480, 430] }, kid: { at: DOOR_IN } },
    say: ["emma", "happy", "Yo me encargo de las cuentas…"],
  });
  a({
    cast: { emma: { at: SOFA, pose: "fall" }, alvaro: { at: [480, 430] }, kid: { at: DOOR_IN } },
    note: "Emma se tumba en el sofá con la calculadora.",
    say: ["emma", "happy", "…desde el sofá. Tú atiendes."],
  });
  a({
    cast: { emma: { at: SOFA, pose: "fall" }, alvaro: { at: [480, 430] }, kid: { at: DOOR_IN } },
    say: ["alvaro", "happy", "¡Que la suerte de los sobres nos acompañe!"],
  });
  return s;

  function castAt(who, at) {
    const prev = s[s.length - 1].cast || {};
    const c = {};
    for (const k in prev)
      c[k] = { at: prev[k].to || prev[k].at, pose: prev[k].pose === "run" ? undefined : prev[k].pose };
    c[who] = { at };
    return c;
  }
}
