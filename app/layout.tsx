import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";





const ordinary = localFont({
  src: [
    {
      path: "./fonts/Ordinary-Bold.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Ordinary-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Ordinary-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
  ],
  variable: "--font-ordinary",
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
        className={`${ordinary.variable} font-sans bg-paper-white text-black antialiased selection:bg-solar-yellow selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
