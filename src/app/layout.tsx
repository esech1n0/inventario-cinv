import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const baseUrl = process.env.NEXTAUTH_URL
  ? process.env.NEXTAUTH_URL
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Inventario CINV | Sistema de Gestión y Control de Materiales",
  description:
    "Sistema de inventario, administración dinámica de módulos, control de stock unitario y empaquetado, y trazabilidad de consumo para eventos e integrantes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inventario CINV",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/images/logo-cinv.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logo-cinv.png" },
    ],
  },
  openGraph: {
    title: "Inventario CINV | Sistema de Gestión y Control de Materiales",
    description:
      "Sistema de inventario, administración de módulos y control de materiales CINV",
    siteName: "Inventario CINV",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Inventario CINV",
      },
      {
        url: "/images/logo-cinv.png",
        width: 512,
        height: 512,
        alt: "Logo Inventario CINV",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inventario CINV | Sistema de Gestión y Control de Materiales",
    description: "Sistema de inventario y control de materiales CINV",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
