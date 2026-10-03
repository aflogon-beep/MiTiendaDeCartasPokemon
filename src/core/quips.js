// Frases recurrentes de Emma y Álvaro, y visitas de papá (docs/intro/HISTORIA.md → «Frases para el
// resto del juego»). Aquí solo la lógica: qué frase toca y cuándo; el bocadillo lo pinta ui/quips.js.
import { S, hasState } from "./state.js";

// Cada situación tiene varias frases: [quién, expresión, texto]. La primera vez sale la primera (la del guion);
// después, otra al azar, sin repetir la última. Expresiones: happy, laugh, wow, angry, sweat, stars.
const E = (ex, t) => ["emma", ex, t],
  A = (ex, t) => ["alvaro", ex, t];
export const QUIPS = {
  // Al abrir muchos sobres el mismo día
  packs: [
    E("angry", "¡ÁLVARO! ¡Eso era para VENDER!"),
    E("angry", "Cada sobre que abres es un pintalabios que no me compro."),
    E("sweat", "Álvaro. Deja. Los. Sobres."),
    E("angry", "Te los voy a descontar de la paga. Todos."),
    A("sweat", "Solo uno más… para investigar el mercado."),
    A("stars", "¡Es que huelen a carta nueva!"),
  ],
  // Récord de ventas (y al menos 150 €)
  bigday: [
    E("stars", "Esto ya huele a Sephora…"),
    E("stars", "Si seguimos así, me compro el sofá con masaje."),
    E("laugh", "¡Récord! Que no se entere papá, que pide comisión."),
    A("stars", "¡Somos los maestros Jedi de las cartas!"),
  ],
  // Tienda vacía un rato con la persiana subida
  empty: [
    E("sweat", "Si no hay clientes, yo vuelvo al sofá."),
    E("happy", "Qué silencio… perfecto para ver un capítulo."),
    E("sweat", "Pon algo bonito en la vitrina, a ver si entra alguien."),
    A("sweat", "¿Hola? ¿Hay alguien? ¿Algún Pokémon salvaje?"),
    E("happy", "¿Y si ponemos cartas más llamativas en la vitrina?"),
  ],
  // Al pillar una carta falsa
  fake: [
    E("laugh", "Ja. Ni que fuera tonta."),
    E("laugh", "Esa carta es más falsa que las excusas de Álvaro."),
    E("angry", "Aquí solo vendemos cartas de verdad, gracias."),
    A("angry", "¡Una falsa! El lado oscuro no pasará por esta tienda."),
  ],
  // Al subir la persiana con la tienda rival más barata
  rival: [
    E("angry", "¿Más baratos que nosotros? Eso lo arreglo yo con la calculadora."),
    E("angry", "Que bajen lo que quieran. Yo tengo calculadora y no tengo miedo."),
    A("angry", "¡Cartas El Rayo! Les vamos a ganar con mejores cartas y mejor sonrisa."),
  ],
  // Carta muy rara al abrir sobres
  rare: [
    A("stars", "¡LA FUERZA ES INTENSA EN ESTE SOBRE!"),
    A("stars", "¡Que alguien me pellizque! ¡Mira qué carta!"),
    A("stars", "¡Brilla más que un sable de luz!"),
    A("wow", "¡AAAAH! ¡Emma, ven a ver esto!"),
    E("stars", "Vale… esta sí ha merecido la pena. Pero solo esta."),
  ],
  // Un Gengar
  gengar: [
    A("stars", "¡GENGAAAAR! ¡Este no se vende! ❤️"),
    A("stars", "¡Mi Gengar! ¡A la colección, YA!"),
    A("laugh", "¡El lado oscuro nunca fue tan bonito! ❤️"),
    E("sweat", "Otro Gengar… ya sé dónde va a acabar este."),
  ],
  // Un ladrón
  thief: [
    A("wow", "¡Al ladrón! ¡Que alguien active el escudo deflector!"),
    A("angry", "¡Eh! ¡Eso es de la tienda!"),
    E("wow", "¡Álvaro, que se escapa! ¡Tócalo!"),
  ],
  // Ladrón pillado
  caught: [
    A("laugh", "¡Pillado! El escudo deflector funciona."),
    E("laugh", "¿Creías que no te veía? Tengo gafas, no estoy ciega."),
    A("stars", "¡Álvaro, guardián de la tienda!"),
  ],
  // Al subir la persiana (según el día)
  open: [
    A("happy", "¡Persiana arriba! ¡Que empiece la aventura!"),
    E("happy", "Sonrisa, cambio exacto y nada de abrir sobres. ¿Entendido?"),
    A("stars", "¡Hoy va a ser un gran día! Lo noto en la Poké Ball."),
    E("sweat", "Abro la caja… y el sofá ya me está llamando."),
    A("happy", "¡Que la suerte de los sobres nos acompañe!"),
  ],
  rain: [
    E("sweat", "Llueve… la gente se queda en casa viendo series. Como yo quiero."),
    A("sweat", "Con lluvia vendrá poca gente. ¡Pero los valientes compran!"),
  ],
  launch: [
    A("stars", "¡Hoy sale colección nueva! ¡Prepárate para la avalancha!"),
    E("happy", "Día de lanzamiento: muchos sobres en las estanterías, por favor."),
  ],
  vip: [
    E("stars", "Hoy viene alguien con mucho dinero. Álvaro, péinate."),
    A("wow", "¿Un cliente VIP? ¡Que la vitrina brille!"),
  ],
  tour: [
    A("stars", "¡Día de torneo! Que gane el mejor… o el que tenga más suerte."),
    E("happy", "Torneo hoy: más coleccionistas. Llena bien la vitrina."),
  ],
  // Casi la hora de cerrar
  late: [
    E("sweat", "Ya casi cerramos… el sofá me espera."),
    A("happy", "¡Últimos clientes del día! ¡Que no se escape nadie!"),
    E("happy", "Último empujón y a contar la caja."),
  ],
  // Una venta grande (50 € o más)
  bigsale: [
    E("stars", "¡Ese cliente es mi nuevo favorito!"),
    E("laugh", "Ding, ding, ding… ¡eso suena a dinero!"),
    A("stars", "¡Venta de las gordas! ¡Choca esos cinco!"),
    E("happy", "Trátalo bien, que vuelva mañana."),
  ],
  // Alguien se va harto de esperar en la cola
  queue: [
    E("sweat", "¡Se van por la cola! Álvaro, más rápido."),
    E("sweat", "Esa gente lleva esperando más que yo en el médico."),
    A("sweat", "¡Voy, voy! ¡Cobro a la velocidad de la luz!"),
  ],
  // Comprar una carta a un cliente
  buycard: [
    A("happy", "¡Carta nueva para la tienda!"),
    A("stars", "¡Nueva carta para la colección! Digo… para vender."),
    E("happy", "Apuntado en la calculadora. Ahora a venderla más cara."),
  ],
  // … a menos del 75 % de su valor (el consejo de papá)
  goodbuy: [
    E("stars", "¡Buen trato! Papá estaría orgulloso. Y sudando."),
    A("laugh", "Comprar barato, vender con cariño. ¡Regla número uno!"),
    E("laugh", "Esto es lo que yo llamo negociar."),
  ],
  // Comprar un lote
  lot: [
    A("wow", "¡Una caja misteriosa! ¿Qué habrá dentro?"),
    E("sweat", "Espero que dentro haya algo más que polvo."),
    A("stars", "¡Lotes! Mi parte favorita después de los sobres."),
  ],
  // Resultado del gradeo
  gem: [
    A("stars", "¡UN DIEZ! ¡Perfecta, como un droide recién salido de fábrica!"),
    E("stars", "Un diez. Esta carta vale ahora un dineral."),
    A("laugh", "¡Diez! ¡Que alguien me dé una medalla!"),
  ],
  lowgrade: [
    E("sweat", "Bueno… para la carpeta de recuerdos."),
    A("sweat", "Le falta un poco de entrenamiento a esta carta."),
    E("sweat", "Quizá la próxima vez la guardemos en funda antes."),
  ],
  // Día con pérdidas
  loss: [
    E("sweat", "Hoy hemos perdido dinero. Mañana, menos gastos y más ventas."),
    E("angry", "Números rojos… como mi cara cuando abres sobres."),
    A("sweat", "Un mal día lo tiene cualquiera. ¡Mañana remontamos!"),
  ],
  // Recoger algo del suelo
  clean: [
    E("happy", "Así me gusta, todo limpito."),
    A("happy", "¡Suelo despejado, capitana!"),
    E("laugh", "Si papá viera esto, diría que es como su gimnasio. Pero limpio."),
  ],
  // Jugadores en la mesa de juego
  table: [
    A("stars", "¡Gente jugando en la mesa! ¡Eso es espíritu Pokémon!"),
    E("happy", "Que jueguen, que jueguen. Cada partida, a la caja."),
    A("happy", "¡Algún día los reto a todos!"),
  ],
};

