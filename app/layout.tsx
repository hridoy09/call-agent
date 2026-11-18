import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guava · Voice desk',
  description: 'Test your customer intake voice assistant with a real call.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
