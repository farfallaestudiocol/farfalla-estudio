import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { formatPrice } from '@/lib/pricing';
import { searchProducts, SearchProductRow } from '@/lib/searchProducts';

interface SearchBoxProps {
  autoFocus?: boolean;
  onSearch?: () => void;
  /** Muestra las sugerencias en el flujo normal de la página (para usarlo dentro de un menú que recorta). */
  inlineResults?: boolean;
}

const MIN_CHARS = 2;
const SUGGESTIONS = 6;
const DEBOUNCE_MS = 250;

/**
 * Caja de búsqueda con sugerencias mientras escribes. Enter (o la lupa) lleva a la página de
 * resultados completa; elegir una sugerencia lleva directo al producto.
 */
const SearchBox = ({ autoFocus, onSearch, inlineResults }: SearchBoxProps) => {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);

  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [results, setResults] = useState<SearchProductRow[]>([]);
  const [active, setActive] = useState(-1);

  const query = value.trim();
  const searchable = query.length >= MIN_CHARS;

  // Sugerencias con espera corta para no consultar en cada tecla; se descartan las respuestas viejas
  useEffect(() => {
    if (!searchable) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await searchProducts(query, SUGGESTIONS);
        if (cancelled) return;
        setResults(rows);
        setFailed(false);
      } catch (error) {
        if (cancelled) return;
        console.error('Error searching products:', error);
        setResults([]);
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchable]);

  // Cierra las sugerencias al hacer clic fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const finish = () => {
    setOpen(false);
    setActive(-1);
    onSearch?.();
  };

  const goToResults = () => {
    if (!query) return;
    navigate(`/buscar?q=${encodeURIComponent(query)}`);
    finish();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) {
      navigate(`/producto/${results[active].slug}`);
      finish();
      return;
    }
    goToResults();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // evita que el navegador borre el texto de un campo de búsqueda
      setOpen(false);
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    }
  };

  const showPanel = open && searchable;

  return (
    <form ref={rootRef} onSubmit={submit} role="search" className="relative w-full">
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-farfalla-teal"
      >
        <Search className="h-4 w-4" />
      </button>
      <Input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Buscar productos..."
        className="farfalla-input pl-10 w-full"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        aria-label="Buscar productos"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
      />

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className={
            inlineResults
              ? 'mt-2 rounded-lg border bg-white'
              : 'absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border bg-white shadow-lg overflow-hidden'
          }
        >
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          )}

          {!loading && failed && (
            <p className="px-4 py-3 text-sm text-destructive">No pudimos buscar en este momento. Intenta de nuevo.</p>
          )}

          {!loading && !failed && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No encontramos productos para “{query}”.</p>
          )}

          {results.map((p, i) => (
            <Link
              key={p.id}
              to={`/producto/${p.slug}`}
              role="option"
              aria-selected={i === active}
              onClick={finish}
              className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted ${i === active ? 'bg-muted' : ''}`}
            >
              <img
                src={p.images?.[0] ? convertGoogleDriveUrlToBase64(p.images[0]) : '/placeholder.svg'}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
              <span className="flex-1 min-w-0 truncate font-medium text-farfalla-ink">{p.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatPrice(p.price)}</span>
            </Link>
          ))}

          {results.length > 0 && (
            <button
              type="button"
              onClick={goToResults}
              className="w-full border-t px-4 py-2.5 text-left text-sm font-medium text-farfalla-teal hover:bg-muted"
            >
              Ver todos los resultados para “{query}”
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default SearchBox;
