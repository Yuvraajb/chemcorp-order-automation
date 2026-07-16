"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Menu, X, FlaskConical } from "lucide-react";
import { useCart } from "./cart-context";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/brands", label: "Our Brands" },
  { href: "/products", label: "Products" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ChemCorp Industries home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-heading">
            <span className="block text-base font-bold leading-tight text-primary">
              ChemCorp Industries
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              B2B Chemical Supply
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? "bg-accent-light text-accent-dark"
                    : "text-primary-light hover:bg-muted-bg hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-primary transition-colors duration-200 hover:bg-muted-bg"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-primary hover:bg-muted-bg md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-surface px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-primary-light hover:bg-muted-bg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
