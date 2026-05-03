export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary text-secondary-foreground">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl">ERIC CAR TRADING</h3>
          <p className="mt-2 text-sm text-secondary-foreground/70">Quality vehicles. Honest deals. Flexible financing.</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-primary">Visit Us</h4>
          <p className="mt-2 text-sm text-secondary-foreground/70">Showroom open Mon–Sat<br />9:00 AM – 6:00 PM</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</h4>
          <p className="mt-2 text-sm text-secondary-foreground/70">+63 900 000 0000<br />hello@ericcartrading.com</p>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/10 py-4 text-center text-xs text-secondary-foreground/50">
        © {new Date().getFullYear()} Eric Car Trading. All rights reserved.
      </div>
    </footer>
  );
}
