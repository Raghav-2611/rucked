import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@livekit/components-styles';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'rucked • Personal Thought Log',
  description: 'A minimal, private WhatsApp-style personal journal and knowledge log.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#111B21]" style={{ height: '100dvh' }}>
      <body className={`${inter.className} w-full overflow-hidden text-[#E9EDEF] bg-[#111B21] antialiased`} style={{ height: '100dvh' }}>
        {children}
      </body>
    </html>
  );
}
