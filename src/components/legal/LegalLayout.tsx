import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { POLICY_VERSION, formatPolicyDate } from '@/lib/legal';
import { useSeo } from '@/hooks/useSeo';

export interface TocItem {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string; // ruta de la página, para la URL canónica
  toc: TocItem[];
  children: ReactNode;
}

/** Estructura común de las páginas legales: título, vigencia, índice y contenido. */
export function LegalLayout({ title, description, path, toc, children }: LegalLayoutProps) {
  useSeo({ title: `${title} | Farfalla Estudio`, description, url: `https://farfallaestudio.com.co${path}` });

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Versión {POLICY_VERSION} · Vigente desde el {formatPolicyDate()}
        </p>

        <nav aria-label="Contenido" className="mt-8 rounded-lg border bg-muted/30 p-4">
          <p className="font-medium text-farfalla-ink mb-2">Contenido</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm columns-1 sm:columns-2 gap-8">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-farfalla-teal hover:underline">
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">{children}</div>

        <div className="mt-12 pt-6 border-t text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/privacidad" className="hover:underline">Política de privacidad</Link>
          <Link to="/terminos" className="hover:underline">Términos y condiciones</Link>
          <Link to="/" className="hover:underline">Volver al inicio</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-poppins font-semibold text-farfalla-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

export const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 space-y-1.5">{children}</ul>
);

export const OL = ({ children }: { children: ReactNode }) => (
  <ol className="list-decimal pl-6 space-y-1.5">{children}</ol>
);

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="rounded-md border-l-4 border-farfalla-teal bg-muted/40 px-4 py-3 text-sm">{children}</p>
);
