import type { Metadata } from 'next';

import { nbArchitekt, timesNewRoman } from '@/fonts';
import { universeFontVariables } from '@/fonts/universes';
import Providers from '@/components/providers';
import { SITE_NAME } from '@/config';
import './globals.css';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_NAME,
};

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${nbArchitekt.variable} ${timesNewRoman.variable} ${universeFontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}