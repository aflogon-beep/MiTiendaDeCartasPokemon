// Bot jugador para la simulación de varios días (test 4).
// Se ejecuta DENTRO de la página: recibe P (= window.__pcs) y no puede usar nada de fuera.
// Juega como un jugador sencillo: repone sobres, pone los precios recomendados (🎯),
// llena la vitrina con sus mejores cartas, abre la tienda y cobra a los clientes
// (con claim: true, también cobra las recompensas de las misiones del día, como haría un jugador).
// No compra cartas, lotes ni intercambia: a los que vienen a vender les dice que no.
export async function botPlay(P, opt) {
  const { days, speed, claim } = opt;
  // El bot actúa una vez por fotograma (justo después de que el juego avance), así reacciona igual
  // de rápido en tiempo de juego tanto en un ordenador rápido como en uno lento (p. ej. en GitHub).
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const A = P.A;
  const DEN = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  const log = [];
  const t0 = performance.now();
  let prepDay = 0;

  const exactChange = (due) => {
    const out = [];
    for (const v of DEN) while (due >= v) out.push(v), (due -= v);
    return out;
  };

  function handle(M) {
    const S = P.S;
    if (M === "sum") {
      const s = S.summary;
      log.push({ day: s.day, level: P.level(), net: Math.round(P.netWorth()), money: Math.round(S.money), inc: Math.round(s.inc), cust: s.cust, lost: s.lost });
      return A.close();
    }
    if (M === "ck") {
      const k = P.CK;
      if (!k || k.st !== "pay") return; // TPV procesando
      if (k.m === "cash") {
        k.given = exactChange(k.paid - k.tc);
        return A.ckgive();
      }
      // Tarjeta: teclear el importe exacto y aceptar. El TPV tarda ~1,8 s en animarse;
      // el bot aplica directamente lo que hace A.ckok() al terminar con el importe exacto.
      P.track("cardpay");
      return P.finishCK(k.tc / 100);
    }
    if (M === "hag") return A.hgacc();
    if (M === "sell") return A.dealno();
    if (M === "lot") return A.lotno();
    if (M === "trade") return A.tradeno();
    if (M === "toffer") return A.tofno();
    if (["tierup", "medal", "grev", "boxo", "open"].includes(M)) {
      P.VIS.showTier = null;
      P.VIS.showMed = null;
      return P.closeM();
    }
    return A.close();
  }

  // Sobres: mantener ~18 de cada set en estanterías si hay dinero (dejando colchón)
  function restock() {
    const S = P.S;
    for (const sd of P.SETS) {
      if (!S.slots.includes(sd.id) && !(S.sealed[sd.id] > 0) && S.slots.every(Boolean)) continue;
      const incoming = (S.deliv || []).reduce((a, o) => a + ((o.sealed || {})[sd.id] || 0), 0);
      let have = S.sealed[sd.id] + incoming;
      while (have < 18 && S.money - S.pack[sd.id].w * 6 > 120) {
        A.buyp({ k: sd.id, n: "6" });
        have += 6;
      }
    }
  }

  // Vitrina: las cartas más valiosas (≥ 1 €) que no estén ya expuestas
  function fillCase() {
    const S = P.S;
    for (let g = 0; g < 40 && P.caseItems().length < P.caseCap(); g++) {
      const it = S.items
        .filter((i) => i.case == null && !i.gq && !i.fkK && !i.fav && !i.res && !i.lux && P.itemVal(i) >= 1)
        .sort((a, b) => P.itemVal(b) - P.itemVal(a))[0];
      if (!it) break;
      P.collSel = P.gk(it);
      A.caseadd();
    }
    P.collSel = null;
  }

  // Abrir algún sobre para tener cartas que exponer si la vitrina tiene huecos
  function openForCase() {
    const S = P.S;
    const idle = S.items.filter((i) => i.case == null && !i.fav && !i.gq && !i.fkK && P.itemVal(i) >= 1).length;
    const free = P.caseCap() - P.caseItems().length;
    if (free <= idle) return false;
    const sd = P.SETS.filter((d) => S.sealed[d.id] >= 8).sort((a, b) => S.sealed[b.id] - S.sealed[a.id])[0];
    if (!sd) return false;
    A.open({ k: sd.id, n: "1" });
    return true;
  }

  P.speed = speed;
  let opened = 0;
  while (log.length < days) {
    if (performance.now() - t0 > opt.maxMs) throw new Error(`bot: tiempo agotado en el día ${P.S.day} (M=${P.M}, fase=${P.S.phase})`);
    const M = P.M;
    if (M) {
      handle(M);
      await nextFrame();
      continue;
    }
    if (P.paused) P.setPause(false);
    const S = P.S;
    if (S.phase === "closed") {
      if (prepDay !== S.day) {
        prepDay = S.day;
        opened = 0;
        if (claim && S.dm) S.dm.list.forEach((m, i) => m.done && !m.cl && A.mclaim({ n: String(i) }));
        restock();
      }
      if ((S.deliv || []).length) {
        await nextFrame(); // esperando a la furgoneta
        continue;
      }
      if (opened < 3 && openForCase()) {
        opened++;
        continue;
      }
      fillCase();
      A.recall();
      P.closeM();
      document.querySelector("#act").click();
    } else {
      const f = P.front();
      if (f) P.serveFront();
    }
    await nextFrame();
  }
  return log;
}
