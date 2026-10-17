import type { Metadata } from 'next';
import Link from 'next/link';
import { product } from '@/core/config/product';
import './globals.css';
export const metadata: Metadata = {
  title: { default: product.name, template: `%s · ${product.name}` },
  description: product.description,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main">
          Skip to content
        </a>
        <header className="siteHeader">
          <Link
            href="/catalog"
            className="brand"
            aria-label={`${product.name} — home`}
          >
            <span aria-hidden="true" className="brandMark">
              o.
            </span>
            {product.name}
            <span className="brandPeriod">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/catalog">
              Collection <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="siteFooter">
          <span>
            {product.name}
            <span className="brandPeriod">.</span>
          </span>
          <p>Good things. Everyday.</p>
          <a href="#main">Back to top ↑</a>
        </footer>
      </body>
    </html>
  );
}
