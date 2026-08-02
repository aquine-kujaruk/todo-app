"use client";

import { type Theme, THEME_STORAGE_KEY } from "@/lib/theme";

// Este botón no guarda nada en estado de React, y esa es la parte importante:
// el tema ya vive en `data-theme` sobre `html`, estampado por el script en
// línea del layout antes del primer pintado. Leer `localStorage` durante el
// render daría marcado distinto en servidor y cliente — un desajuste de
// hidratación. Así el marcado es siempre el mismo, y qué icono y qué rótulo se
// ven lo decide el CSS a partir de `data-theme`. El clic sí es cliente.
//
// El nombre accesible sale del rótulo que el CSS deja visible: el otro está en
// `display: none` y por eso no llega al lector de pantalla. Un `aria-label` no
// serviría, porque un atributo no se puede cambiar desde CSS.

function currentTheme(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (attribute === "light" || attribute === "dark") return attribute;
  // Nadie ha elegido todavía: manda el dispositivo, igual que en el CSS.
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  function toggleTheme() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Incógnito o cookies bloqueadas: el tema cambia igual durante esta
      // visita, solo que no se recuerda al volver. No hay nada que avisar.
    }
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme}>
      <svg
        className="icon-moon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg
        className="icon-sun"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5" />
      </svg>
      <span className="visually-hidden label-to-dark">
        Cambiar a modo oscuro
      </span>
      <span className="visually-hidden label-to-light">
        Cambiar a modo claro
      </span>
    </button>
  );
}
