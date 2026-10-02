// Emisor de eventos: core avisa (toast, sonido, vibración, repintar…) sin depender de ui.
const handlers = {};
export const on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
export const emit = (ev, ...args) => (handlers[ev] || []).forEach((fn) => fn(...args));
// Atajo para avisar a la interfaz: ui.toast("…") es lo mismo que emit("toast", "…").
// La interfaz registra con on() qué hace cada aviso (toast, hud, openM, sfx, efectos…).
export const ui = new Proxy({}, { get: (_, ev) => (...args) => emit(ev, ...args) });
