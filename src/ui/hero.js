// Banners con los personajes (mockup de Alberto): Emma, Álvaro o papá en un cielo de color, con una frase
// según la pantalla (entrega en Stock, premios en Retos, consejo en Mejoras, valor de la colección en Cartas).
import { charFace } from "../render/characters.js";

/** who: emma | alvaro | alberto; ex: expresión; html: el texto; th: tema de color (sky, sun, lila, rosa). */
export const hero = (who, ex, html, th = "sky") =>
  `<div class="hero ${th}" data-fase="I"><img src="${charFace(who, ex)}" alt=""><div class="hero-t">${html}</div></div>`;
