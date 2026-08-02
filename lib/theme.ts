// El tema vive en el atributo `data-theme` del elemento `html`: "light",
// "dark", o ausente para seguir al dispositivo. Nada de esto toca el servidor
// ni la base de datos — la lista es compartida, el tema no.
//
// Este módulo no importa nada: lo comparten el layout (servidor) y el botón
// (cliente), y es el único sitio donde vive el nombre de la clave.

export type Theme = "light" | "dark";

/** Clave de `localStorage`. Estable: cambiarla olvida la elección de todos. */
export const THEME_STORAGE_KEY = "todo-poc.theme";

/**
 * Script en línea y bloqueante que el layout raíz mete en `<head>`. Lee la
 * elección guardada y estampa `data-theme` en `html` antes del primer pintado:
 * es la única forma de que no se vea un destello del tema contrario.
 *
 * Si no hay nada guardado deja el atributo ausente a propósito, y entonces
 * manda el `@media (prefers-color-scheme: dark)` de `globals.css`.
 *
 * Va envuelto en try/catch porque en incógnito `localStorage` lanza al leerlo.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
