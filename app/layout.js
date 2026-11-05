import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { GlobalProgressProvider } from '@/components/common/GlobalProgressProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'VoteSphere — Simple. Secure. Shareable Voting.',
  description:
    'Modern, secure, and shareable online voting platform for organizations, schools, societies, and teams.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <GlobalProgressProvider>
          <AuthProvider>{children}</AuthProvider>
        </GlobalProgressProvider>
      </body>
    </html>
  );
}
