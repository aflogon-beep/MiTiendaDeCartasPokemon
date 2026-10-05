// Supabase simulado (docs/nube.md) para los tests: cuentas, tabla «saves» (se quedan las 7 últimas por
// ranura, como el disparador de la base de datos) y «logs». Responde como la API REST de verdad, solo lo
// que usa src/core/cloud.js.
export const SUPA_URL = "https://pcs-test.supabase.co";
export const SUPA_KEY = "anon-test";

export function fakeSupa() {
  const db = { users: {}, saves: [], logs: [], seq: 0, tok: {} };
  const json = (status, body) => ({ status, body: body == null ? "" : JSON.stringify(body) });
  const session = (uid) => {
    const at = "at-" + uid + "-" + ++db.seq,
      rt = "rt-" + uid + "-" + db.seq;
    db.tok[at] = uid;
    db.tok[rt] = uid;
    return { access_token: at, refresh_token: rt, expires_in: 3600, user: { id: uid } };
  };
  const pick = (r, sel) => Object.fromEntries(sel.split(",").map((k) => [k, r[k]]));
  function handle(method, url, headers, body) {
    const u = new URL(url),
      p = u.pathname,
      q = u.searchParams,
      b = body ? JSON.parse(body) : null;
    if (db.down) return null; // sin red
    if (p === "/auth/v1/signup") {
      if (db.users[b.email])
        return json(422, { code: 422, error_code: "user_already_exists", msg: "User already registered" });
      if (String(b.password).length < 6) return json(422, { error_code: "weak_password" });
      const uid = "u" + Object.keys(db.users).length;
      db.users[b.email] = { uid, pass: b.password };
      return json(200, session(uid));
    }
    if (p === "/auth/v1/token") {
      if (q.get("grant_type") === "password") {
        const us = db.users[b.email];
        if (!us || us.pass !== b.password) return json(400, { error_code: "invalid_credentials" });
        return json(200, session(us.uid));
      }
      const uid = db.tok[b.refresh_token];
      return uid ? json(200, session(uid)) : json(400, { error_code: "refresh_token_not_found" });
    }
    const uid = db.tok[(headers.authorization || headers.Authorization || "").replace("Bearer ", "")];
    if (!uid) return json(401, { message: "JWT expired" });
    const eq = (k) => (q.get(k) || "").replace(/^eq\./, "");
    if (p === "/rest/v1/saves") {
      if (method === "POST") {
        const row = Object.assign({}, b, { id: ++db.seq, user_id: uid, created_at: new Date().toISOString() });
        db.saves.push(row);
        const mine = db.saves.filter((r) => r.user_id === uid && r.mode === b.mode && r.slot === b.slot);
        mine.slice(0, Math.max(0, mine.length - 7)).forEach((r) => db.saves.splice(db.saves.indexOf(r), 1));
        return json(201, [pick(row, q.get("select"))]);
      }
      let rows = db.saves.filter((r) => r.user_id === uid);
      if (q.get("id")) rows = rows.filter((r) => r.id === +eq("id"));
      if (q.get("mode")) rows = rows.filter((r) => r.mode === eq("mode"));
      if (q.get("slot")) rows = rows.filter((r) => r.slot === +eq("slot"));
      rows = rows.sort((a, c) => c.id - a.id).slice(0, +(q.get("limit") || 99));
      return json(
        200,
        rows.map((r) => pick(r, q.get("select"))),
      );
    }
    if (p === "/rest/v1/logs" && method === "POST") {
      db.logs.push(Object.assign({}, b, { user_id: uid }));
      return json(201, null);
    }
    return json(404, { message: "no existe" });
  }
  /** fetch de mentira para Vitest. */
  const fetchFn = async (url, init = {}) => {
    const r = handle(init.method || "GET", url, init.headers || {}, init.body);
    if (!r) throw new TypeError("Failed to fetch");
    return new Response(r.body, { status: r.status });
  };
  return { db, handle, fetch: fetchFn };
}

/** Para Playwright: el juego usa este Supabase simulado. Devuelve su base de datos para mirarla. */
export async function mockSupa(page) {
  const S = fakeSupa();
  await page.addInitScript(([url, key]) => (window.__pcsCloudCfg = { url, key }), [SUPA_URL, SUPA_KEY]);
  await page.route(SUPA_URL + "/**", async (route) => {
    const rq = route.request();
    const r = S.handle(rq.method(), rq.url(), rq.headers(), rq.postData());
    if (!r) return route.abort();
    await route.fulfill({
      status: r.status,
      body: r.body,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return S.db;
}
