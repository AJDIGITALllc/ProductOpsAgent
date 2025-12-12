import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProductOpsAgent - Admin UI',
  description: 'Chat-based product builder for Whop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
