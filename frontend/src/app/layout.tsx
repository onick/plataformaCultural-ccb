import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ErrorLogger } from "@/components/debug/ErrorLogger";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Centro Cultural Banreservas - Gestión de Visitantes",
  description: "Sistema integral de gestión de visitantes y eventos culturales",
  keywords: ["centro cultural", "eventos", "reservas", "cultura", "banreservas"],
  authors: [{ name: "CCB Development Team" }],
  openGraph: {
    title: "Centro Cultural Banreservas",
    description: "Descubre y reserva eventos culturales únicos",
    url: "https://cultural.banreservas.com",
    siteName: "Centro Cultural Banreservas",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Centro Cultural Banreservas",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centro Cultural Banreservas",
    description: "Descubre y reserva eventos culturales únicos",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              {children}
            </div>
            <Toaster />
            <ErrorLogger />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
