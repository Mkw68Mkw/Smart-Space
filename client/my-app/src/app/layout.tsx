import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google'
import "./globals.css";
import { Toaster } from "sonner";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  fallback: ['system-ui', 'arial']
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '700'],
  fallback: ['monospace']
})

export const metadata: Metadata = {
  title: "SmartSpace",
  description: "Book your space with SmartSpace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${jetbrains.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
