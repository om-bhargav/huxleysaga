import type { Metadata } from 'next';

import { nbArchitekt, timesNewRoman } from '@/fonts';
import Providers from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Huxley Saga',
  description: 'Huxley Saga',
};

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${nbArchitekt.variable} ${timesNewRoman.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}