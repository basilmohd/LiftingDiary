import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dumbbell } from "lucide-react";
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
  title: "Lifting Diary",
  description: "Track your lifting progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider>
            <header className="flex justify-between items-center p-4 border-b">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Dumbbell className="h-5 w-5" />
                Lifting Diary
              </h1>
              <div className="flex items-center gap-2">
                <Show when="signed-in">
                  <UserButton />
                </Show>
                <ThemeToggle />
              </div>
            </header>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
