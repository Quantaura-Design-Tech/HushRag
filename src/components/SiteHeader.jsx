'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HushRagLogo from '@/components/HushRagLogo';

const navItems = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Integrations', href: '/#integrations' },
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function SiteHeader({ activePath = '/' }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && activePath === '/') {
      window.location.href = '/dashboard';
    }
  }, [activePath]);

  const openAuth = (signup) => {
    window.location.href = signup ? '/login?signup=true' : '/login';
  };

  return (
    <header className="hr-nav-shell" aria-label="Primary navigation">
      <div className="hr-nav">
        <Link className="hr-brand" href="/" aria-label="HushRag home">
          <HushRagLogo />
        </Link>

        <nav className="hr-navlinks">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={activePath === item.href.split('#')[0] && item.label === 'About' ? 'is-active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hr-nav-actions">
          <Link className="hr-nav-signin" href="/login">
            Sign in
          </Link>
          <Button className="hr-btn hr-btn-primary" type="button" onClick={() => openAuth(true)}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
