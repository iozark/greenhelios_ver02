import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const metaEn: Metadata = {
  title: "GreenHelios — Property management platform",
  description:
    "Manage your portfolio with GreenHelios. Track properties, income, expenses, and reports — all in one place.",
  keywords: [
    "GreenHelios",
    "real estate",
    "property management",
    "rentals",
    "portfolio",
  ],
  authors: [{ name: "GreenHelios" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "GreenHelios — Property management platform",
    description:
      "Manage your portfolio with GreenHelios. Track properties, income, expenses, and reports — all in one place.",
    type: "website",
  },
};

const metaEl: Metadata = {
  title: "GreenHelios — Πλατφόρμα διαχείρισης ακινήτων",
  description:
    "Διαχειριστείτε το χαρτοφυλάκιό σας με το GreenHelios. Παρακολούθηση ακινήτων, εσόδων, εξόδων και αναφορές — όλα σε ένα μέρος.",
  keywords: [
    "GreenHelios",
    "ακίνητα",
    "διαχείριση ακινήτων",
    "ενοίκια",
    "χαρτοφυλάκιο",
  ],
  authors: [{ name: "GreenHelios" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "GreenHelios — Πλατφόρμα διαχείρισης ακινήτων",
    description:
      "Διαχειριστείτε το χαρτοφυλάκιό σας με το GreenHelios. Παρακολούθηση ακινήτων, εσόδων, εξόδων και αναφορές — όλα σε ένα μέρος.",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "en" ? metaEn : metaEl;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
