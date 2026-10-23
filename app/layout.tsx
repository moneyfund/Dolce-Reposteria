import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./storefront-refresh.css";
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], display: "swap" });
export const metadata: Metadata = {
  title: { default: "DOLCE | Momentos que saben mejor", template: "%s · DOLCE" },
  description: "Descubre pasteles artesanales, postres y detalles dulces. Explora el catálogo y realiza tu pedido en línea.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={sans.variable + " " + display.variable}>{children}</body></html>;
}
