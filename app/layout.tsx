import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LoreWeaver | World-Building Canvas",
  description: "LoreWeaver — a spatial canvas for fantasy and dark romance authors to craft their worlds, track characters, and weave storylines.",
  applicationName: "LoreWeaver",
  authors: [{ name: "LoreWeaver" }],
  keywords: ["world building", "writing", "fantasy", "dark romance", "character tracking", "story canvas"],
  openGraph: {
    title: "LoreWeaver | World-Building Canvas",
    description: "A spatial workspace for fantasy and dark romance authors to craft their worlds.",
    type: "website",
  },
};

import { AuthProvider } from "@/hooks/useAuth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${playfair.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
