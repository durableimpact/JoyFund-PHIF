import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Register for a free JoyFund account and start supporting maternal healthcare campaigns in Cameroon.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
