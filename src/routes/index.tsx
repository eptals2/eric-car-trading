import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CarDetailsDialog } from "@/components/CarDetailsDialog";
import { PHP } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";
import { ArrowRight, ShieldCheck, Banknote, Wrench, Search } from "lucide-react";

import heroCars from "@/assets/hero-cars.png";

type Car = Tables<"cars">;

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Car | null>(null);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("price_asc");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 9;

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
        id="hero"
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-no-repeat bg-bottom bg-cover opacity-30 md:opacity-40 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url(${heroCars})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-white/10 text-white hover:bg-white/15 border-0">Trusted dealership</Badge>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
              GET YOUR<br /><span className="text-primary-foreground/95 [text-shadow:0_0_40px_oklch(0.65_0.24_27_/_0.6)]">DREAM CAR</span> TODAY
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Browse premium vehicles with flexible payment options tailored to your budget. Drive home today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="shadow-[var(--shadow-glow)]">
                <a href="#cars">Get now<ArrowRight className="ml-2 h-4 w-4" /></a>
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
            <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="newest">Newest</SelectItem> */}
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(() => {
          const sortedCars = [...cars].sort((a, b) => {
            if (sort === "price_asc") return Number(a.price) - Number(b.price);
            if (sort === "price_desc") return Number(b.price) - Number(a.price);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          const totalPages = Math.max(1, Math.ceil(sortedCars.length / ITEMS_PER_PAGE));
          const currentPage = Math.min(page, totalPages);
          const paginatedCars = sortedCars.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

          return (
            <>
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="h-[380px] animate-pulse bg-muted" />
                  ))}
                </div>
              ) : cars.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No cars listed yet.</p>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedCars.map((c) => (
                      <article key={c.id} className="group overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          {(() => {
                            const imgs = (c.images && c.images.length > 0) ? c.images : (c.image_url ? [c.image_url] : []);
                            if (imgs.length === 0) {
                              return <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>;
                            }
                            if (imgs.length === 1) {
                              return <img src={imgs[0]} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />;
                            }
                            return (
                              <Carousel className="h-full w-full" opts={{ loop: true }}>
                                <CarouselContent className="h-full ml-0">
                                  {imgs.map((src, i) => (
                                    <CarouselItem key={i} className="pl-0 h-full">
                                      <img src={src} alt={`${c.name} ${i + 1}`} className="h-full w-full aspect-[4/3] object-cover" loading="lazy" />
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                                <div className="absolute bottom-2 right-2 rounded bg-black/60 text-white text-xs px-2 py-0.5">{imgs.length} photos</div>
                              </Carousel>
                            );
                          })()}
                          {c.status === "out_of_stock" && (
                            <Badge variant="destructive" className="absolute top-3 left-3 z-10">Out of Stock</Badge>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="font-display text-xl">{c.name}</h3>
                          <div className="mt-1 text-2xl font-semibold text-primary">{PHP(Number(c.price))}</div>
                          <Button className="mt-4 w-full" variant="secondary" onClick={() => setSelected(c)}>
                            Get this
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#cars"
                              onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#cars"
                                onClick={(e) => { e.preventDefault(); setPage(p); }}
                                isActive={p === currentPage}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#cars"
                              onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </section>

      <section id="contact">
        <SiteFooter/>
      </section>
      <CarDetailsDialog car={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
