import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { getDictionary } from "@/dictionaries";
import { TranslationProvider } from "@/components/i18n/TranslationProvider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://planif.app";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as "fr" | "en");

  const isFr = lang === "fr";

  const title = dictionary.metadata.title;
  const description = dictionary.metadata.description;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        "fr": "/fr",
        "en": "/en",
      },
    },
    keywords: isFr
      ? ["budget", "trésorerie", "simulation", "compte bancaire", "prévision", "finances personnelles", "gratuit", "sans inscription"]
      : ["budget", "cash flow", "simulation", "bank account", "forecast", "personal finance", "free", "no signup"],
    authors: [{ name: "Planif.app" }],
    creator: "Planif.app",
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${lang}`,
      siteName: "Planif.app",
      locale: isFr ? "fr_FR" : "en_GB",
      type: "website",
      images: [
        {
          url: "/images/card5.png",
          width: 2752,
          height: 1536,
          alt: isFr
            ? "Planif.app — Anticipe le futur de ton compte bancaire"
            : "Planif.app — Anticipate the future of your bank account",
        },
        {
          url: "/images/card6.png",
          width: 2528,
          height: 1696,
          alt: isFr
            ? "Planif.app — Simulation financière en 30 secondes"
            : "Planif.app — Financial simulation in 30 seconds",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/card5.png"],
      creator: "@planifapp",
    },
    icons: {
      icon: [
        { url: "/images/favicon.png", type: "image/png" },
      ],
      apple: "/images/favicon.png",
      shortcut: "/images/favicon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as "fr" | "en");

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TranslationProvider dictionary={dictionary} locale={lang}>
          {children}
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  );
}
