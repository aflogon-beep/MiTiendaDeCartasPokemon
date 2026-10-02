// Emisor de eventos: core avisa (toast, sonido, vibración, repintar…) sin depender de ui.
const handlers = {};
export const on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
export const emit = (ev, ...args) => (handlers[ev] || []).forEach((fn) => fn(...args));
