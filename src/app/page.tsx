import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { createClient } from "@/lib/supabase/server";
import { ClanekCard, type ClanekCardData } from "@/app/blog/clanek-card";
import { BookOpen } from "lucide-react";

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
        className="relative overflow-hidden -mt-16 pt-40 pb-12 px-4 sm:pt-32 sm:pb-16 sm:px-6"
        style={{ background: 'radial-gradient(circle at 95% 0%, oklch(0.91 0.038 14) 0%, oklch(0.988 0.006 75) 48%)' }}
      >
        {/* Měkký přechod do další sekce */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-6xl font-bold leading-tight tracking-tight text-primary sm:text-7xl lg:text-8xl">
            Najdi si svou
            <br />
            <span className="sr-only">terapeutku, koučku nebo průvodkyni</span>
            <span aria-hidden="true"><TypewriterText /></span>
          </h1>
          <div className="mx-auto mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-accent" />
            <span className="text-[11px] font-medium tracking-widest text-accent uppercase whitespace-nowrap sm:text-base">
              Osobně prověřeny námi i klientkami
            </span>
            <span className="h-px w-12 bg-accent" />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-lg font-light text-foreground">
            Síť prověřených žen nabízejících <em>masáže</em>, <em>terapie</em>,{' '}
            <em>koučink</em>, <em>péči v těhotenství</em> a mnoho dalšího.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/katalog" className={buttonVariants({ size: "lg" })}>
              <BookOpen className="mr-1.5 size-4" />
              Projdi si katalog sama
            </Link>
            <Link
              href="/pruvodce"
              className={buttonVariants({ variant: "outline-primary", size: "lg" })}
            >
              Průvodce: když nevíš, co hledáš
            </Link>
          </div>
        </div>
      </section>

      {/* Zeptej se Blaženy */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        {/* Mobil — beze změny, původní obrázek s velkým průhledným plátnem */}
        <div
          className="pointer-events-none absolute inset-0 bg-[length:170%_auto] bg-no-repeat bg-right-bottom sm:hidden"
          style={{ backgroundImage: "url('/images/blazena-pozadi.png')" }}
          aria-hidden="true"
        />
        {/* Desktop — oříznutá verze (jen postava), výrazně větší, blíž textu */}
        <div
          className="pointer-events-none absolute inset-0 hidden bg-[length:min(34vw,480px)_auto] bg-no-repeat bg-right sm:block"
          style={{ backgroundImage: "url('/images/blazena-pozadi-desktop.png')" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <img src="/icons/icon-message_2.svg" alt="" className="mx-auto h-[120px] w-[120px] sm:h-24 sm:w-24" />
          <p className="mt-5 text-lg font-semibold text-foreground">
            Cítíš, že už to takhle dál nejde?!
          </p>
          <p className="mt-5 text-lg font-light text-foreground">
            Někdy přesně víš, co potřebuješ.
            <br />
            Ale mnohem častěji ne.
          </p>
          <p className="mt-3 text-lg font-light text-foreground">
            Nemáš komu zavolat.
            <br />
            Nevíš, co ti pomůže.
          </p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            Už nemáš sílu zkoušet jednu techniku za druhou.
          </p>
          <p className="mt-3 text-lg font-light text-foreground">
            Hledáš pomoc a nepotřebuješ
            <br />
            další slepou uličku.
          </p>
          <Link href="/pruvodce" className={buttonVariants({ size: "lg" }) + " mt-8"}>
            Zeptej se Blažené
          </Link>
          <p className="mt-2 mb-[30px] text-center text-xs font-medium text-accent">
            Upřesni jí, co tě trápí.
            <br />
            Pomůže ti najít odbornici, která ti bude nejblíž.
          </p>
        </div>
      </section>

      {/* Kategorie */}
      <section className="px-4 py-20 sm:px-6">
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
