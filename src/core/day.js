// Día de tienda: reloj (fracción del día transcurrida) y cierre del día (alquiler, sueldos, precios, eventos, ticket).
import { DAYLEN } from "./constants.js";
import { S } from "./state.js";
import { clamp } from "./util.js";
import { ui } from "./bus.js";
import { BYID, CARDS } from "./cards/sets.js";
import { DF } from "./difficulty.js";
import { RENT, STAFF, VOL } from "./constants.js";
import { SETS, assignSlots } from "./state.js";
import { accP, itemVal, netWorth } from "./economy.js";
import { checkAch } from "./achievements.js";
import { dedupTips, tipsList } from "./tips.js";
import { genMissions, track } from "./missions.js";
import { genOrder } from "./orders.js";
import { loy } from "./regulars.js";
import { pick, rnd } from "./rng.js";
import { r05 } from "./util.js";
import { refreshPacks } from "./packs.js";
import { rivalUpd } from "./rival.js";
import { rollGrade } from "./grading.js";
import { saveNow } from "./save.js";
import { tablesReset } from "./tables.js";
import { step } from "./cards/prices.js";
export function dayT() {
  if (S.phase === "closed") return 0;
  return clamp(S.clock / DAYLEN, 0, 1);
}
export function endDay() {
  const rent = r05(RENT * DF().rent);
  S.money -= rent;
  const sal = STAFF.reduce((a, x) => a + (S.staff[x.k] ? x.sal : 0), 0);
  S.money -= sal;
  let tourInc = null;
  if (S.tour) {
    const pl = 8 + rnd(10);
    tourInc = pl * 5 - 40;
    S.money += tourInc;
    S.repB += 2;
    track("tour");
  }
  if (S.staff.cm) S.repB += 1;
  Object.keys(S.prices).forEach((id) => step(S.prices[id], VOL[(BYID[id] || {}).r] || 0.5));
  let news = "";
  if (Math.random() < 0.08 && SETS.length) {
    const sd = pick(SETS),
      up = Math.random() < 0.5,
      m = up ? 1.06 + Math.random() * 0.1 : 0.86 + Math.random() * 0.08;
    CARDS.forEach((c) => {
      if (c.s === sd.id && ["DR", "IR", "UR", "SIR", "HR"].includes(c.r)) S.prices[c.id].p *= m;
    });
    news = up
      ? `📰 Un torneo popular impulsa ${sd.n}: las cartas raras suben.`
      : `📰 Reimpresión anunciada de ${sd.n}: las cartas raras bajan.`;
  }
  refreshPacks();
  S.slots = S.slots.map((id) => (id && S.sealed[id] > 0 ? id : null));
  assignSlots();
  let loanPay = 0;
  if (S.loan && S.loan.left > 0) {
    loanPay = Math.min(S.loan.left, S.loan.daily);
    S.money -= loanPay;
    S.loan.left = r05(S.loan.left - loanPay);
  }
  let mkN = 0,
    mkInc = 0;
  if (S.market && S.market.day === S.day && !S.market.res) {
    S.market.res = 1;
    const pr = accP(S.market.mk, 0.9, 1.25) * 0.9;
    S.market.items.forEach((id) => {
      const it = S.items.find((i) => i.i === id);
      if (!it) return;
      it.res = false;
      if (Math.random() < pr) {
        mkInc += itemVal(it) * S.market.mk;
        mkN++;
        S.items.splice(S.items.indexOf(it), 1);
      }
    });
    S.money += mkInc;
  }
  if (S.myPromo && S.myPromo.day === S.day && S.rival && S.rival.promo && S.myPromo.s === S.rival.promo.s)
    S.rival.str = Math.max(0, S.rival.str - 5);
  const rivMsg = rivalUpd();
  const st = S.stats;
  // Récord de ventas: más que cualquier día anterior (el primer día no cuenta)
  const prevBest = Math.max(S.recInc || 0, ...(S.hist || []).map((h) => h.inc)),
    rec = !!(S.hist || []).length && st.inc > 0 && st.inc > prevBest;
  S.recInc = Math.max(prevBest, st.inc);
  S.hist = (S.hist || [])
    .concat([
      { d: S.day, inc: Math.round(st.inc * 100) / 100, net: Math.round(netWorth()), cust: st.cust, lost: st.lost },
    ])
    .slice(-60);
  S.day++;
  let grN = 0,
    fkN = 0;
  S.items.forEach((i) => {
    if (i.gq && i.gq.due <= S.day) {
      if (i.fk) {
        delete i.gq;
        i.fkK = true;
        fkN++;
        return;
      }
      i.gr = rollGrade(i.k);
      delete i.gq;
      S.grNew.push(i.i);
      grN++;
      if (i.gr === 10) track("gem");
      if (i.gr >= 9) track("gem9");
    }
  });
  const nOrd = S.orders.length;
  S.orders = S.orders.filter((o) => o.due >= S.day);
  const exp = nOrd - S.orders.length;
  let newOrd = false;
  if (S.orders.length < 3 && Math.random() < 0.6) {
    genOrder();
    newOrd = true;
  }
  let refund = 0,
    refN = 0;
  S.fkRet.forEach((x) => {
    if (Math.random() < 0.45) {
      refund += x.got;
      refN++;
      S.repB = Math.max(0, S.repB - 3);
      loy(x.reg, -25, "Le vendiste una carta falsa");
    }
  });
  S.money -= refund;
  S.fkRet = [];
  S.ev = null;
  S.tour = false;
  S.vipDone = false;
  if (S.day % 7 === 0 && S.sets.length) S.ev = { t: "launch", s: pick(S.sets) };
  else {
    const r = Math.random();
    if (r < 0.12) S.ev = { t: "rain" };
    else if (r < 0.22) S.ev = { t: "vip" };
  }
  genMissions();
  S.lastWhy = st.why || {};
  S.lastTips = dedupTips(tipsList(st));
  S.summary = {
    loanPay,
    mkN,
    mkInc,
    rivMsg,
    rivNew: S.newsRival ? ((S.newsRival = 0), 1) : 0,
    day: S.day - 1,
    inc: st.inc,
    cust: st.cust,
    lost: st.lost,
    why: st.why || {}, // por qué se fueron sin comprar (en el ticket)
    bought: st.bought,
    rent,
    sal,
    tourInc,
    tbl: st.tbl || 0, // mesa de juego: lo cobrado y las partidas
    tblN: st.tblN || 0,
    rec, // ¡RÉCORD! (sello en el ticket)
    news,
    net: netWorth(),
    grN,
    newOrd,
    exp,
    fkN,
    refund,
    refN,
  };
  S.phase = "closed";
  S.clock = 0;
  tablesReset();
  S.stats = { inc: 0, cust: 0, lost: 0, bought: 0 };
  checkAch();
  saveNow();
  ui.vis({ dawn: 1 });
  ui.openM("sum");
  ui.sfx("print");
  if (rec) ui.record();
  ui.hud();
  // Día muy bueno (récord de ventas y al menos 150 €): Emma ya huele a Sephora
  if (st.inc >= 150 && st.inc > (S.bestInc || 0)) {
    S.bestInc = st.inc;
    ui.quip("bigday");
  }
}