// Cada cuánto puede repetirse: "day" = una vez por día de juego; número = segundos reales
const EVERY = {
  packs: "day",
  bigday: "day",
  empty: "day",
  rival: 3,
  fake: 45,
  rare: 60,
  gengar: 20,
  thief: 30,
  caught: 20,
  open: "day",
  rain: "day",
  launch: "day",
  vip: "day",
  tour: "day",
  late: "day",
  bigsale: 90,
  queue: 120,
  buycard: 120,
  goodbuy: 60,
  lot: 60,
  gem: 10,
  lowgrade: 30,
  loss: "day",
  clean: 180,
  table: 240,
};
export const QUIP_GAP = 12; // segundos reales mínimos entre dos frases cualesquiera

export const PAPA = {
  tips: [
    "Consejo del maestro: compra cartas a menos del 75 % de su valor. Y haz sentadillas.",
    "Si la tienda de enfrente baja precios, no te asustes. Un rockero nunca se rinde. ♪",
    "Cuidaos del lado oscuro… de los sobres sin precio.",
    "Un buen tendero saluda a todos los clientes. Hasta a los que solo miran.",
    "Las cartas buenas, en la vitrina. Como mis trofeos del gimnasio.",
    "Mirad bien las cartas antes de comprarlas. El lado oscuro se disfraza muy bien.",
    "Si un cliente regatea, sonreíd. Pero no bajéis más de la cuenta.",
    "Gradead solo las cartas que lo valen. No todo lo que brilla es un diez.",
    "Una tienda limpia vende más. Y huele mejor que mi bolsa del gimnasio.",
    "Cuando haya mucha cola, contratad ayuda. Ni yo levanto todo el peso solo.",
    "Escuchad a Emma, que sabe sumar. Y tú, Emma, sal del sofá de vez en cuando.",
    "La paciencia es el músculo más difícil de entrenar, jóvenes padawans.",
  ],
  byes: [
    "Me voy, que llego tarde a pecho y bíceps.",
    "¡Me voy, que hoy toca espalda! ♪",
    "¡Que la fuerza os acompañe! Y las proteínas.",
    "Me voy al gimnasio, que mis mancuernas me echan de menos.",
    "Me voy a correr… bueno, a andar rápido.",
  ],
  levels: [
    "¡Mis padawans ya son maestros! Me voy a celebrarlo… haciendo burpees.",
    "¡Nivel nuevo! Esto se merece una serie extra de flexiones.",
    "¡Qué orgullo de hijos! Hoy levanto el doble en el gimnasio.",
  ],
  rival: "Si la tienda de enfrente baja precios, no te asustes. Un rockero nunca se rinde. ♪",
};
PAPA.bye = PAPA.byes[0];
PAPA.level = PAPA.levels[0];
export const PAPA_EVERY = 3; // días de juego entre visitas normales (como mucho)

