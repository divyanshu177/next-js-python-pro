import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedConnect AI - Smart Medical Bookings & Symptom Analysis",
  description: "Book doctors, check symptoms, summarize clinical health reports, and manage appointment slots seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col mesh-gradient antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
