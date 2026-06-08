import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-secondary/40 px-4 py-24 sm:px-6 sm:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Najdi svou
            <br />
            <span className="sr-only">terapeutku, koučku nebo průvodkyni</span>
            <span aria-hidden="true"><TypewriterText /></span>
          </h1>
          <div className="mx-auto mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-accent" />
            <span className="text-sm font-medium tracking-widest text-accent uppercase">
              Prověřené podnikatelky
            </span>
            <span className="h-px w-12 bg-accent" />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Katalog podnikatelek nabízejících masáže, terapie,
            koučink, péči v těhotenství a mnoho dalšího.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/katalog" className={buttonVariants({ size: "lg" })}>
              Procházet katalog
            </Link>
            <Link
              href="/pro-podnikatelky"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-accent bg-accent/10 px-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/20"
            >
              Jsem podnikatelka
            </Link>
          </div>
        </div>
      </section>

      {/* Kategorie */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Čím vám mohou pomoci
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/katalog?kategorie=${cat.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-colors hover:border-accent/60 hover:bg-accent/5"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="mt-3 text-sm font-medium text-foreground group-hover:text-accent-foreground">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA pro podnikatelky */}
      <section className="bg-primary px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">
            Jsi podnikatelka ve službách?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Vytvoř si bezplatný profil a oslovuj zákaznice, které hledají právě to, co nabízíš.
          </p>
          <Link
            href="/registrace"
            className={buttonVariants({ variant: "secondary", size: "lg" }) + " mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"}
          >
            Zaregistrovat se zdarma
          </Link>
        </div>
      </section>
    </div>
  );
}

const CATEGORIES = [
  { slug: "kosmetika",           label: "Kosmetika",              emoji: "✨" },
  { slug: "masaze",              label: "Masáže",                 emoji: "🤲" },
  { slug: "terapie",             label: "Terapie",                emoji: "🌿" },
  { slug: "koucink",             label: "Koučink",                emoji: "🎯" },
  { slug: "tehotenstvi-poporod", label: "Těhotenství & poporod",  emoji: "🌸" },
  { slug: "vyziva",              label: "Výživa",                 emoji: "🥗" },
  { slug: "pohyb-fyzioterapie",  label: "Pohyb",                  emoji: "🧘" },
  { slug: "energie-spiritualita",label: "Energie",                emoji: "🔮" },
  { slug: "poradenstvi",         label: "Poradenství",            emoji: "💬" },
  { slug: "vzdelavani",          label: "Vzdělávání",             emoji: "📚" },
];
