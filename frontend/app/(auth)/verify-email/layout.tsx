import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
  description:
    "Enter the verification code sent to your email to activate your JoyFund account.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
