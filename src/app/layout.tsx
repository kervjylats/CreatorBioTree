/**
 * Root layout — platform chrome for the whole app (PWA #1).
 * Sets global CSS (globals.css), the TooltipProvider wrapper, and a static
 * themeColor. Fan shells (/[username]) are NOT branded here — creators
 * style their own pages.
 */
import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { TooltipProvider } from "@/components/ui/tooltip"
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister"

export const metadata: Metadata = {
  title: 'BioTree Platform',
  description: 'Premium PWA SaaS platform for creators',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#F7F5F0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen-safe">
        <TooltipProvider>
          <ServiceWorkerRegister />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
