import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeJudge - LLM Assessment Platform",
  description: "Compare and evaluate LLM-generated code responses side by side",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />

          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>

          <footer className="border-t border-border px-6 py-6">
            <div className="mx-auto flex max-w-7xl items-center justify-center text-xs text-gray-500">
              <span>CodeJudge Assessment Platform</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
