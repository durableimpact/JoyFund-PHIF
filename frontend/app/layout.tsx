import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JoyFund – Celebrate Life. Give the Gift of Health.",
  description:
    "Turn birthdays, weddings, graduations, and milestones into healthcare support for someone who needs it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
