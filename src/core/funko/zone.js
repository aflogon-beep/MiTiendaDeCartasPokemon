// Zona Funko (docs/funkos/DISENO.md): mercado, olas y descatalogados, nivel de la zona, pedidos, almacén,
// estanterías y vitrina, encargado, eventos con exclusivas, mobiliario, álbum y encargos, y el cierre del día.
// Todo vive en S.fk (se crea al comprar el local; ver core/funko.js). Sin DOM: avisa por el bus.
//   S.fk.u    unidades: { i, f, v, d, p, at, t }  v variante · d caja dañada · p protector · at a|s|v|m|h
//             (almacén, estantería, vitrina, Mis Funkos, en la mano de un cliente) · t día en que llegó
//   S.fk.mk   mercado por figura: { p, b, t, h[] } (como las cartas: core/cards/prices.js)
//   S.fk.wv   olas publicadas por colección · S.fk.wd día de la siguiente · S.fk.vd día en que se descatalogó
//   S.fk.pp   precio de venta por figura (los Chase y especiales, por su multiplicador)
//   S.fk.del  pedidos en camino · S.fk.xp ⭐ de la zona · S.fk.lv nivel (nunca baja) · S.fk.mob muebles
//   S.fk.stf  encargado contratado · S.fk.bud tope de pedidos del encargado · S.fk.ev evento · S.fk.ord encargos
//   S.fk.alb  álbum (ids vistos en Mis Funkos) · S.fk.albR premios cobrados · S.fk.st cuentas del día
import { S } from "../state.js";
import { ui } from "../bus.js";
import { r05 } from "../util.js";
import { gauss, rnd } from "../rng.js";
import { compactPrice } from "../cards/prices.js";
import { FBYID, FIGS, DLX, GRAILS, GOLD, FKCOL, FKCOLS } from "./catalog.js";

/* ---------- Constantes ---------- */
export const FK_RENT = 40; // alquiler del local (€/día)
export const FK_STAFF_SAL = 45; // sueldo del encargado (el cajero cobra 20)
export const FK_XP = [0, 250, 700, 1400, 2400, 3800, 5600, 8000, 11000, 15000]; // ⭐ para los niveles 1–10
export const FK_SHELF = 44; // huecos de las estanterías (fondo 32 + isla 12)
export const FK_VIT = 8; // huecos de la vitrina (las vitrinas de cristal de la pared)
export const FK_CASE = 6; // figuras por caja
export const FK_GOLD_COST = 12000;
/** Multiplicador de valor de cada variante. */
export const FK_VMUL = { "": 1, chase: 5, flock: 2.4, glow: 2.2, metal: 2, diamond: 3, exc: 1.2, gold: 1 };
export const FK_VNAME = {
  chase: "Chase",
  flock: "Flocked",
  glow: "Brilla en la oscuridad",
  metal: "Metálica",
  diamond: "Diamond",
  exc: "Exclusiva",
  gold: "Oro 24 K",
};
/** Qué desbloquea cada nivel de la zona (texto de la pantalla de nivel y del aviso). */
export const FK_LVTXT = [
  "Pokémon, Videojuegos y Disney",
  "Marvel, Star Wars y Stranger Things",
  "Harry Potter, DC y Anime · brillan en la oscuridad",
  "Series y películas y Terror · metálicas y flocked",
  "Eventos con exclusivas (uno cada semana)",
  "Deluxe: escenas y figuras grandes",
  "Chase más a menudo (1 de cada 4 cajas)",
  "Diamond Collection",
  "Grails legendarios (480 unidades)",
  "El Funko de oro de 24 quilates",
];
/** Mobiliario friki (Mejoras → Zona Funko). */
export const FK_MOB = [
  { k: "leds", ic: "🔭", n: "Vitrinas de cristal con LED", d: "+8 huecos en la vitrina", cost: 1100, lv: 1 },
  {
    k: "vader",
    ic: "🗿",
    n: "Darth Vader a tamaño real",
    d: "Los fans de Star Wars compran un 15 % más",
    cost: 1200,
    lv: 1,
  },
  { k: "falcon", ic: "🛸", n: "Halcón Milenario colgado del techo", d: "+8 % clientes de Funkos", cost: 900, lv: 1 },
  { k: "rug", ic: "🌑", n: "Alfombra de la Estrella de la Muerte", d: "+6 % clientes de Funkos", cost: 400, lv: 1 },
  {
    k: "claw",
    ic: "🕹️",
    n: "Máquina de gancho con Funkos",
    d: "Los niños juegan: 1 € la partida (a veces se llevan un Funko)",
    cost: 700,
    lv: 1,
  },
  { k: "arcade", ic: "👾", n: "Máquina recreativa", d: "+20 % de paciencia en la cola", cost: 650, lv: 1 },
  { k: "pika", ic: "⚡", n: "Pikachu gigante de 1 metro", d: "+10 % niños", cost: 800, lv: 2 },
  {
    k: "hogw",
    ic: "🏰",
    n: "Estandartes de Hogwarts",
    d: "Los fans de Harry Potter compran un 15 % más",
    cost: 500,
    lv: 3,
  },
  {
    k: "iron",
    ic: "🦾",
    n: "Armadura de Iron Man en su cápsula",
    d: "Los fans de Marvel aceptan precios un 6 % más altos",
    cost: 1500,
    lv: 4,
  },
  {
    k: "grails",
    ic: "💎",
    n: "Cámara de los grails",
    d: "Lo que está en la vitrina vale un 10 % más",
    cost: 2500,
    lv: 5,
  },
];
export const FK_EVENTS = [
  "Salón del Cómic",
  "Salón del Manga",
  "Día de Star Wars",
  "Noche de Terror",
  "Festival Pokémon",
  "Noche de Stranger Things",
  "Feria del Videojuego",
];

