import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <FlaskConical className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-bold text-white">ChemCorp Industries</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            A unified group of 15 specialty chemical brands supplying industry across India.
            Bulk B2B ordering, consistent quality, dependable logistics.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/brands" className="transition-colors hover:text-white">Our Brands</Link></li>
            <li><Link href="/products" className="transition-colors hover:text-white">Product Catalog</Link></li>
            <li><Link href="/cart" className="transition-colors hover:text-white">Cart</Link></li>
            <li><Link href="/admin" className="transition-colors hover:text-white">Admin Dashboard</Link></li>
          </ul>
        </nav>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Order Desk</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li>Mon–Sat, 9:00–18:00 IST</li>
            <li>orders@chemcorp.example</li>
            <li>+91 00000 00000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6">
          © {new Date().getFullYear()} ChemCorp Industries (placeholder). All product names and images are placeholders pending the final catalog.
        </p>
      </div>
    </footer>
  );
}
