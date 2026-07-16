import type { Metadata } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ChemCorp Industries — B2B Chemical Supply",
    template: "%s · ChemCorp Industries",
  },
  description:
    "Order industrial chemicals in bulk from 15 specialty brands and 350+ products. One group, one order desk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