/* ---------- Estado ---------- */
/** Completa S.fk con lo que falte (partidas de la F1 o recién compradas). */
export function fkEnsure() {
  const F = S.fk;
  if (!F) return null;
  F.u = F.u || [];
  F.nid = F.nid || 1;
  F.mk = F.mk || {};
  F.wv = F.wv || {};
  F.wd = F.wd || {};
  F.vd = F.vd || {};
  F.pp = F.pp || {};
  F.del = F.del || [];
  F.xp = F.xp || 0;
  F.lv = F.lv || 1;
  F.mob = F.mob || {};
  F.bud = F.bud == null ? 150 : F.bud;
  F.ord = F.ord || [];
  F.alb = F.alb || {};
  F.albR = F.albR || {};
  F.st = F.st || fkDayStats();
  F.grB = F.grB || {};
  if (F.evd == null) F.evd = S.day + 7;
  FKCOLS.forEach((c) => {
    if (fkColOn(c) && !F.wv[c]) {
      F.wv[c] = 2; // al desbloquear una colección, salen sus dos primeras olas
      F.wd[c] = S.day + 7 + rnd(4);
    }
  });
  return F;
}
export const fkDayStats = () => ({ inc: 0, n: 0, chase: [], claw: 0, clawN: 0, xp: 0, sold: [] });

/* ---------- Nivel de la zona ---------- */
/** Nivel de la zona (1–10). Como el de la tienda, nunca baja. */
export function fkLv() {
  const F = S.fk;
  if (!F) return 0;
  let l = 1;
  FK_XP.forEach((x, i) => {
    if ((F.xp || 0) >= x) l = i + 1;
  });
  if (l > (F.lv || 1)) F.lv = l;
  return F.lv || 1;
}
/** Suma ⭐ de Funko; si sube de nivel, avisa (con lo que desbloquea). */
export function fkAddXp(n) {
  const F = S.fk;
  if (!F || !(n > 0)) return;
  const l0 = fkLv();
  F.xp = Math.round((F.xp || 0) + n);
  F.st.xp = (F.st.xp || 0) + Math.round(n);
  const l1 = fkLv();
  if (l1 > l0) {
    fkEnsure();
    ui.toast(`🔓 ¡Zona Funko nivel ${l1}! ${FK_LVTXT[l1 - 1]}`);
    ui.sfx("ach");
  }
}
export const fkColOn = (c) => !!S.fk && FKCOL[c].lv <= fkLv();
/** ¿Está desbloqueada esta variante? */
export function fkVarOn(v) {
  const l = fkLv();
  if (v === "glow") return l >= 3;
  if (v === "metal" || v === "flock") return l >= 4;
  if (v === "diamond") return l >= 8;
  return true;
}

