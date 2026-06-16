'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Database,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const navItems = ['Features', 'How It Works', 'Integrations', 'Security', 'Pricing', 'Docs'];



const featureCards = [
  {
    icon: Lock,
    title: 'Zero-Knowledge',
    body: 'Your data stays in your environment. Always.',
  },
  {
    icon: Database,
    title: 'BYODB',
    body: 'Connect your own Turso, SQLite, Supabase or MongoDB.',
  },
  {
    icon: Sparkles,
    title: 'Client-Side AI',
    body: 'Embeddings happen in the browser using WASM models.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    body: 'AES-256 encryption, end-to-end.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel',
    body: 'Web, Telegram, WhatsApp and more.',
  },
  {
    icon: BarChart3,
    title: 'Audit & Logs',
    body: '7-day chat logs for audit and compliance.',
  },
];

function HushRagMark() {
  return (
    <span className="hr-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function LandingAndAuthPage() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  const openAuth = (loginMode) => {
    if (loginMode) {
      window.location.href = '/login';
    } else {
      window.location.href = '/login?signup=true';
    }
  };

  return (
    <main className="hr-page">


      <header className="hr-nav" aria-label="Primary navigation">
        <a className="hr-brand" href="#" aria-label="HushRag home">
          <HushRagMark />
          <span>HushRag</span>
        </a>

        <nav className="hr-navlinks">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`}>
              {item}
            </a>
          ))}
        </nav>

        <div className="hr-nav-actions">
          <Button className="hr-btn hr-btn-outline" type="button" onClick={() => openAuth(true)}>
            Book a Demo
          </Button>
          <Button className="hr-btn hr-btn-primary" type="button" onClick={() => openAuth(false)}>
            Start Free Trial
          </Button>
        </div>
      </header>

      <section className="hr-hero" id="how-it-works">
        <div className="hr-hero-copy">
          <div className="hr-eyebrow">
            <Lock size={14} />
            Zero-Knowledge RAG Platform
          </div>

          <h1>
            Instant answers.
            <br />
            Happier teams.
            <br />
            <em>Private</em> by default.
          </h1>

          <p>
            HushRag lets your team ask questions and get accurate answers from internal
            docs-without risking privacy.
          </p>

          <div className="hr-hero-actions">
            <Button className="hr-btn hr-btn-primary hr-btn-large" type="button" onClick={() => openAuth(false)}>
              Start Free Trial <ArrowRight size={18} />
            </Button>
            <Button className="hr-btn hr-btn-outline hr-btn-large" type="button" onClick={() => openAuth(true)}>
              Try in Playground
            </Button>
          </div>
        </div>

        <div className="hr-hero-visual" aria-label="HushRag security assistant illustration">
          <div className="hr-illustration-shell">
            <Image
              src="/images/hushrag-hero-combined.png"
              alt="Two teammates using HushRag with a protected assistant preview"
              width={1536}
              height={1024}
              priority
            />
          </div>
        </div>
      </section>

      <section className="hr-features" id="features">
        <div className="hr-section-inner" id="security">
          <h2>Built for security. Designed for teams.</h2>

          <div className="hr-feature-grid">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <article className="hr-feature-card" key={title}>
                <Icon size={36} />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
