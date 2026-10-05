// Partida en la nube (Supabase, docs/nube.md): cuenta con usuario y contraseña, la partida comprimida en la tabla
// «saves» (se quedan las 7 últimas de cada ranura) y el registro de errores en «logs». Sin librería: la API REST
// con fetch. La cuenta, la sesión y qué versión de la nube tiene cada ranura se guardan en pcs-cloud-v1.
// Sin red, el juego sigue igual: lo que no se pudo subir queda pendiente y se sube al volver la conexión.

/** Proyecto de Supabase (la clave «anon» es pública: la seguridad la ponen las reglas de las tablas). */
export const CLOUD_URL = "https://bhanoppjpkuwfrmocvpf.supabase.co";
export const CLOUD_ANON = "sb_publishable_ARCFdS2lu4Iy0a_QTMbN0g_a3HnvQSd";
/** Supabase pide un correo: el usuario se convierte en usuario@este dominio (nunca se manda nada a él). */
export const CLOUD_MAIL = "aflogon-beep.github.io";
export const CLOUD_KEY = "pcs-cloud-v1";
/** Copias que se quedan en la nube por ranura (las borra la propia base de datos: docs/nube.md). */
export const CLOUD_KEEP = 7;

/** Proyecto en uso (los tests ponen el suyo en globalThis.__pcsCloudCfg). */
export const cloudCfg = () => globalThis.__pcsCloudCfg || { url: CLOUD_URL, key: CLOUD_ANON };
export const cloudOn = () => !!cloudCfg().url;

/* ---------- Lo que se recuerda en el dispositivo ---------- */
function readC() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_KEY) || "null") || {};
  } catch (e) {
    return {};
  }
}
function writeC(c) {
  try {
    localStorage.setItem(CLOUD_KEY, JSON.stringify(c));
  } catch (e) {}
}
export const cloudState = () => readC();
/** Usuario con el que se ha entrado (o null). */
export const cloudUser = () => readC().u || null;
const slotId = (mode, slot) => `${mode}-${slot}`;
/** Id de la copia de la nube que tiene esta ranura (la última que se subió o se bajó desde aquí). */
export const syncedId = (mode, slot) => (readC().sync || {})[slotId(mode, slot)] || null;
export function setSynced(mode, slot, id) {
  const c = readC();
  c.sync = Object.assign({}, c.sync, { [slotId(mode, slot)]: id });
  if (c.pend) delete c.pend[slotId(mode, slot)];
  writeC(c);
}
/** Ranuras con algo sin subir (falló la red). */
export const pendingSlots = () => Object.keys(readC().pend || {});
export function setPending(mode, slot) {
  const c = readC();
  c.pend = Object.assign({}, c.pend, { [slotId(mode, slot)]: Date.now() });
  writeC(c);
}

/* ---------- Usuario ---------- */
/** Usuario válido: 3–20 letras, números, punto, guion o guion bajo (sin mayúsculas ni espacios). */
export const normUser = (u) =>
  String(u || "")
    .trim()
    .toLowerCase();
export const validUser = (u) => /^[a-z0-9][a-z0-9._-]{2,19}$/.test(normUser(u));
export const userMail = (u) => `${normUser(u)}@${CLOUD_MAIL}`;

