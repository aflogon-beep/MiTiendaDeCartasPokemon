// Acceso para los tests: window.__pcs.nombre lee o escribe una variable del juego por su nombre.
// Orden de búsqueda: el objeto G (variables que se reasignan) y después cada módulo.
export function installTestHooks(G, modules) {
  const owner = (n) => modules.find((m) => n in m);
  window.__pcs = new Proxy(
    {},
    {
      get(_, n) {
        if (typeof n !== "string") return undefined;
        if (G && n in G) return G[n];
        const m = owner(n);
        return m ? m[n] : undefined;
      },
      set(_, n, v) {
        if (G && n in G) G[n] = v;
        else if (owner(n)) throw new Error(`__pcs: ${n} es un export de solo lectura; usa su función o G`);
        else throw new Error(`__pcs: no existe ${n}`);
        return true;
      },
    },
  );
}