/* ---------- Mercado, olas y descatalogados ---------- */
const VOLF = 0.5;
function initMk(f) {
  const p = { p: f.b * (0.94 + Math.random() * 0.12), t: 0, b: f.b, h: [] };
  for (let i = 0; i < 30; i++) stepMk(p);
  return p;
}
function stepMk(p) {
  p.t = +(p.t * 0.85 + (Math.random() - 0.5) * 0.012 * VOLF).toPrecision(4);
  p.p = +Math.max(1, p.p * Math.exp(p.t + gauss() * 0.03 * VOLF) + (p.b - p.p) * 0.05).toPrecision(6);
  p.h.push(p.p);
  while (p.h.length > 31) p.h.shift();
}
export function fkMk(fid) {
  const F = S.fk,
    f = FBYID[fid];
  if (!F || !f) return null;
  if (!F.mk[fid]) F.mk[fid] = initMk(f);
  return F.mk[fid];
}
/** Olas publicadas de una colección. */
export const fkWaves = (c) => (S.fk && S.fk.wv[c]) || 0;
/** ¿Ya ha salido? (las Deluxe, grails y el oro van por nivel) */
export function fkOut(f) {
  if (f.dlx) return fkLv() >= 6;
  if (f.grail) return fkLv() >= 9;
  if (f.gold) return fkLv() >= 10;
  return fkColOn(f.c) && f.w <= fkWaves(f.c);
}
/** Descatalogada: su ola tiene dos más nuevas detrás (ya no se puede pedir; su precio sube). */
export const fkVault = (f) => !!f && f.w > 0 && f.w <= fkWaves(f.c) - 2;
/** Precio de mercado de la figura normal (las descatalogadas suben hasta ×3). */
export function fkBase(fid) {
  const m = fkMk(fid),
    f = FBYID[fid];
  if (!m) return 0;
  let k = 1;
  if (fkVault(f)) {
    const vd = S.fk.vd[fid] != null ? S.fk.vd[fid] : S.day;
    k = 1 + Math.min(2, (S.day - vd) * 0.06);
  }
  return m.p * k;
}
/** Multiplicador de una variante (la exclusiva sube con los días: de ×1,2 a ×2,5). */
export function fkVm(v, t) {
  if (v === "exc") return 1.2 + Math.min(1.3, Math.max(0, S.day - (t || S.day)) * 0.2);
  return FK_VMUL[v] || 1;
}
/** Valor de mercado de una unidad (con su variante, caja dañada −40 % y la cámara de los grails en la vitrina). */
export function fkUVal(u) {
  const f = FBYID[u.f];
  if (!f) return 0;
  let v = fkBase(u.f) * fkVm(u.v, u.t);
  if (u.d) v *= 0.6;
  if (u.at === "v" && S.fk.mob.grails) v *= 1.1;
  return v;
}
/** Precio de venta que has puesto (o mercado + 5 %), con su variante y su estado. */
export function fkPrice(u) {
  const f = FBYID[u.f];
  if (!f) return 0;
  const pp = S.fk.pp[u.f] != null ? S.fk.pp[u.f] : r05(fkBase(u.f) * 1.05);
  return r05(pp * fkVm(u.v, u.t) * (u.d ? 0.6 : 1));
}
/** Precio de mayorista de lo que se pide. */
export function fkCost(f, v = "") {
  if (f.gold) return FK_GOLD_COST;
  if (f.grail) return r05(f.b * 0.9);
  if (f.dlx) return r05(f.b * 0.7);
  if (v) return r05(f.b * fkVm(v) * 0.6);
  return r05(f.b * (f.r ? 0.7 : 0.6));
}

