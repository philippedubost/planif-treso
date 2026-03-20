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
          url: "/images/card1.png",
          width: 473,
          height: 316,
          alt: isFr
            ? "Planif.app — Anticipe le futur de ton compte bancaire"
            : "Planif.app — Anticipate the future of your bank account",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/card1.png"],
      creator: "@planifapp",
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.ico",       sizes: "any" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      other: [
        { rel: "mask-icon", url: "/favicon-32x32.png", color: "#18181b" },
        { rel: "manifest", url: "/site.webmanifest" },
        { rel: "msapplication-TileImage", url: "/mstile-150x150.png" },
      ],
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
