import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Locaria",
  description: "Il tuo passaporto digitale per esplorare il mondo. Scopri nazioni, città e luoghi, traccia i tuoi viaggi e contribuisci a un catalogo geografico collaborativo in continua espansione.",
  manifest: "/manifest.json", // <--- AGGIUNGI QUESTA RIGA
  icons: {
    icon: "/favicon.ico", // L'icona della scheda del browser
    apple: "/android-chrome-512x512.png", // L'icona per chi usa iPhone/Safari
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
