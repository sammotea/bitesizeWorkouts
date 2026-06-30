import type { Metadata } from "next";
import { Gabarito, Familjen_Grotesk } from "next/font/google";
import Link from "next/link";
import HomeLink from "@/components/HomeLink";
import "./globals.css";

const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  weight: ["500", "900"],
});

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bitesize Workouts",
  description: "A personal workout generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${gabarito.variable} ${familjen.variable}`}>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-16 pt-6">
          <header className="flex items-center justify-between border-b-[6px] border-mint pb-6 text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
            <HomeLink className="hover:text-charcoal" />
            <nav className="flex gap-4">
              <Link href="/history" className="hover:text-charcoal">
                History
              </Link>
              <Link href="/exercises" className="hover:text-charcoal">
                Library
              </Link>
            </nav>
          </header>
          <main className="flex-1 pt-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
