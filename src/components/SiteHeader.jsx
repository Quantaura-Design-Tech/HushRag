'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

function HushRagMark() {
  return (
    <span className="hr-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

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
        <a className="hr-brand" href="/" aria-label="HushRag home">
          <HushRagMark />
          <span>HushRag</span>
        </a>

        <nav className="hr-navlinks">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={activePath === item.href.split('#')[0] && item.label === 'About' ? 'is-active' : ''}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hr-nav-actions">
          <a className="hr-nav-signin" href="/login">
            Sign in
          </a>
          <Button className="hr-btn hr-btn-primary" type="button" onClick={() => openAuth(true)}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
