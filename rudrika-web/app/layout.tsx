import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getUser } from "@/lib/auth";
import { getStore } from "@/lib/settings";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Rudrika by Tara | Handloom and silk sarees", template: "%s | Rudrika by Tara" },
  description:
    "Rudrika is a thoughtful fashion brand celebrating India's cultural heritage through sarees. Handloom, Banarasi, Tussar, linen and cotton sarees, ethically sourced, curated in Kochi.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, store, categories] = await Promise.all([
    getUser(),
    getStore(),
    db.category
      .findMany({ where: { enabled: true }, orderBy: { sort: "asc" }, select: { name: true, slug: true } })
      .catch(() => []),
  ]);
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header
            user={user ? { name: user.name, role: user.role } : null}
            logo={store.logo}
            announcements={store.announcements}
            categories={categories}
          />
          <main className="min-h-[70vh]">{children}</main>
          <Footer store={store} />
          <MobileNav />
          <WhatsAppFloat number={store.whatsapp} />
        </CartProvider>
      </body>
    </html>
  );
}
