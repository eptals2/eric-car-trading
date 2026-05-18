import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CarDetailsDialog } from "@/components/CarDetailsDialog";
import { PHP } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";
import { ArrowRight, ShieldCheck, Banknote, Wrench } from "lucide-react";

type Car = Tables<"cars">;

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Car | null>(null);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  useEffect(() => {
    supabase.from("cars").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCars(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-white/10 text-white hover:bg-white/15 border-0">Trusted dealership</Badge>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              FIND YOUR<br /><span className="text-primary-foreground/95 [text-shadow:0_0_40px_oklch(0.65_0.24_27_/_0.6)]">DREAM CAR</span> TODAY
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Browse premium vehicles with flexible payment options tailored to your budget. Drive home today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="shadow-[var(--shadow-glow)]">
                <a href="#cars">Browse Cars <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="#why">Why Eric</a>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      </section>

      {/* Why */}
      <section id="why" className="container mx-auto px-4 py-16 grid gap-6 md:grid-cols-3">
        {[
          { icon: Banknote, t: "Flexible Financing", d: "Customize your downpayment and term to fit your monthly budget." },
          { icon: ShieldCheck, t: "Verified Units", d: "Every car undergoes thorough inspection before listing." },
          { icon: Wrench, t: "After-Sales Care", d: "Service support and assistance long after the keys are yours." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="rounded-lg border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-2xl">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      {/* Cars */}
      <section id="cars" className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The Lineup</div>
            <h2 className="font-display text-4xl md:text-5xl">Available Cars</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{cars.length} units</span>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-[380px] animate-pulse bg-muted" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No cars listed yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((c) => (
              <article key={c.id} className="group overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                  )}
                  {c.status === "out_of_stock" && (
                    <Badge variant="destructive" className="absolute top-3 left-3">Out of Stock</Badge>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl">{c.name}</h3>
                  <div className="mt-1 text-2xl font-semibold text-primary">{PHP(Number(c.price))}</div>
                  <Button className="mt-4 w-full" variant="secondary" onClick={() => setSelected(c)}>
                    View Details
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
      <CarDetailsDialog car={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
