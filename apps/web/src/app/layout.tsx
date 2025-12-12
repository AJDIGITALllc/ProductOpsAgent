import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProductOpsAgent',
  description: 'Chat-based product management for Whop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <nav className="bg-gray-900 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-xl font-bold">
                  ProductOpsAgent
                </Link>
                <div className="flex gap-6">
                  <Link href="/dashboard" className="hover:text-gray-300">
                    Dashboard
                  </Link>
                  <Link href="/builder" className="hover:text-gray-300">
                    Builder
                  </Link>
                  <Link href="/templates" className="hover:text-gray-300">
                    Templates
                  </Link>
                  <Link href="/products" className="hover:text-gray-300">
                    Products
                  </Link>
                  <Link href="/settings" className="hover:text-gray-300">
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm">
            ProductOpsAgent MVP - Whop Admin Tool
          </footer>
        </div>
      </body>
    </html>
  );
}
