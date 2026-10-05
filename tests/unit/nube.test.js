// Partida en la nube (src/core/cloud.js) contra un Supabase simulado (tests/fixtures/supa.js).
import { describe, it, expect, beforeEach } from "vitest";
import { fakeSupa, SUPA_URL, SUPA_KEY } from "../fixtures/supa.js";
import {
  cloudSignUp,
  cloudSignIn,
  cloudSignOut,
  cloudUser,
  cloudUpload,
  cloudList,
  cloudLatest,
  cloudFetch,
  cloudLog,
  syncedId,
  packSave,
  unpackSave,
  validUser,
  userMail,
} from "../../src/core/cloud.js";

// localStorage mínimo para Node
const LS = {};
Object.defineProperties(LS, {
  getItem: { value: (k) => (k in LS ? LS[k] : null) },
  setItem: { value: (k, v) => (LS[k] = String(v)) },
  removeItem: { value: (k) => delete LS[k] },
  clear: { value: () => Object.keys(LS).forEach((k) => delete LS[k]) },
});
globalThis.localStorage = LS;

let F;
beforeEach(() => {
  F = fakeSupa();
  globalThis.fetch = F.fetch;
  globalThis.__pcsCloudCfg = { url: SUPA_URL, key: SUPA_KEY };
  localStorage.clear();
});

describe("partida en la nube", () => {
  it("usuarios válidos y su correo interno", () => {
    expect(validUser("Alberto")).toBe(true);
    expect(validUser("al")).toBe(false);
    expect(validUser("con espacio")).toBe(false);
    expect(userMail(" Alberto ")).toBe("alberto@aflogon-beep.github.io");
  });
  it("comprimir y descomprimir deja la partida igual (y ocupa mucho menos)", async () => {
    const js = JSON.stringify({
      prices: Array.from({ length: 3000 }, (_, i) => ({ id: "c" + i, p: i / 7, h: [1, 2, 3] })),
    });
    const z = await packSave(js);
    expect(z.length).toBeLessThan(js.length / 3);
    expect(await unpackSave(z)).toBe(js);
  });
  it("crear cuenta, salir y volver a entrar; errores en español", async () => {
    await cloudSignUp("Alberto", "secreto1");
    expect(cloudUser()).toBe("alberto");
    await expect(cloudSignUp("alberto", "otra123")).rejects.toThrow("ya existe");
    cloudSignOut();
    expect(cloudUser()).toBe(null);
    await expect(cloudSignIn("alberto", "mal")).rejects.toThrow("incorrectos");
    await cloudSignIn("ALBERTO", "secreto1");
    expect(cloudUser()).toBe("alberto");
  });
  it("subir, listar y bajar; se quedan las 7 últimas de cada ranura", async () => {
    await cloudSignUp("emma", "123456");
    for (let d = 1; d <= 9; d++) await cloudUpload("real", 1, JSON.stringify({ day: d }), { day: d });
    await cloudUpload("real", 2, JSON.stringify({ day: 50 }), { day: 50 });
    const l = await cloudList("real", 1);
    expect(l.map((r) => r.day)).toEqual([9, 8, 7, 6, 5, 4, 3]);
    expect(l[0].data).toBeUndefined(); // la lista no trae la partida
    expect(syncedId("real", 1)).toBe(l[0].id);
    expect(JSON.parse(await cloudFetch(l[2].id)).day).toBe(7);
    expect((await cloudLatest("real", 2)).day).toBe(50);
    expect(await cloudLatest("offline", 1)).toBe(null);
  });
  it("cada cuenta solo ve lo suyo", async () => {
    await cloudSignUp("uno", "123456");
    await cloudUpload("real", 1, "{}", { day: 3 });
    await cloudSignUp("dos", "123456");
    expect(await cloudList("real", 1)).toEqual([]);
    expect(syncedId("real", 1)).toBe(null); // otra cuenta: se olvida lo de la anterior
  });
  it("sin red: error claro; registro de errores solo con cuenta", async () => {
    expect(await cloudLog("error", { m: "x" })).toBe(false);
    await cloudSignUp("papa", "123456");
    expect(await cloudLog("error", { m: "x" })).toBe(true);
    expect(F.db.logs[0]).toMatchObject({ kind: "error", data: { m: "x" } });
    F.db.down = true;
    await expect(cloudUpload("real", 1, "{}", {})).rejects.toThrow("Sin conexión");
  });
});
