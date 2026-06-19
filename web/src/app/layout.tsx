import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = {
  variable: "font-sans",
};

const geistMono = {
  variable: "font-mono",
};

export const metadata: Metadata = {
  title: "TaxCompute.in | Premium Indian Income Tax Computation Portal",
  description: "Calculate, optimize, and generate professional Income Tax Computation reports under the latest Old and New Tax Regimes (u/s 115BAC) for Indian Assessees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
