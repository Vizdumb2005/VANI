import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAANI - Sovereign Operations Command Dashboard",
  description:
    "Voice-to-Network Aggregated National Intelligence - Operational DPI Platform",
  icons: {
    icon: "/vaani-icon.svg",
    shortcut: "/vaani-icon.svg",
    apple: "/vaani-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/vaani-icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="bg-canvas text-charcoal font-sans antialiased selection:bg-pastel-blue selection:text-pastel-blue-text min-h-screen">
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
