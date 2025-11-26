import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const giniloh = localFont({
  src: "./fonts/Giniloh-Bold.woff2",
  variable: "--font-giniloh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saffi - L'attente. Réinventée.",
  description: "Transformez votre salle d'attente avec Saffi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={`${bricolage.variable} ${giniloh.variable} ${inter.variable} font-sans bg-paper-white text-black antialiased selection:bg-solar-yellow selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