/**
 * Elige una frase de la lista: la primera vez, la primera; después, otra al azar distinta de la última.
 * Lo elegido se guarda en la partida (S.quipV) para no repetir al recargar.
 */
export function vary(list, key, R = Math.random) {
  const V = S.quipV || (S.quipV = {}),
    last = V[key];
  let i = 0;
  if (last != null && list.length > 1) {
    i = Math.floor(R() * (list.length - 1));
    if (i >= last) i++;
  }
  V[key] = i;
  return list[i];
}

const mem = { last: -Infinity, at: {} }; // tiempos reales (no se guardan)

/**
 * ¿Puede decirse ahora esta frase? Si sí, la apunta como dicha y la devuelve. now: segundos reales.
 * Las de «una vez al día» o «cada N días» se guardan en la partida (S.quip) para no repetirlas al recargar.
 * Devuelve una de las frases de esa situación: [quién, expresión, texto].
 */
export function takeQuip(k, now, R = Math.random) {
  if (!hasState() || !QUIPS[k]) return null;
  const ev = EVERY[k],
    q = S.quip || (S.quip = {});
  if (now - mem.last < QUIP_GAP) return null;
  if (ev === "day" && q[k] === S.day) return null;
  if (k === "rival" && q[k] != null && S.day - q[k] < ev) return null;
  if (typeof ev === "number" && k !== "rival" && mem.at[k] != null && now - mem.at[k] < ev) return null;
  mem.last = now;
  mem.at[k] = now;
  if (ev === "day" || k === "rival") q[k] = S.day;
  return vary(QUIPS[k], k, R);
}
export const resetQuips = () => ((mem.last = -Infinity), (mem.at = {}));

