import type { Metadata } from 'next';
import './globals.css';
import Toast from '@/components/shared/Toast';
import ClientHydrator from '@/components/ClientHydrator';

export const metadata: Metadata = {
  title: 'JoyFund — Your Joy Saves Lives',
  description: 'Turning celebrations into maternal healthcare for vulnerable women in Cameroon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning suppressContentEditableWarning>
      <body suppressHydrationWarning suppressContentEditableWarning>
        <ClientHydrator />
        {children}
        <Toast />
      </body>
    </html>
  );
}
