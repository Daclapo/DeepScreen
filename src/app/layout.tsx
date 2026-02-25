import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeepScreen',
  description: 'Enhanced movie and series analytics platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
