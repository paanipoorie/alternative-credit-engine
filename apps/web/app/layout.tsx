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
        <header className="sticky top-0 z-40 border-b border-[#DDE3E0] bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F4E8C] text-white font-bold text-sm tracking-wider">
                TVS
              </div>
              <div>
                <span className="text-base font-bold text-[#1F4E8C] tracking-tight">
                  TVS CREDIT
                </span>
                <span className="mx-2 text-[#858585]">|</span>
                <span className="text-sm font-semibold text-[#5F6368]">
                  Alternative Credit Engine
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center rounded-full bg-[#E8F6EE] px-3 py-1 text-xs font-semibold text-[#08783B]">
                E.P.I.C. Case Study Prototype
              </span>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
