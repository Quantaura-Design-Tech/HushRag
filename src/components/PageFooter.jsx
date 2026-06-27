'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HushRagLogo from '@/components/HushRagLogo';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Integrations', href: '#integrations' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'HR Policies', href: '#how-it-works' },
      { label: 'IT Support', href: '#how-it-works' },
      { label: 'Benefits & PTO', href: '#how-it-works' },
      { label: 'Employee Onboarding', href: '#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: 'mailto:contact@quantaura.in' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'GitHub', href: 'https://github.com/Quantaura-Design-Tech/HushRag' },
    ],
  },
];

export default function PageFooter() {
  const openAuth = () => {
    window.location.href = '/login?signup=true';
  };

  return (
    <>
      <section className="hr-final-cta">
        <div className="hr-final-cta-inner">
          <span className="hr-final-cta-eyebrow">
            <Lock size={14} /> Zero-Knowledge by default
          </span>
          <h2>Private RAG without giving up your documents.</h2>
          <p>
            Connect your own database, run embeddings in the browser, and keep every answer
            inside your team. Free to use, your data stays yours.
          </p>
          <div className="hr-final-cta-actions">
            <Button
              className="hr-btn hr-btn-primary hr-btn-large"
              type="button"
              onClick={openAuth}
            >
              Get Started <ArrowRight size={18} />
            </Button>
          </div>
          <div className="hr-final-cta-trust">
            <span>BYO database</span>
            <span>Always free</span>
            <span>AES-256 at rest</span>
          </div>
        </div>
      </section>

      <footer className="hr-footer-section">
        <div className="hr-footer-top">
          <Link className="hr-brand" href="/" aria-label="HushRag home">
            <HushRagLogo />
          </Link>
        </div>

        <div className="hr-footer-grid">
          {FOOTER_COLUMNS.map((col) => (
            <div className="hr-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hr-footer-bottom">
          <span>© {new Date().getFullYear()} Quantaura Design Tech. All rights reserved.</span>
          <span>Built with privacy in mind.</span>
        </div>
      </footer>
    </>
  );
}
