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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0F1113] text-[#F3F5F4] antialiased selection:bg-[#3D78C2]/30 selection:text-[#F3F5F4]">
        <main>{children}</main>
      </body>
    </html>
  );
}
