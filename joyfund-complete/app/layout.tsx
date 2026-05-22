import type { Metadata } from 'next';
import './globals.css';
import Toast from '@/components/shared/Toast';
import ClientHydrator from '@/components/ClientHydrator';

export const metadata: Metadata = {
  title: 'JoyFund — Your Joy, Their Care',
  description: 'Turning celebrations into maternal healthcare for vulnerable women in Cameroon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientHydrator />
        {children}
        <Toast />
      </body>
    </html>
  );
}
