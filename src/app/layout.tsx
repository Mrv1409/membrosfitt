import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import AuthProvider from "@/contexts/AuthContexts";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MembrosFit",
  description: "Seu PersoNutri Digital",
  manifest: "/manifest.json",
  themeColor: "#00FF8B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MembrosFit",
  },
  applicationName: "MembrosFit",
  keywords: ["fitness", "treino", "nutrição", "academia", "saúde"],
  authors: [{ name: "MembrosFit" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/images/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Meta Tags PWA */}
        <meta name="application-name" content="MembrosFit" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MembrosFit" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/images/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/images/icon-512x512.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon-16x16.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('✅ Service Worker registrado com sucesso:', registration.scope);
                  },
                  function(err) {
                    console.log('❌ Falha ao registrar Service Worker:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}