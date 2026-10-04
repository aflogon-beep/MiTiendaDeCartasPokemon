// Frases recurrentes de Emma y Álvaro, y visitas de papá (docs/intro/HISTORIA.md → «Frases para el
// resto del juego»). Aquí solo la lógica: qué frase toca y cuándo; el bocadillo lo pinta ui/quips.js.
import { S, hasState } from "./state.js";

// Cada situación tiene varias frases: [quién, expresión, texto]. La primera vez sale la primera (la del guion);
// después, otra al azar, sin repetir la última. Expresiones: happy, laugh, wow, angry, sweat, stars.
const E = (ex, t) => ["emma", ex, t],
  A = (ex, t) => ["alvaro", ex, t],
  P = (ex, t) => ["alberto", ex, t], // papá (zona Funko)
  R = (ex, t) => ["ramon", ex, t]; // Don Ramón, el librero (zona Funko)
export const QUIPS = {
  // Al abrir muchos sobres el mismo día
  packs: [
    E("angry", "¡ÁLVARO! ¡Eso era para VENDER!"),
    E("angry", "Cada sobre que abres es un pintalabios que no me compro."),
    E("sweat", "Álvaro. Deja. Los. Sobres."),
    E("angry", "Te los voy a descontar de la paga. Todos."),
    A("sweat", "Solo uno más… para investigar el mercado."),
    A("stars", "¡Es que huelen a carta nueva!"),
    E("angry", "¿Eso que oigo es otro sobre abriéndose? Te estoy oyendo."),
    E("sweat", "Álvaro, los sobres no son palomitas."),
    A("stars", "¡Es por la ciencia, Emma! ¡Investigación Pokémon!"),
    E("angry", "Apunto: un sobre más y te toca barrer una semana."),
  ],
  // Récord de ventas (y al menos 150 €)
  bigday: [
    E("stars", "Esto ya huele a Sephora…"),
    E("stars", "Si seguimos así, me compro el sofá con masaje."),
    E("laugh", "¡Récord! Que no se entere papá, que pide comisión."),
    A("stars", "¡Somos los maestros Jedi de las cartas!"),
    E("stars", "Calculadora echando humo. Del bueno."),
    A("laugh", "¡Hoy hasta la mascota está contenta!"),
    E("happy", "Hoy me merezco el sofá. Y una mascarilla facial."),
  ],
  // Tienda vacía un rato con la persiana subida
  empty: [
    E("sweat", "Si no hay clientes, yo vuelvo al sofá."),
    E("happy", "Qué silencio… perfecto para ver un capítulo."),
    E("sweat", "Pon algo bonito en la vitrina, a ver si entra alguien."),
    A("sweat", "¿Hola? ¿Hay alguien? ¿Algún Pokémon salvaje?"),
    E("happy", "¿Y si ponemos cartas más llamativas en la vitrina?"),
    E("sweat", "Tanto silencio me da sueño… y me encanta."),
    A("happy", "Tranquilos, Pokémon. Seguro que ahora viene alguien."),
    E("happy", "Aprovecho para repasar los precios. Bueno… o el móvil."),
  ],
  // Al pillar una carta falsa
  fake: [
    E("laugh", "Ja. Ni que fuera tonta."),
    E("laugh", "Esa carta es más falsa que las excusas de Álvaro."),
    E("angry", "Aquí solo vendemos cartas de verdad, gracias."),
    A("angry", "¡Una falsa! El lado oscuro no pasará por esta tienda."),
    E("laugh", "Esa carta tiene el color raro. Y yo, buen ojo."),
    A("wow", "¿Falsa? ¡Qué peligro! Menos mal que Emma lo ve todo."),
    E("angry", "Falsa. Ni en la tienda de enfrente la querrían."),
  ],
  // Al subir la persiana con la tienda rival más barata
  rival: [
    E("angry", "¿Más baratos que nosotros? Eso lo arreglo yo con la calculadora."),
    E("angry", "Que bajen lo que quieran. Yo tengo calculadora y no tengo miedo."),
    A("angry", "¡Cartas El Rayo! Les vamos a ganar con mejores cartas y mejor sonrisa."),
    E("sweat", "Si la rival baja precios, nosotros subimos simpatía."),
    A("angry", "¡Que se preparen! La tienda más molona de la calle es esta."),
    E("happy", "Tranquilo, Álvaro. Con buenos precios, los clientes vuelven."),
  ],
  // Carta muy rara al abrir sobres
  rare: [
    A("stars", "¡LA FUERZA ES INTENSA EN ESTE SOBRE!"),
    A("stars", "¡Que alguien me pellizque! ¡Mira qué carta!"),
    A("stars", "¡Brilla más que un sable de luz!"),
    A("wow", "¡AAAAH! ¡Emma, ven a ver esto!"),
    E("stars", "Vale… esta sí ha merecido la pena. Pero solo esta."),
    A("stars", "¡Esta carta es de otra galaxia!"),
    A("wow", "¡Me tiemblan las manos! ¡Que no se doble!"),
    E("stars", "¿Cuánto vale eso? No, espera, ya lo miro yo."),
    A("stars", "¡Papá, si me ves, esto es para ti!"),
  ],
  // Un Gengar
  gengar: [
    A("stars", "¡GENGAAAAR! ¡Este no se vende! ❤️"),
    A("stars", "¡Mi Gengar! ¡A la colección, YA!"),
    A("laugh", "¡El lado oscuro nunca fue tan bonito! ❤️"),
    E("sweat", "Otro Gengar… ya sé dónde va a acabar este."),
    A("stars", "¡Hola, amigo fantasma! Bienvenido a casa."),
    A("laugh", "¡Gengar me sonríe! ¡Hoy es mi día de suerte!"),
    E("sweat", "Ya está otra vez con su Gengar…"),
  ],
  // Un ladrón
  thief: [
    A("wow", "¡Al ladrón! ¡Que alguien active el escudo deflector!"),
    A("angry", "¡Eh! ¡Eso es de la tienda!"),
    E("wow", "¡Álvaro, que se escapa! ¡Tócalo!"),
    A("angry", "¡Ladrón a la vista! ¡Escudos arriba!"),
    E("angry", "¡Oye! ¡Que eso se paga!"),
    A("wow", "¡Se lleva una carta! ¡Rápido, tócalo!"),
  ],
  // Ladrón pillado
  caught: [
    A("laugh", "¡Pillado! El escudo deflector funciona."),
    E("laugh", "¿Creías que no te veía? Tengo gafas, no estoy ciega."),
    A("stars", "¡Álvaro, guardián de la tienda!"),
    A("stars", "¡Justicia Pokémon!"),
    E("happy", "Devuelto a su sitio. Aquí no se roba."),
    A("laugh", "¡Ja! Nadie escapa de esta tienda."),
  ],
  // Al subir la persiana (según el día)
  open: [
    A("happy", "¡Persiana arriba! ¡Que empiece la aventura!"),
    E("happy", "Sonrisa, cambio exacto y nada de abrir sobres. ¿Entendido?"),
    A("stars", "¡Hoy va a ser un gran día! Lo noto en la Poké Ball."),
    E("sweat", "Abro la caja… y el sofá ya me está llamando."),
    A("happy", "¡Que la suerte de los sobres nos acompañe!"),
    E("happy", "Caja lista, precios listos. Álvaro… ¿listo?"),
    A("stars", "¡Hoy seguro que sale un Gengar!"),
    E("sweat", "Otro día sin sofá hasta la noche. Ánimo, Emma."),
    A("happy", "¡Bienvenidos, entrenadores! ¡Pasen y vean!"),
  ],
  rain: [
    E("sweat", "Llueve… la gente se queda en casa viendo series. Como yo quiero."),
    A("sweat", "Con lluvia vendrá poca gente. ¡Pero los valientes compran!"),
    A("happy", "Los que vengan hoy se merecen un aplauso."),
    E("happy", "Día tranquilo. Ideal para ordenar la vitrina."),
  ],
  launch: [
    A("stars", "¡Hoy sale colección nueva! ¡Prepárate para la avalancha!"),
    E("happy", "Día de lanzamiento: muchos sobres en las estanterías, por favor."),
    A("stars", "¡Sobres nuevos! ¡Huelen a aventura!"),
    E("sweat", "Hoy viene muchísima gente. Respira, Emma."),
    E("happy", "Lanzamiento: hoy los sobres de la colección nueva vuelan."),
  ],
  vip: [
    E("stars", "Hoy viene alguien con mucho dinero. Álvaro, péinate."),
    A("wow", "¿Un cliente VIP? ¡Que la vitrina brille!"),
    E("happy", "Vitrina reluciente y sonrisa de anuncio. Vamos."),
    A("sweat", "Un VIP… ¿le hago una reverencia?"),
  ],
  tour: [
    A("stars", "¡Día de torneo! Que gane el mejor… o el que tenga más suerte."),
    E("happy", "Torneo hoy: más coleccionistas. Llena bien la vitrina."),
    A("happy", "¡Que barajen bien! Hoy hay campeones en la tienda."),
    E("happy", "Torneo: inscripciones, fundas y sobres. Me gusta."),
  ],
  // Casi la hora de cerrar
  late: [
    E("sweat", "Ya casi cerramos… el sofá me espera."),
    A("happy", "¡Últimos clientes del día! ¡Que no se escape nadie!"),
    E("happy", "Último empujón y a contar la caja."),
    A("sweat", "Qué día… mis piernas piden una siesta."),
    E("happy", "Un poco más y cerramos. Hoy cenamos pizza."),
    A("happy", "¡El último cliente se lleva una sonrisa gratis!"),
  ],
  // Una venta grande (50 € o más)
  bigsale: [
    E("stars", "¡Ese cliente es mi nuevo favorito!"),
    E("laugh", "Ding, ding, ding… ¡eso suena a dinero!"),
    A("stars", "¡Venta de las gordas! ¡Choca esos cinco!"),
    E("happy", "Trátalo bien, que vuelva mañana."),
    A("stars", "¡Qué cliente más generoso!"),
    E("laugh", "Esto ya cuenta como un pintalabios. O dos."),
    A("laugh", "¡Kaching! Ese sonido me encanta."),
  ],
  // Alguien se va harto de esperar en la cola
  queue: [
    E("sweat", "¡Se van por la cola! Álvaro, más rápido."),
    E("sweat", "Esa gente lleva esperando más que yo en el médico."),
    A("sweat", "¡Voy, voy! ¡Cobro a la velocidad de la luz!"),
    E("sweat", "La cola llega casi a la puerta…"),
    A("sweat", "¡Perdón, perdón! ¡El siguiente!"),
    E("angry", "Si los haces esperar, se van. Y el dinero también."),
  ],
  // Comprar una carta a un cliente
  buycard: [
    A("happy", "¡Carta nueva para la tienda!"),
    A("stars", "¡Nueva carta para la colección! Digo… para vender."),
    E("happy", "Apuntado en la calculadora. Ahora a venderla más cara."),
    A("happy", "Bienvenida, carta. Te buscaremos un buen dueño."),
    E("happy", "Comprada. Ahora, a la vitrina o a la carpeta."),
    A("stars", "¡Me encanta cuando la gente nos trae cartas!"),
  ],
  // … a menos del 75 % de su valor (el consejo de papá)
  goodbuy: [
    E("stars", "¡Buen trato! Papá estaría orgulloso. Y sudando."),
    A("laugh", "Comprar barato, vender con cariño. ¡Regla número uno!"),
    E("laugh", "Esto es lo que yo llamo negociar."),
    A("stars", "¡Ganga detectada!"),
    E("happy", "Comprada barata. Esto es saber de números."),
    A("laugh", "¡Regla número uno del maestro, cumplida!"),
  ],
  // Comprar un lote
  lot: [
    A("wow", "¡Una caja misteriosa! ¿Qué habrá dentro?"),
    E("sweat", "Espero que dentro haya algo más que polvo."),
    A("stars", "¡Lotes! Mi parte favorita después de los sobres."),
    A("stars", "¡Cartas a montones! ¡Esto es como Navidad!"),
    E("sweat", "Ahora toca mirarlas una a una… qué pereza."),
    A("happy", "Quién sabe… a lo mejor dentro hay un Gengar."),
  ],
  // Resultado del gradeo
  gem: [
    A("stars", "¡UN DIEZ! ¡Perfecta, como un droide recién salido de fábrica!"),
    E("stars", "Un diez. Esta carta vale ahora un dineral."),
    A("laugh", "¡Diez! ¡Que alguien me dé una medalla!"),
    E("stars", "Un diez. Esa nota la quiero yo en mis exámenes."),
    A("wow", "¡Perfecta! ¡Ni una arruguita!"),
    A("stars", "¡Que suenen las trompetas! ¡Un diez!"),
  ],
  lowgrade: [
    E("sweat", "Bueno… para la carpeta de recuerdos."),
    A("sweat", "Le falta un poco de entrenamiento a esta carta."),
    E("sweat", "Quizá la próxima vez la guardemos en funda antes."),
    E("sweat", "Esa nota… mejor no se la contamos a papá."),
    A("sweat", "Bueno, sigue siendo bonita. Para mí es un diez."),
    E("happy", "No pasa nada. Para la próxima, más cuidado."),
  ],
  // Día con pérdidas
  loss: [
    E("sweat", "Hoy hemos perdido dinero. Mañana, menos gastos y más ventas."),
    E("angry", "Números rojos… como mi cara cuando abres sobres."),
    A("sweat", "Un mal día lo tiene cualquiera. ¡Mañana remontamos!"),
    E("sweat", "Hoy la calculadora está triste."),
    A("happy", "Los Jedi también tienen días malos."),
    E("angry", "Menos gastar y más vender, ¿vale?"),
  ],
  // Recoger algo del suelo
  clean: [
    E("happy", "Así me gusta, todo limpito."),
    A("happy", "¡Suelo despejado, capitana!"),
    E("laugh", "Si papá viera esto, diría que es como su gimnasio. Pero limpio."),
    A("happy", "¡Misión limpieza completada!"),
    E("happy", "Una tienda limpia vende más. Lo dijo papá y tenía razón."),
    E("sweat", "¿Quién deja papeles en el suelo? Qué gente."),
  ],
  // Jugadores en la mesa de juego
  table: [
    A("stars", "¡Gente jugando en la mesa! ¡Eso es espíritu Pokémon!"),
    E("happy", "Que jueguen, que jueguen. Cada partida, a la caja."),
    A("happy", "¡Algún día los reto a todos!"),
    A("happy", "¡Qué buena partida! Mira cómo se lo pasan."),
    E("happy", "Mesa llena, caja contenta."),
    A("stars", "¡Un día organizo un torneo gigante!"),
  ],
  // Zona Funko (docs/funkos): llega una Chase
  fkchase: [
    A("stars", "¡¡UNA CHASE!! ¡A la vitrina, rápido!"),
    A("stars", "¡Está aterciopelada! ¡Es preciosa!"),
    E("stars", "Una Chase vale como cinco normales. Yo no la vendería aún."),
    P("laugh", "Esa Chase es más rara que yo saltándome el gimnasio."),
    A("wow", "¡Mira qué brillo! ¿Me la puedo quedar? ¿Porfa?"),
  ],
  // Se vende un Funko
  fksale: [
    A("happy", "¡Otro cabezón que se va a una casa feliz!"),
    E("happy", "Funko vendido. La calculadora sonríe."),
    A("stars", "¡Ese era de mi colección favorita!"),
    P("laugh", "Que la Fuerza acompañe a ese Funko en su nuevo hogar."),
    E("sweat", "Si se agotan, avisadme… desde el sofá."),
  ],
  // Sale una ola nueva (y la vieja pasa a descatalogada)
  fkwave: [
    E("happy", "Ola nueva. Los descatalogados suben solos: yo los guardaría."),
    E("stars", "Comprar barato, esperar, vender caro. Facilísimo."),
    P("happy", "En mis tiempos guardábamos las cajas como si fueran oro."),
    A("stars", "¡Figuras nuevas! ¡Quiero todas!"),
  ],
  // Visita de Don Ramón, el librero
  fkramon: [
    R("happy", "¡Hola, chavales! Vengo a ver cómo va mi antigua librería."),
    R("laugh", "¡Donde estaban mis novelas ahora hay un Halcón Milenario!"),
    R("happy", "¿Tenéis algún Funko de Gandalf? Ese sí que leía."),
    R("wow", "¡Qué cabezones tan simpáticos! A mi nieto le encantarían."),
    R("laugh", "Cuarenta años vendiendo libros… y lo que se lleva son muñecos."),
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
  fkchase: 30,
  fksale: 150,
  fkwave: "day",
  fkramon: "day",
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
    "Un cliente contento vuelve. Y trae a sus amigos.",
    "No gastéis todo el dinero el primer día. Guardad para el alquiler.",
    "Los días de lanzamiento, estanterías llenas. Como el día de pierna: no se salta.",
    "Mirad los precios de la tienda de enfrente, pero no los copiéis a ciegas.",
    "Una carta bien expuesta se vende sola. Como mis bíceps.",
    "Si llueve, viene poca gente. Aprovechad para ordenar.",
    "Cuidad a los clientes de siempre. Valen más que una carta rara.",
    "Contad bien el cambio. Un euro mal dado es un euro perdido.",
    "Las fundas protegen las cartas. Y el casco, la cabeza.",
    "Antes de abrir un sobre, pensad: ¿lo vendería mejor cerrado?",
    "Las ofertas atraen gente, pero no regaléis la tienda.",
    "El mejor tendero escucha más de lo que habla. Yo estoy en ello.",
    "Descansad bien. Un tendero cansado se equivoca con el cambio.",
  ],
  byes: [
    "Me voy, que llego tarde a pecho y bíceps.",
    "¡Me voy, que hoy toca espalda! ♪",
    "¡Que la fuerza os acompañe! Y las proteínas.",
    "Me voy al gimnasio, que mis mancuernas me echan de menos.",
    "Me voy a correr… bueno, a andar rápido.",
    "Me voy, que mi entrenador personal no espera.",
    "¡Hasta luego, padawans! Hoy toca abdominales. ♪",
    "Me voy, que tengo clase de spinning.",
    "Me voy. Si me necesitáis, estoy entre mancuernas.",
    "Me voy a estirar, que a mi edad hay que estirar mucho.",
    "¡Adiós, chicos! Portaos bien y vended mucho.",
    "Me voy, que hoy hay batido de proteínas gratis.",
  ],
  levels: [
    "¡Mis padawans ya son maestros! Me voy a celebrarlo… haciendo burpees.",
    "¡Nivel nuevo! Esto se merece una serie extra de flexiones.",
    "¡Qué orgullo de hijos! Hoy levanto el doble en el gimnasio.",
    "¡Subís de nivel más rápido que yo en el press de banca!",
    "¡Nivel nuevo! Esto lo celebro con un batido doble.",
    "Mis padawans crecen… se me cae una lagrimita.",
    "¡Así se hace! Un rockero también estaría orgulloso. ♪",
    "¡Otro nivel! Pronto me pediréis vosotros los consejos.",
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
