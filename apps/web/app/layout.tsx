import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alternative Credit Engine | TVS Credit E.P.I.C.',
  description: 'Evidence-first alternative credit assessment system for the invisible customer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F9F8] text-[#222222] antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