/* ---------- Unidades ---------- */
export const fkUnits = (fid, at) => (S.fk ? S.fk.u.filter((u) => u.f === fid && (!at || u.at === at)) : []);
export const fkCount = (at) => (S.fk ? S.fk.u.filter((u) => u.at === at).length : 0);
export const fkShelfCap = () => FK_SHELF;
export const fkVitCap = () => FK_VIT + (S.fk && S.fk.mob.leds ? 8 : 0);
function addUnit(f, v, d) {
  const F = S.fk,
    u = { i: F.nid++, f, v: v || "", d: d ? 1 : 0, p: 0, at: "a", t: S.day };
  F.u.push(u);
  return u;
}
/** Mueve una unidad: a (almacén), s (estantería), v (vitrina), m (Mis Funkos). Devuelve false si no cabe. */
export function fkMove(uid, at) {
  const u = S.fk && S.fk.u.find((x) => x.i === uid);
  if (!u || u.at === "h") return false;
  if (at === "s" && u.at !== "s" && fkCount("s") >= fkShelfCap()) return false;
  if (at === "v" && u.at !== "v" && fkCount("v") >= fkVitCap()) return false;
  u.at = at;
  if (at === "m") fkAlbumAdd(u);
  return true;
}
/** Repone: lo normal del almacén a las estanterías y lo especial a la vitrina, mientras quepa. Devuelve cuántas. */
export function fkRestock() {
  if (!S.fk) return 0;
  let n = 0;
  for (const u of S.fk.u) {
    if (u.at !== "a") continue;
    const f = FBYID[u.f],
      special = u.v || (f && (f.dlx || f.grail || f.gold));
    if (special) {
      if (fkCount("v") < fkVitCap()) ((u.at = "v"), n++);
    } else if (fkCount("s") < fkShelfCap()) ((u.at = "s"), n++);
  }
  return n;
}
/** Vende una unidad al mayorista (85 % del valor). */
export function fkSellWholesale(uid) {
  const F = S.fk,
    k = F ? F.u.findIndex((x) => x.i === uid) : -1;
  if (k < 0 || F.u[k].at === "h") return 0;
  const got = r05(fkUVal(F.u[k]) * 0.85);
  F.u.splice(k, 1);
  S.money += got;
  return got;
}
/** Protector de caja: 2,50 €; la caja ya no se daña. */
export const FK_PROT = 2.5;
export function fkProtect(uid) {
  const u = S.fk && S.fk.u.find((x) => x.i === uid);
  if (!u || u.p || S.money < FK_PROT) return false;
  S.money -= FK_PROT;
  u.p = 1;
  return true;
}

