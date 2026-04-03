import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from '../lib/theme-provider';

export const metadata: Metadata = {
  title: "Golf Pool",
  description: "A golf pool app built with Next.js and Tailwind CSS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

