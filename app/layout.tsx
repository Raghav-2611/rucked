import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'rucked • Personal Thought Log',
  description: 'A minimal, private WhatsApp-style personal journal and knowledge log.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-[#111B21]">
      <body className={`${inter.className} h-full w-full overflow-hidden text-[#E9EDEF] bg-[#111B21] antialiased`}>
        {children}
      </body>
    </html>
  );
}
