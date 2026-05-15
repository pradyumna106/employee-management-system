import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

// Initialize fonts (make sure these match what you currently have)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "WorkFlow EMS",
  description: "Employee Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning here to ignore extension injections on html
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable}`}
        // Add suppressHydrationWarning here to ignore Grammarly injections on body
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}