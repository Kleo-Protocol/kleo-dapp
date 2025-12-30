import './globals.css';
import { AppProvider } from '@/providers/app-provider';
import { QueryClientProviderWrapper } from '@/providers/query-client-provider';
import { Toaster } from '@/shared/ui/sonner';
import { ConditionalLayout } from '@/shared/components/conditional-layout';
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Kleo Protocol - DApp',
  description:
    'Kleo Protocol gives people access to micro loans through trust-based DeFi solutions, no collateral needed.',
};

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning className={figtree.variable}>
      <body>
        <AppProvider>
          <QueryClientProviderWrapper>
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
          </QueryClientProviderWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
