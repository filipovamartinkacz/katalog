import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { createClient } from "@/lib/supabase/server";
import { ClanekCard, type ClanekCardData } from "@/app/blog/clanek-card";

export default async function Home() {
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from("clanek")
    .select("id, slug, nadpis, cover_url, typ, published_at, kategorie:kategorie_id ( nazev ), medailonek:medailonek_id ( jmeno, prijmeni )")
    .eq("status", "publikovano")
    .order("published_at", { ascending: false })
    .limit(3);

  const posledniClanky: ClanekCardData[] = (raw ?? []).map((c) => ({
    ...c,
    kategorie: Array.isArray(c.kategorie) ? c.kategorie[0] : c.kategorie,
    autorka: Array.isArray(c.medailonek) ? c.medailonek[0] : c.medailonek,
  }));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative overflow-hidden -mt-16 pt-40 pb-24 px-4 sm:pt-52 sm:pb-36 sm:px-6"
        style={{ background: 'radial-gradient(circle at 95% 0%, oklch(0.91 0.038 14) 0%, oklch(0.988 0.006 75) 48%)' }}
      >
        {/* Teal blob — dole vlevo, částečně mimo obrazovku */}
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full"
          style={{ background: 'oklch(0.68 0.07 188)', opacity: 0.10 }}
        />

        {/* Botanické listy — dole vlevo, malé rohové */}
        <svg
          className="pointer-events-none absolute bottom-0 left-0 h-36 w-28"
          viewBox="0 0 180 210"
          fill="none"
          aria-hidden="true"
          stroke="oklch(0.50 0.08 188)"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.30 }}
        >
          <path strokeWidth="1.8" d="M 38,208 C 42,175 47,145 54,114 C 61,83 66,53 74,16" />
          {/* lístek pár 1 */}
          <path strokeWidth="1.6" d="M 52,117 C 26,104 9,83 16,61 C 33,70 50,92 52,117 Z" />
          <path strokeWidth="1" d="M 52,117 L 16,61" />
          <path strokeWidth="1.6" d="M 56,111 C 80,98 93,77 86,55 C 69,64 55,86 56,111 Z" />
          <path strokeWidth="1" d="M 56,111 L 86,55" />
          {/* lístek pár 2 */}
          <path strokeWidth="1.6" d="M 59,77 C 36,64 23,44 30,23 C 47,32 60,54 59,77 Z" />
          <path strokeWidth="1" d="M 59,77 L 30,23" />
          <path strokeWidth="1.6" d="M 64,71 C 87,58 99,38 92,17 C 75,26 62,49 64,71 Z" />
          <path strokeWidth="1" d="M 64,71 L 92,17" />
          {/* lístek pár 3 — vrchol stonku */}
          <path strokeWidth="1.6" d="M 68,40 C 48,30 38,14 44,2 C 58,8 69,26 68,40 Z" />
          <path strokeWidth="1" d="M 68,40 L 44,2" />
          <path strokeWidth="1.6" d="M 72,35 C 91,25 99,10 93,0 C 78,6 71,22 72,35 Z" />
          <path strokeWidth="1" d="M 72,35 L 93,0" />
        </svg>

        {/* Oválné podbarvení za flourishem — vlevo nahoře */}
        <div
          className="pointer-events-none absolute -left-16 top-[20%] h-56 w-44 rounded-full"
          style={{ background: 'oklch(0.72 0.06 188)', opacity: 0.16 }}
        />

        {/* Zlatý kaligrafický flourish — vlevo */}
        <svg
          className="pointer-events-none absolute left-6 sm:left-10 top-[28%]"
          width="56" height="84"
          viewBox="0 0 72 108"
          fill="none"
          aria-hidden="true"
          stroke="oklch(0.70 0.13 78)"
          strokeLinecap="round"
          style={{ opacity: 0.55 }}
        >
          <path strokeWidth="1.8" d="M 6,94 C 18,50 42,28 58,38 C 74,48 70,74 52,72 C 34,70 22,48 30,26 C 38,4 64,2 70,22" />
        </svg>

        {/* Měkký přechod do další sekce */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
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
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-foreground">
            Síť prověřených podnikatelek nabízejících masáže, terapie,
            koučink, péči v těhotenství a mnoho dalšího.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/katalog" className={buttonVariants({ size: "lg" })}>
              Procházet katalog
            </Link>
            <Link
              href="/pruvodce"
              className={buttonVariants({ variant: "outline-primary", size: "lg" })}
            >
              Nevím, koho hledám — zeptej se Blaženy
            </Link>
          </div>
          <div className="mt-4">
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
                href={`/katalog?kat=${cat.slug}`}
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

      {/* Poslední z blogu */}
      {posledniClanky.length > 0 && (
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Z blogu</h2>
              <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
                Všechny články →
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {posledniClanky.map((c) => (
                <ClanekCard key={c.id} clanek={c} />
              ))}
            </div>
          </div>
        </section>
      )}

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
