// Cartas falsas: qué pruebas fallan (lupa, luz, balanza) y cuánto pesan.
export const mkTells = (fake) => (fake ? ["lens", "light", "scale"].sort(() => Math.random() - 0.5).slice(0, 2) : []);
export const mkWt = (fake, tl) =>
  fake && tl.includes("scale") ? 1.51 + Math.random() * 0.1 : 1.72 + Math.random() * 0.07;