/* ---------- Pedidos ---------- */
/** ¿Se puede pedir? Devuelve el motivo si no. */
export function fkCanOrder(f, v = "") {
  if (!S.fk || !f) return "—";
  if (!fkOut(f)) return "Aún no ha salido";
  if (!f.dlx && !f.grail && !f.gold && fkVault(f)) return "Descatalogado";
  if (v && !fkVarOn(v)) return "Bloqueada";
  if (f.grail && S.fk.grB[f.id]) return "Ya tienes el tuyo";
  if (f.gold && S.fk.grB.oro) return "Ya es tuyo";
  return "";
}
/** Pide: una caja de 6 (normales) o una suelta (raras, especiales, Deluxe, grails y oro). Llega mañana. */
export function fkOrder(fid, v = "") {
  const f = FBYID[fid];
  if (fkCanOrder(f, v)) return false;
  const box = !v && !f.r && !f.dlx && !f.grail && !f.gold,
    n = box ? FK_CASE : 1,
    cost = fkCost(f, v) * n;
  if (S.money < cost) return false;
  S.money -= cost;
  S.fk.del.push({ f: fid, v, n, box, day: S.day + 1 });
  if (f.grail || f.gold) S.fk.grB[f.id] = 1;
  return cost;
}
/** Llegan los pedidos: en cada caja, 1 de cada 6 trae una Chase (1 de cada 4 desde el nivel 7) y alguna llega con la caja dañada. */
export function fkArrive(R = Math.random) {
  const F = S.fk;
  if (!F) return [];
  const got = [];
  F.del = F.del.filter((o) => {
    if (o.day > S.day) return true;
    let chase = o.box && R() < (fkLv() >= 7 ? 0.25 : 1 / 6);
    for (let k = 0; k < o.n; k++) {
      const v = chase && k === 0 ? "chase" : o.v,
        u = addUnit(o.f, v, R() < 0.06);
      if (v === "chase") S.lt.fkchase = (S.lt.fkchase || 0) + 1;
      got.push(u);
    }
    chase = false;
    return false;
  });
  return got;
}

/* ---------- Venta (se usa desde los clientes: core/customers) ---------- */
/** Cobra unidades vendidas a un cliente (ya quitadas de la estantería). Devuelve lo cobrado. */
export function fkSold(units, total) {
  const F = S.fk;
  if (!F) return;
  units.forEach((u) => {
    const k = F.u.indexOf(u);
    if (k >= 0) F.u.splice(k, 1);
    if (u.v === "chase") F.st.chase.push(u.f);
    (F.st.sold = F.st.sold || []).push(u.f);
  });
  F.st.inc += total;
  F.st.n += units.length;
  S.lt.fksold = (S.lt.fksold || 0) + units.length;
  fkAddXp(total);
  if (F.stf) fkRestock(); // el encargado repone lo que se vende
  fkAch();
  ui.quip("fksale");
}

/* ---------- Álbum ---------- */
export function fkAlbumAdd(u) {
  if (!S.fk) return;
  const k = u.f + (u.v === "chase" ? "|c" : "");
  S.fk.alb[k] = 1;
}
/** Progreso del álbum de una colección: [tengo, total] (figuras normales). */
export function fkAlbumOf(c) {
  const all = FIGS.filter((f) => f.c === c);
  return [all.filter((f) => S.fk && S.fk.alb[f.id]).length, all.length];
}
export const FK_ALB_PRIZE = 150;
/** Cobra el premio de una colección completa (dinero y ⭐). */
export function fkAlbumClaim(c) {
  const [a, b] = fkAlbumOf(c);
  if (!S.fk || a < b || S.fk.albR[c]) return false;
  S.fk.albR[c] = 1;
  S.money += FK_ALB_PRIZE;
  fkAddXp(150);
  fkAch();
  return true;
}

/* ---------- Encargos ---------- */
const WHO = ["Hugo", "Lucía", "Iker", "Marta", "Pablo", "Sara", "Leo", "Carla", "Dani", "Noa"];
export function fkGenOrder(R = Math.random) {
  const F = S.fk;
  if (!F || F.ord.length >= 3) return null;
  const pool = FIGS.filter((f) => fkOut(f));
  if (!pool.length) return null;
  const f = pool[Math.floor(R() * pool.length)],
    chase = R() < 0.2,
    v = chase ? "chase" : "",
    o = {
      id: (F.nid++).toString(36),
      f: f.id,
      v,
      who: WHO[Math.floor(R() * WHO.length)],
      pay: r05(fkBase(f.id) * fkVm(v) * (1.35 + R() * 0.3)),
      due: S.day + 4 + Math.floor(R() * 3),
    };
  F.ord.push(o);
  return o;
}
/** Unidad que sirve para un encargo (de la mismo figura y variante, en almacén, estantería o vitrina). */
export const fkOrdUnit = (o) => S.fk.u.find((u) => u.f === o.f && (u.v || "") === o.v && "asv".includes(u.at));
export function fkDeliver(id) {
  const F = S.fk,
    o = F && F.ord.find((x) => x.id === id),
    u = o && fkOrdUnit(o);
  if (!u) return false;
  F.u.splice(F.u.indexOf(u), 1);
  F.ord.splice(F.ord.indexOf(o), 1);
  S.money += o.pay;
  F.st.inc += o.pay;
  fkAddXp(o.pay + 60);
  return o.pay;
}

