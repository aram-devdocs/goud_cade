import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arcade Simulator',
  description: 'A retro arcade experience in 3D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
    </html>
  );
}

