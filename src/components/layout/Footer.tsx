import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-heading text-lg font-semibold text-primary">Katalog<span className="text-accent">.</span></p>
            <p className="mt-1 text-sm text-muted-foreground">
              Síť prověřených podnikatelek ve službách.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/katalog" className="hover:text-foreground transition-colors">
              Hledat
            </Link>
            <Link href="/pro-podnikatelky" className="hover:text-foreground transition-colors">
              Pro podnikatelky
            </Link>
            <Link href="/registrace" className="hover:text-foreground transition-colors">
              Registrace
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Katalog. Všechna práva vyhrazena.
        </p>
      </div>
    </footer>
  );
}