/* ---------- Eventos con exclusivas (desde el nivel 5) ---------- */
export function fkEventToday() {
  const F = S.fk;
  return F && F.ev && F.ev.day === S.day ? F.ev : null;
}
function newEvent(R) {
  const F = S.fk,
    pool = FIGS.filter((f) => fkColOn(f.c) && !f.r);
  const list = [];
  for (let k = 0; k < 3 && pool.length; k++) {
    const f = pool.splice(Math.floor(R() * pool.length), 1)[0];
    list.push({ f: f.id, left: 1 + Math.floor(R() * 3), pr: r05(f.b * 2) });
  }
  F.ev = { day: S.day, name: FK_EVENTS[Math.floor(R() * FK_EVENTS.length)], list };
}
/** Compra una exclusiva del evento de hoy (llega al almacén al momento). */
export function fkEventBuy(fid) {
  const ev = fkEventToday(),
    e = ev && ev.list.find((x) => x.f === fid);
  if (!e || e.left < 1 || S.money < e.pr) return false;
  S.money -= e.pr;
  e.left--;
  addUnit(fid, "exc", false);
  S.lt.fkexc = (S.lt.fkexc || 0) + 1;
  fkAddXp(10);
  fkAch();
  return true;
}

/* ---------- Encargado ---------- */
/** Lo que hace el encargado: repone y, al cerrar, vuelve a pedir cajas de lo que se ha agotado (con su tope). */
function staffDay() {
  const F = S.fk;
  if (!F.stf) return 0;
  let spent = 0;
  const sold = new Set(F.st.sold || []);
  for (const fid of sold) {
    const f = FBYID[fid];
    if (!f || f.r || fkCanOrder(f)) continue;
    if (fkUnits(fid).filter((u) => !u.v).length >= 2) continue;
    const c = fkCost(f) * FK_CASE;
    if (spent + c > F.bud || S.money < c) continue;
    if (fkOrder(fid)) spent += c;
  }
  return spent;
}

