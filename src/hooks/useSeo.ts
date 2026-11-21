import { useEffect } from 'react';

export interface SeoOptions {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string; // se usa como canónica y como og:url
  type?: string; // og:type
  noindex?: boolean;
}

type Restore = () => void;

/** Fija un valor en una etiqueta del <head>; la crea si no existe y devuelve cómo dejarla como estaba. */
function setTag(selector: string, create: () => HTMLElement, attr: 'content' | 'href', value: string): Restore {
  let el = document.head.querySelector<HTMLElement>(selector);
  const created = !el;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  const previous = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => {
    if (!el) return;
    if (created) el.remove();
    else if (previous === null) el.removeAttribute(attr);
    else el.setAttribute(attr, previous);
  };
}

const meta = (key: 'name' | 'property', name: string) => () => {
  const m = document.createElement('meta');
  m.setAttribute(key, name);
  return m;
};

/**
 * SEO por página: actualiza EN SU LUGAR las etiquetas que ya trae index.html (título,
 * descripción, Open Graph, canónica) y las restaura al salir. Así nunca hay etiquetas
 * duplicadas o contradictorias (con react-helmet las de index.html se quedaban y las
 * de la página se agregaban al lado, y dos canónicas distintas las ignora el buscador).
 */
export function useSeo({ title, description, keywords, image, url, type, noindex }: SeoOptions) {
  useEffect(() => {
    const restores: Restore[] = [];
    const previousTitle = document.title;
    document.title = title;
    restores.push(() => { document.title = previousTitle; });

    restores.push(setTag('meta[property="og:title"]', meta('property', 'og:title'), 'content', title));
    if (description) {
      restores.push(setTag('meta[name="description"]', meta('name', 'description'), 'content', description));
      restores.push(setTag('meta[property="og:description"]', meta('property', 'og:description'), 'content', description));
    }
    if (keywords) restores.push(setTag('meta[name="keywords"]', meta('name', 'keywords'), 'content', keywords));
    if (image) restores.push(setTag('meta[property="og:image"]', meta('property', 'og:image'), 'content', image));
    if (type) restores.push(setTag('meta[property="og:type"]', meta('property', 'og:type'), 'content', type));
    if (url) {
      restores.push(setTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', url));
      restores.push(setTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l; }, 'href', url));
    }
    if (noindex) restores.push(setTag('meta[name="robots"]', meta('name', 'robots'), 'content', 'noindex'));

    return () => restores.reverse().forEach((r) => r());
  }, [title, description, keywords, image, url, type, noindex]);
}
