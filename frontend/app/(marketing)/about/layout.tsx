import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About JoyFund",
  description:
    "Learn how JoyFund uses the Njangi solidarity system to turn birthday, wedding, and graduation celebrations into maternal healthcare for vulnerable women in Cameroon.",
  openGraph: {
    title: "About JoyFund",
    description:
      "Learn how JoyFund uses the Njangi solidarity system to provide maternal healthcare across Cameroon.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
