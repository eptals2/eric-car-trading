import { Link } from "@tanstack/react-router";
import { Car } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide">ERIC CAR TRADING</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Drive your dream</div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {/* <Link to="/" className="px-3 py-2 text-foreground/80 hover:text-primary">Browse</Link> */}
          {/* <Link to="/admin" className="px-3 py-2 text-foreground/80 hover:text-primary">Admin</Link> */}
        </nav>
      </div>
    </header>
  );
}
