import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FortiAnalis — WAF Log Analyzer',
  description:
    'Analisa log FortiWeb WAF secara instan dengan AI Security Insight dan export laporan PDF harian, mingguan, atau bulanan.',
  keywords: ['FortiWeb', 'WAF', 'Log Analyzer', 'Security', 'AI Insight'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