/* ---------- Cierre del día ---------- */
/** Al cerrar el día (core/day.js, antes de pasar al siguiente): cuentas de la zona. Devuelve el resumen del ticket. */
export function fkEndDay(R = Math.random) {
  const F = fkEnsure();
  if (!F) return null;
  fkAch();
  const st = F.st,
    staffBuy = staffDay(),
    sal = F.stf ? FK_STAFF_SAL : 0;
  S.money -= FK_RENT + sal;
  const sum = {
    inc: st.inc,
    n: st.n,
    chase: st.chase.slice(),
    claw: st.claw,
    clawN: st.clawN,
    xp: st.xp,
    rent: FK_RENT,
    sal,
    staffBuy,
    lv: fkLv(),
    next: FK_XP[fkLv()] != null ? FK_XP[fkLv()] - F.xp : 0,
    news: [],
  };
  F.st = fkDayStats();
  // Mercado y descatalogados
  Object.keys(F.mk).forEach((id) => stepMk(F.mk[id]));
  FIGS.forEach((f) => {
    if (fkColOn(f.c) && f.w <= fkWaves(f.c)) fkMk(f.id);
    if (fkVault(f) && F.vd[f.id] == null) F.vd[f.id] = S.day;
  });
  // Olas: avisa la víspera; al día siguiente sale (hasta 4 olas por colección)
  FKCOLS.forEach((c) => {
    if (!fkColOn(c) || fkWaves(c) >= 4) return;
    if (F.wd[c] === S.day + 1) sum.news.push(`📢 Mañana sale la ola ${fkWaves(c) + 1} de ${FKCOL[c].n}`);
    if (F.wd[c] <= S.day + 1 && F.wd[c] !== S.day + 1) {
      F.wv[c]++;
      F.wd[c] = S.day + 7 + Math.floor(R() * 4);
      sum.news.push(`🆕 Ya está aquí la ola ${fkWaves(c)} de ${FKCOL[c].n}`);
      ui.quip("fkwave");
      FIGS.filter((f) => f.c === c && fkVault(f) && F.vd[f.id] == null).forEach((f) => (F.vd[f.id] = S.day));
    }
  });
  // Eventos (desde el nivel 5): uno cada semana
  if (fkLv() >= 5) {
    if (F.evd === S.day + 1) {
      newEvent(R);
      F.ev.day = S.day + 1;
      F.evd = S.day + 8;
      sum.news.push(`🎪 Mañana: ${F.ev.name}, con exclusivas`);
    }
  } else F.evd = Math.max(F.evd, S.day + 1);
  // Encargos que caducan y nuevos
  F.ord = F.ord.filter((o) => o.due > S.day);
  if (R() < 0.35 && fkGenOrder(R)) sum.news.push("📋 Nuevo encargo de Funko");
  Object.values(F.mk).forEach(compactPrice);
  return sum;
}
/** Al empezar el día nuevo (ya con S.day + 1): llegan los pedidos y repone el encargado. Devuelve las Chase que han llegado. */
export function fkNewDay(R = Math.random) {
  const F = fkEnsure();
  if (!F) return [];
  const got = fkArrive(R);
  if (F.stf) fkRestock();
  fkAch();
  if (got.some((u) => u.v === "chase")) ui.quip("fkchase");
  else if (R() < 0.2) ui.quip("fkramon"); // de vez en cuando, Don Ramón se pasa a ver su antigua librería
  return got.filter((u) => u.v === "chase");
}

/* ---------- Logros de la zona (aparte de las medallas de siempre: solo existen con la zona) ---------- */
export const FK_ACH = [
  { id: "fk1", n: "Primer Funko", d: "Vende tu primer Funko.", r: 30, ok: () => (S.lt.fksold || 0) >= 1 },
  { id: "fk100", n: "Cabezones por todas partes", d: "Vende 100 Funkos.", r: 300, ok: () => (S.lt.fksold || 0) >= 100 },
  { id: "fkch", n: "¡Chase!", d: "Consigue tu primera Chase.", r: 60, ok: () => (S.lt.fkchase || 0) >= 1 },
  { id: "fkexc", n: "Rey de los eventos", d: "Consigue 10 exclusivas.", r: 200, ok: () => (S.lt.fkexc || 0) >= 10 },
  {
    id: "fkalb",
    n: "Colección completa",
    d: "Completa una colección del álbum.",
    r: 250,
    ok: () => Object.keys(S.fk.albR || {}).length >= 1,
  },
  { id: "fkday", n: "Día friki", d: "Vende 500 € de Funkos en un día.", r: 150, ok: () => (S.fk.st.inc || 0) >= 500 },
  { id: "fklv", n: "Zona legendaria", d: "Lleva la zona al nivel 10.", r: 1000, ok: () => fkLv() >= 10 },
];
export function fkAch() {
  const F = S.fk;
  if (!F) return;
  F.ach = F.ach || {};
  FK_ACH.forEach((a) => {
    if (F.ach[a.id] || !a.ok()) return;
    F.ach[a.id] = 1;
    S.money += a.r;
    ui.toast(`🏅 Logro Funko: ${a.n} (+${a.r} €)`);
    ui.sfx("ach");
  });
}

/* ---------- Ayudas para las pantallas ---------- */
export const fkFigsOf = (c) => FIGS.filter((f) => f.c === c);
export const FK_EXTRA = { dlx: DLX, grail: GRAILS, gold: [GOLD] };
