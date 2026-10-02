// Acceso para los tests: window.__pcs.nombre lee o escribe una variable del juego por su nombre.
// Orden de búsqueda: el objeto G (variables que se reasignan), los módulos y, por último,
// lo que todavía queda en legacy.js (con su propio eval).
export function installTestHooks(G, modules, legacyGet, legacySet) {
  const owner = (n) => modules.find((m) => n in m);
  window.__pcs = new Proxy(
    {},
    {
      get(_, n) {
        if (typeof n !== "string") return undefined;
        if (G && n in G) return G[n];
        const m = owner(n);
        return m ? m[n] : legacyGet(n);
      },
      set(_, n, v) {
        if (G && n in G) G[n] = v;
        else if (owner(n)) throw new Error(`__pcs: ${n} es un export de solo lectura; usa su función o G`);
        else legacySet(n, v);
        return true;
      },
    },
  );
}