/** Error con el texto que se enseña al jugador. */
export class CloudError extends Error {}
function niceErr(st, j) {
  const m = String((j && (j.error_code || j.code || j.msg || j.message || j.error_description || j.error)) || "");
  if (/invalid_credentials|invalid login/i.test(m)) return "Usuario o contraseña incorrectos";
  if (/user_already_exists|already registered/i.test(m)) return "Ese usuario ya existe. Prueba con otro";
  if (/weak_password|password should/i.test(m)) return "La contraseña es demasiado corta (mínimo 6)";
  if (/over_request_rate|rate limit/i.test(m) || st === 429) return "Demasiados intentos. Espera un poco";
  if (/email_not_confirmed/i.test(m)) return "Falta desactivar «Confirm email» en Supabase (docs/nube.md)";
  return `Error de la nube (${st}${m ? ": " + m.slice(0, 60) : ""})`;
}
async function call(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const { url, key } = cloudCfg();
  if (!url) throw new CloudError("La nube no está configurada");
  const h = Object.assign({ apikey: key, "Content-Type": "application/json" }, headers);
  if (auth) h.Authorization = "Bearer " + (await token());
  let r;
  try {
    r = await fetch(url + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body) });
  } catch (e) {
    throw new CloudError("Sin conexión con la nube");
  }
  const t = await r.text();
  let j = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch (e) {}
  if (!r.ok) throw new CloudError(niceErr(r.status, j));
  return j;
}
function keepSession(u, j) {
  if (!j || !j.access_token) throw new CloudError(niceErr(400, { code: "email_not_confirmed" }));
  const c = readC();
  if (c.u && c.u !== u) c.sync = {}; // otra cuenta: lo de la anterior no vale
  Object.assign(c, {
    u,
    uid: j.user && j.user.id,
    at: j.access_token,
    rt: j.refresh_token,
    exp: Date.now() + (j.expires_in || 3600) * 1000,
  });
  writeC(c);
  return u;
}
/** Crear una cuenta (y entrar con ella). */
export async function cloudSignUp(u, pass) {
  u = normUser(u);
  if (!validUser(u)) throw new CloudError("Usuario de 3 a 20 letras o números, sin espacios");
  if (String(pass || "").length < 6) throw new CloudError("La contraseña es demasiado corta (mínimo 6)");
  const j = await call("/auth/v1/signup", {
    method: "POST",
    auth: false,
    body: { email: userMail(u), password: pass },
  });
  return keepSession(u, j);
}
/** Entrar con una cuenta que ya existe. */
export async function cloudSignIn(u, pass) {
  u = normUser(u);
  if (!validUser(u)) throw new CloudError("Usuario o contraseña incorrectos");
  const j = await call("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: { email: userMail(u), password: pass },
  });
  return keepSession(u, j);
}
/** Salir: se olvida la sesión (las partidas del dispositivo no se tocan). */
export function cloudSignOut() {
  writeC({});
}
/** Token de acceso válido (si ha caducado, se renueva). */
async function token() {
  const c = readC();
  if (!c.rt) throw new CloudError("No has entrado en tu cuenta");
  if (c.at && c.exp - Date.now() > 60e3) return c.at;
  const j = await call("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    auth: false,
    body: { refresh_token: c.rt },
  });
  keepSession(c.u, j);
  return j.access_token;
}

/* ---------- Comprimir (gzip + base64): la partida pasa de ~2 MB a unos cientos de KB ---------- */
const b64 = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
const pipe = async (u8, stream) =>
  new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());
export const packSave = async (str) => b64(await pipe(new TextEncoder().encode(str), new CompressionStream("gzip")));
export const unpackSave = async (s) => new TextDecoder().decode(await pipe(unb64(s), new DecompressionStream("gzip")));

/* ---------- Partidas ---------- */
const SEL = "id,mode,slot,day,name,ver,size,created_at";
/** Sube la partida de una ranura (el texto que se guarda en localStorage). Devuelve la fila nueva. */
export async function cloudUpload(mode, slot, json, meta = {}) {
  const data = await packSave(json);
  const rows = await call("/rest/v1/saves?select=" + SEL, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: { mode, slot, day: meta.day || 0, name: meta.name || null, ver: meta.ver || null, size: json.length, data },
  });
  const row = rows && rows[0];
  if (row) setSynced(mode, slot, row.id);
  return row;
}
/** Copias de una ranura en la nube, de la más nueva a la más vieja (sin los datos). */
export const cloudList = (mode, slot) =>
  call(`/rest/v1/saves?select=${SEL}&mode=eq.${mode}&slot=eq.${slot}&order=id.desc&limit=${CLOUD_KEEP}`);
/** La más nueva de una ranura (o null). */
export const cloudLatest = async (mode, slot) => (await cloudList(mode, slot))[0] || null;
/** Baja una copia: devuelve el texto de la partida (lo mismo que se guarda en localStorage). */
export async function cloudFetch(id) {
  const rows = await call(`/rest/v1/saves?select=data&id=eq.${+id}`);
  if (!rows || !rows[0]) throw new CloudError("Esa copia ya no está en la nube");
  return unpackSave(rows[0].data);
}

/* ---------- Registro de errores ---------- */
let sent = 0;
/** Apunta un error o un cierre en la nube (solo con la cuenta abierta; como mucho 20 por sesión). */
export async function cloudLog(kind, data, ver) {
  if (!cloudOn() || !cloudUser() || sent >= 20) return false;
  sent++;
  try {
    await call("/rest/v1/logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: { kind: String(kind).slice(0, 40), ver: ver || null, data },
    });
    return true;
  } catch (e) {
    return false;
  }
}
