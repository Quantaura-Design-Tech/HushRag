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
          </div>          <div className="hr-hiw-visual pt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-4 lg:grid-rows-2 gap-x-6 gap-y-8 lg:gap-x-14 lg:gap-y-14 w-full max-w-[1200px] mx-auto items-stretch justify-center relative">
              
              {/* Step 1 */}
              <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1 relative flex flex-col opacity-0 animate-fade-in-up stagger-1 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">1</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <path d="M22 48H18.8C11.7 48 6 42.3 6 35.2c0-6.3 4.7-11.7 10.9-12.6A17.4 17.4 0 0 1 49.7 27 10.5 10.5 0 0 1 48.5 48H42" />
                      <path d="M32 48V28" />
                      <path d="m23 36 9-9 9 9" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Upload &amp; Parse</h3>
                    <p className="hr-flowchart-card-desc">Admin uploads docs (PDF, TXT, DOCX).</p>
                    <span className="hr-flowchart-card-badge">POST /api/parse</span>
                  </div>
                </article>
                {/* Connector: Right Arrow (Both) */}
                <div className="absolute top-1/2 -right-6 lg:-right-14 w-6 lg:w-14 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h animate-dash-h"></div>
                  <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="col-start-2 row-start-1 lg:col-start-2 lg:row-start-1 relative flex flex-col opacity-0 animate-fade-in-up stagger-2 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">2</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <path d="M20 8h20l10 10v38H20z" />
                      <path d="M40 8v12h10" />
                      <path d="M26 31h18M26 39h18M26 47h12" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Text Extraction</h3>
                    <p className="hr-flowchart-card-desc">Server converts file to clean markdown.</p>
                    <span className="hr-flowchart-card-badge">Markdown Output</span>
                  </div>
                </article>
                {/* Connector Mobile: Down Bridge to Row 2 */}
                <div className="lg:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 z-0">
                  <div className="w-full h-full connector-v animate-dash-v"></div>
                  <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-2 h-2 border-b-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
                {/* Connector Desktop: Right Arrow */}
                <div className="hidden lg:block absolute top-1/2 -right-14 w-14 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h animate-dash-h"></div>
                  <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="col-start-2 row-start-2 lg:col-start-3 lg:row-start-1 relative flex flex-col opacity-0 animate-fade-in-up stagger-3 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">3</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <path d="M26 20h26M26 32h26M26 44h26" />
                      <circle cx="14" cy="20" r="3" />
                      <circle cx="14" cy="32" r="3" />
                      <circle cx="14" cy="44" r="3" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Chunk &amp; Prepare</h3>
                    <p className="hr-flowchart-card-desc">Splits text into 500-word sliding chunks.</p>
                    <span className="hr-flowchart-card-badge">Sliding Window</span>
                  </div>
                </article>
                {/* Connector Mobile: Left Arrow to Step 4 */}
                <div className="lg:hidden absolute top-1/2 -left-6 w-6 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h-rev animate-dash-h-rev"></div>
                  <div className="absolute left-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-[#0a6a55] rotate-45"></div>
                </div>
                {/* Connector Desktop: Right Arrow */}
                <div className="hidden lg:block absolute top-1/2 -right-14 w-14 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h animate-dash-h"></div>
                  <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="col-start-1 row-start-2 lg:col-start-4 lg:row-start-1 relative flex flex-col opacity-0 animate-fade-in-up stagger-4 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">4</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <circle cx="32" cy="12" r="5" />
                      <circle cx="14" cy="42" r="5" />
                      <circle cx="50" cy="42" r="5" />
                      <path d="M28 16 18 38M36 16l10 22M19 42h26" />
                      <circle cx="32" cy="34" r="5" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Synonym Map</h3>
                    <p className="hr-flowchart-card-desc">Expands acronyms for deeper relevance.</p>
                    <span className="hr-flowchart-card-badge">pto → vacation</span>
                  </div>
                </article>
                {/* Connector: Down Arrow (Both Mobile & Desktop bridge to Row 2) */}
                <div className="absolute -bottom-8 lg:-bottom-14 left-1/2 -translate-x-1/2 w-[2px] h-8 lg:h-14 z-0">
                  <div className="w-full h-full connector-v animate-dash-v"></div>
                  <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-2 h-2 border-b-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="col-start-1 row-start-3 lg:col-start-4 lg:row-start-2 relative flex flex-col opacity-0 animate-fade-in-up stagger-5 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">5</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <path d="m32 8 20 11v26L32 56 12 45V19z" />
                      <path d="m12 19 20 11 20-11M32 30v26" />
                      <path d="m22 24 20-11" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Index Config</h3>
                    <p className="hr-flowchart-card-desc">System checks your search mode.</p>
                    <span className="hr-flowchart-card-badge">Condition Check</span>
                  </div>
                </article>
                {/* Connector Mobile: Right Arrow to Branch */}
                <div className="lg:hidden absolute top-1/2 -right-6 w-6 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h animate-dash-h"></div>
                  <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
                {/* Connector Desktop: Left Arrow to Branch */}
                <div className="hidden lg:block absolute top-1/2 -left-14 w-14 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h-rev animate-dash-h-rev"></div>
                  <div className="absolute left-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step Branch (5A / 5B) */}
              <div className="col-start-2 row-start-3 lg:col-start-3 lg:row-start-2 relative flex flex-col justify-center gap-2 lg:gap-3 opacity-0 animate-fade-in-up stagger-6 z-10">
                {/* Branch 5A */}
                <article className="hr-branch-card group">
                  <span className="absolute top-0 left-2 px-1.5 py-[1px] bg-gradient-to-r from-[#0a6a55] to-[#034c3c] text-white text-[8px] lg:text-[9px] font-extrabold rounded-b-md shadow-sm z-10">5A</span>
                  <div className="hr-branch-card-icon-wrapper">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 fill-[#0d8066]" viewBox="0 0 64 64">
                      <circle cx="16" cy="16" r="5" />
                      <circle cx="32" cy="16" r="5" />
                      <circle cx="48" cy="16" r="5" />
                      <circle cx="16" cy="32" r="5" />
                      <circle cx="32" cy="32" r="5" />
                      <circle cx="48" cy="32" r="5" />
                      <circle cx="16" cy="48" r="5" />
                      <circle cx="32" cy="48" r="5" />
                      <circle cx="48" cy="48" r="5" />
                    </svg>
                  </div>
                  <h4 className="hr-branch-card-title">Vector WASM</h4>
                  <span className="hr-branch-card-badge">all-MiniLM</span>
                </article>

                {/* Branch 5B */}
                <article className="hr-branch-card group">
                  <span className="absolute top-0 left-2 px-1.5 py-[1px] bg-gradient-to-r from-[#0a6a55] to-[#034c3c] text-white text-[8px] lg:text-[9px] font-extrabold rounded-b-md shadow-sm z-10">5B</span>
                  <div className="hr-branch-card-icon-wrapper">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <circle cx="27" cy="27" r="16" />
                      <path d="m40 40 14 14" />
                    </svg>
                  </div>
                  <h4 className="hr-branch-card-title">Keyword Index</h4>
                  <span className="hr-branch-card-badge">MiniSearch</span>
                </article>

                {/* Connector Mobile: Down Bridge to Step 6 */}
                <div className="lg:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 z-0">
                  <div className="w-full h-full connector-v animate-dash-v"></div>
                  <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-2 h-2 border-b-2 border-r-2 border-[#0a6a55] rotate-45"></div>
                </div>
                {/* Connector Desktop: Left Arrow to Step 6 */}
                <div className="hidden lg:block absolute top-1/2 -left-14 w-14 h-[2px] z-0 -translate-y-1/2">
                  <div className="w-full h-full connector-h-rev animate-dash-h-rev"></div>
                  <div className="absolute left-[2px] top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-[#0a6a55] rotate-45"></div>
                </div>
              </div>

              {/* Step 6 (Final) */}
              <div className="col-start-2 row-start-4 lg:col-start-2 lg:row-start-2 relative flex flex-col opacity-0 animate-fade-in-up stagger-7 z-10">
                <article className="hr-flowchart-card group">
                  <span className="absolute -top-2 left-2 lg:-top-3 lg:left-4 w-5 h-5 lg:w-7 h-7 rounded-full bg-gradient-to-br from-[#0a6a55] to-[#034c3c] text-white flex items-center justify-center font-extrabold shadow-[0_8px_20px_rgba(10,106,85,0.25)] text-[10px] lg:text-[13px] z-10">6</span>
                  <div className="hr-flowchart-card-icon-wrapper">
                    <svg className="w-4 h-4 lg:w-7 lg:h-7 text-[#0d8066] stroke-current stroke-[2.5] fill-none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
                      <ellipse cx="32" cy="16" rx="17" ry="8" />
                      <path d="M15 16v32c0 4.4 7.6 8 17 8s17-3.6 17-8V16" />
                      <path d="M15 32c0 4.4 7.6 8 17 8s17-3.6 17-8" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 items-center w-full">
                    <h3 className="hr-flowchart-card-title">Store in DB</h3>
                    <p className="hr-flowchart-card-desc">Securely writes embedding outputs.</p>
                    <span className="hr-db-badge">Your Database</span>
                  </div>
                </article>
                {/* Final Step: No outgoing arrows */}
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
