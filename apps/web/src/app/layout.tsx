import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Krontech',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
