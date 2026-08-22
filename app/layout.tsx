import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// ─── Font ─────────────────────────────────────────────────────────────────────
// next/font eliminates CLS by inlining the font-face declaration at build time
// and never making a runtime network request.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "DengueSense LK: Proactive Dengue Surveillance",
    template: "%s | DengueSense LK",
  },
  description:
    "AI-driven dengue surveillance for Sri Lanka. Citizen reporting, MobileNetV3 vector classification, and 4-week LSTM outbreak forecasting.",
  keywords: ["dengue", "surveillance", "Sri Lanka", "AI", "public health"],
  authors: [{ name: "Ministry of Health, DengueSense LK" }],
  openGraph: {
    type: "website",
    title: "DengueSense LK",
    description: "Proactive AI-driven dengue surveillance for Sri Lanka.",
    siteName: "DengueSense LK",
  },
  twitter: {
    card: "summary",
    title: "DengueSense LK",
  },
};

// ─── Root Layout (Server Component) ──────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
