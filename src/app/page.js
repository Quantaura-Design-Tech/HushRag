'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Cpu,
  Database,
  FileText,
  FolderOpen,
  Globe,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Monitor,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
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

const detailedFeatures = [
  {
    icon: FolderOpen,
    title: 'Policy Guideline Folders',
    body: 'Organize docs into folders. Upload PDF, DOCX, TXT or Markdown files.',
  },
  {
    icon: Layers,
    title: 'Smart Chunking',
    body: '500-word sliding window chunking with overlap to preserve context.',
  },
  {
    icon: Search,
    title: 'Synonym Expansion',
    body: 'Built-in synonym mapper expands acronyms for better search results.',
  },
  {
    icon: Cpu,
    title: 'WASM Embeddings',
    body: 'In-browser ONNX models create embeddings. Zero server cost.',
  },
  {
    icon: BarChart3,
    title: 'RAG Debug Monitor',
    body: 'See matched chunks, similarities and scores in real time.',
  },
  {
    icon: FileText,
    title: 'Audit & Chat Logs',
    body: '7-day chat logs for audit or review. Auto-purged.',
  },
  {
    icon: KeyRound,
    title: 'Access Code Control',
    body: 'Protect access with a master passcode across channels.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Support',
    body: 'Web widget, Telegram bot, WhatsApp via Twilio and more.',
  },
  {
    icon: Database,
    title: 'BYODB Ready',
    body: 'Connect your own database. Your data, your control.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    body: 'AES-256 encryption end-to-end. Built for compliance.',
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

      {/* Everything You Need Section */}
      <section className="hr-everything">
        <div className="hr-everything-inner">
          <div className="hr-everything-copy">
            <h2>
              Everything you need for
              <br />
              <em>private</em> knowledge search.
            </h2>

            <p>
              HushRag combines client-side AI with your own data infrastructure
              to deliver fast, accurate, and secure answers—every time.
            </p>


            <div className="hr-everything-trust">
              <span><ShieldCheck size={14} /> No credit card required</span>
              <span><ShieldCheck size={14} /> Setup in minutes</span>
              <span><ShieldCheck size={14} /> Cancel anytime</span>
            </div>
          </div>

          <div className="hr-everything-visual">
            <Image
              src="/images/Everything-illustration.png"
              alt="HushRag policy guidelines and assistant interface with security badges"
              width={1024}
              height={1024}
              priority
            />
          </div>
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="hr-detailed-features" id="pricing">
        <div className="hr-section-inner">
          <div className="hr-detailed-grid">
            {detailedFeatures.map(({ icon: Icon, title, body }) => (
              <article className="hr-detailed-card" key={title}>
                <div className="hr-detailed-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <a href="#" className="hr-learn-more">
                  Learn more <ArrowRight size={14} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA Bar */}
      <section className="hr-cta-bar">
        <div className="hr-cta-inner">
          <div className="hr-cta-left">
            <div className="hr-cta-shield">
              <Lock size={28} />
            </div>
            <div>
              <h2>Ready to secure your team&apos;s knowledge?</h2>
              <p>Start in minutes. No credit card required.</p>
            </div>
          </div>
          <div className="hr-cta-actions">
            <Button className="hr-btn hr-btn-cta-primary" type="button" onClick={() => openAuth(false)}>
              Start Free Trial
            </Button>
            <Button className="hr-btn hr-btn-cta-outline" type="button" onClick={() => openAuth(true)}>
              Book a Demo
            </Button>
          </div>
          <div className="hr-cta-stats">
            <div className="hr-cta-stat">
              <Lock size={18} />
              <div>
                <strong>100%</strong>
                <span>Customer-Owned Data</span>
              </div>
            </div>
            <div className="hr-cta-stat">
              <FileText size={18} />
              <div>
                <strong>7 Days</strong>
                <span>Audit Log Retention</span>
              </div>
            </div>
            <div className="hr-cta-stat">
              <Database size={18} />
              <div>
                <strong>5+</strong>
                <span>Supported Databases</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="hr-integrations" id="integrations">
        <div className="hr-section-inner">
          <div className="hr-integrations-grid">
            <div className="hr-integration-panel">
              <h3>Deploy where your team works</h3>
              <p>Bring HushRag to every channel your team uses.</p>
              <div className="hr-integration-items">
                <div className="hr-integration-item">
                  <div className="hr-integration-item-icon"><Monitor size={20} /></div>
                  <div>
                    <strong>Web Widget</strong>
                    <span>Embed the chat anywhere with a single script.</span>
                  </div>
                </div>
                <div className="hr-integration-item">
                  <div className="hr-integration-item-icon hr-brand-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#26A5E4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </div>
                  <div>
                    <strong>Telegram Bot</strong>
                    <span>One-click Telegram bot integration.</span>
                  </div>
                </div>
                <div className="hr-integration-item">
                  <div className="hr-integration-item-icon hr-brand-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  </div>
                  <div>
                    <strong>WhatsApp</strong>
                    <span>Connect via Twilio Gateway.</span>
                  </div>
                </div>
              </div>
              <a href="#" className="hr-learn-more">View all integrations <ArrowRight size={14} /></a>
            </div>
            <div className="hr-integration-panel">
              <h3>Works with your stack</h3>
              <p>Connect HushRag to the tools and databases you already use.</p>
              <div className="hr-integration-logos">
                <span className="hr-logo-item">
                  <img src="/images/logos/turso.png" alt="Turso" className="hr-brand-logo" style={{height: '22px', width: 'auto'}} />
                </span>
                <span className="hr-logo-item">
                  <img src="/images/logos/supabase-icon.svg" alt="Supabase" className="hr-brand-logo" style={{height: '18px'}} />
                  supabase
                </span>
                <span className="hr-logo-item">
                  <img src="/images/logos/mongodb.svg" alt="MongoDB" className="hr-brand-logo" style={{height: '20px', width: 'auto'}} />
                </span>
                <span className="hr-logo-item">
                  <img src="/images/logos/firebase.svg" alt="Firebase" className="hr-brand-logo" style={{height: '20px', width: 'auto'}} />
                </span>
                <span className="hr-logo-item">
                  <img src="/images/logos/Pinecone-Primary-Logo-Black.png" alt="Pinecone" className="hr-brand-logo" style={{height: '22px', width: 'auto'}} />
                </span>
                <span className="hr-logo-item">
                  <img src="/images/logos/sqlite.png" alt="SQLite" className="hr-brand-logo" style={{height: '22px', width: 'auto'}} />
                </span>
              </div>
              <a href="#" className="hr-learn-more">View all integrations <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="hr-how-it-works" id="how-it-works">
        <div className="hr-section-inner">
          <div className="hr-hiw-header">
            <h2>How HushRag Works</h2>
            <p className="hr-hiw-subtitle">Two simple pipelines. 100% private.</p>
          </div>
          <div className="hr-hiw-visual">
            <Image
              src="/images/how-it-works.png"
              alt="How HushRag Works flowchart showing Document Upload Pipeline and Employee Query Pipeline"
              width={3840}
              height={2043}
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
