import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="mt-auto bg-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Logo className="h-[18px] w-auto" />
            <p className="mt-1 text-sm text-background">
              Síť prověřených podnikatelek ve službách.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-background">
            <Link href="/katalog" className="hover:underline transition-colors">
              Hledat
            </Link>
            <Link href="/pro-podnikatelky" className="hover:underline transition-colors">
              Pro podnikatelky
            </Link>
            <Link href="/registrace" className="hover:underline transition-colors">
              Registrace
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-background">
          © {new Date().getFullYear()} jsem Blažená. Všechna práva vyhrazena.
        </p>
      </div>
    </footer>
  );
}
