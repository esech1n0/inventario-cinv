import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1e293b",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('cinv-theme') || 'dark';
                var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
                var hoverColor = isDark ? '#1e293b' : '#f1f5f9';
                var meta = document.querySelector('meta[name="theme-color"]');
                if (meta) {
                  meta.setAttribute('content', hoverColor);
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
