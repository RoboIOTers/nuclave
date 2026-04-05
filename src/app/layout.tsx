import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nuclave — Collective Intelligence Platform',
  description:
    'Where groups think together and AI surfaces what matters. Structured collaborative brainstorming for teams that build things.',
  keywords: ['brainstorming', 'collaboration', 'collective intelligence', 'decision making', 'open source'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans grain">{children}</body>
    </html>
  );
}
