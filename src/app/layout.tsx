import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const livvic = localFont({
  variable: "--font-livvic",
  src: [
    { path: "../../fonts/Livvic/Livvic-Light.ttf",          weight: "300", style: "normal" },
    { path: "../../fonts/Livvic/Livvic-LightItalic.ttf",    weight: "300", style: "italic" },
    { path: "../../fonts/Livvic/Livvic-Regular.ttf",         weight: "400", style: "normal" },
    { path: "../../fonts/Livvic/Livvic-Italic.ttf",          weight: "400", style: "italic" },
    { path: "../../fonts/Livvic/Livvic-Medium.ttf",          weight: "500", style: "normal" },
    { path: "../../fonts/Livvic/Livvic-MediumItalic.ttf",   weight: "500", style: "italic" },
    { path: "../../fonts/Livvic/Livvic-SemiBold.ttf",       weight: "600", style: "normal" },
    { path: "../../fonts/Livvic/Livvic-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../../fonts/Livvic/Livvic-Bold.ttf",            weight: "700", style: "normal" },
    { path: "../../fonts/Livvic/Livvic-BoldItalic.ttf",     weight: "700", style: "italic" },
  ],
});

const thasadith = localFont({
  variable: "--font-thasadith",
  src: [
    { path: "../../fonts/Thasadith/Thasadith-Regular.ttf",       weight: "400", style: "normal" },
    { path: "../../fonts/Thasadith/Thasadith-Italic.ttf",        weight: "400", style: "italic" },
    { path: "../../fonts/Thasadith/Thasadith-Bold.ttf",          weight: "700", style: "normal" },
    { path: "../../fonts/Thasadith/Thasadith-BoldItalic.ttf",    weight: "700", style: "italic" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://katalog-woad.vercel.app"),
  title: "jsem Blažená",
  description: "Síť prověřených podnikatelek ve službách — masáže, terapie, koučink, péče v těhotenství a další.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${livvic.variable} ${thasadith.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
    </html>
  );
}