/** ¿Hay una carta que merezca reacción de Álvaro? Gengar antes que una rara. */
export function pullQuip(cards) {
  if (cards.some((c) => /gengar/i.test(c.name))) return "gengar";
  if (cards.some((c) => ["UR", "SIR", "HR"].includes(c.r))) return "rare";
  return null;
}

/** Estado de las visitas de papá (se guarda en la partida). lv: nivel conocido, para notar la subida. */
export function papaState(lv) {
  if (!S.papa) S.papa = { last: S.day, lv, rival: 0 };
  if (S.papa.lv == null) S.papa.lv = lv;
  return S.papa;
}

/**
 * ¿Toca visita de papá? Devuelve el motivo ("level", "rival", "tip") o null.
 * - Al subir de nivel o cuando abre la tienda rival, en cuanto se pueda.
 * - Si no, como mucho una vez cada 3 días, y solo con la tienda abierta (al azar dentro del día).
 * Se comprueba una vez por segundo de juego; rnd: número al azar 0-1 (se pasa para poder probarlo).
 */
export function papaDue(lv, rnd) {
  if (!hasState()) return null;
  const P = papaState(lv);
  if (lv > P.lv) return "level";
  const sm = S.summary;
  if (sm && sm.rivNew && P.rival !== sm.day) return "rival";
  if (S.phase === "open" && S.day - P.last >= PAPA_EVERY && rnd < 0.03) return "tip"; // ~30 s de juego tras abrir
  return null;
}

/** Apunta la visita y devuelve las frases de papá: [consejo, despedida]. */
export function papaVisit(reason, lv) {
  const P = papaState(lv);
  P.last = S.day;
  P.lv = Math.max(P.lv, lv);
  if (reason === "rival" && S.summary) P.rival = S.summary.day;
  if (reason === "level") return [vary(PAPA.levels, "papaLevel")];
  if (reason === "rival") return [PAPA.rival, vary(PAPA.byes, "papaBye")];
  P.n = ((P.n || 0) + 1) % PAPA.tips.length;
  return [PAPA.tips[P.n], vary(PAPA.byes, "papaBye")];
}
