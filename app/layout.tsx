import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Game Point — Where Gamers Connect",
  description:
    "Game Point is a social platform for gamers: build a profile, find players who play what you play, battle, chat, and share your wins.",
  openGraph: {
    title: "Game Point",
    description: "Play. Connect. Challenge. Share.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-white">
        <Navigation />
        <main className="md:pl-24 pb-24 md:pb-8">{children}</main>
      </body>
    </html>
  );
}
