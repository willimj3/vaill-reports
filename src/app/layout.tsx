import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "VAILL Reports Archive",
  description: "Vanderbilt AI Law Lab - Monthly and Quarterly Reports Archive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Main content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-400">
            Vanderbilt AI Law Lab · Vanderbilt University Law School
          </div>
        </footer>
      </body>
    </html>
  );
}
