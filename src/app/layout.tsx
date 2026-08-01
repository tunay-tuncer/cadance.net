import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Cadance Dashboard",
  description: "Dashboard app designed for Cadance Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>

          {children}

        </AuthProvider>
      </body>
    </html>
  );
}
