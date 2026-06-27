'use client';

import { ArrowRight, Code2, HeartHandshake, Leaf, Lock, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageFooter from '@/components/PageFooter';
import SiteHeader from '@/components/SiteHeader';

const VALUES = [
  {
    icon: Lock,
    title: 'Privacy by default',
    body: 'Every feature ships with the most restrictive privacy stance. We collect nothing we do not need, and we make it provable.',
  },
  {
    icon: ShieldCheck,
    title: 'Customer-owned data',
    body: 'Your documents, embeddings and chat logs live in your database. We never replicate, cache or train on them.',
  },
  {
    icon: Code2,
    title: 'Open by design',
    body: 'The RAG runtime, embeddings pipeline and chat widget are all open source. Audit the code that handles your data.',
  },
  {
    icon: Leaf,
    title: 'Boring infrastructure',
    body: 'No exotic stacks. SQLite, WASM, ONNX and the database you already run. The fewer moving parts, the fewer surprises.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    body: 'Roles, audit logs, access codes and channel routing. Everything an IT team needs and nothing a CEO has to babysit.',
  },
  {
    icon: HeartHandshake,
    title: 'Always free',
    body: 'Self-hosted, BYO database, no per-seat creep. We grow when your team grows, not by charging them for it.',
  },
];

const STATS = [
  { value: '100%', label: 'Customer-owned data' },
  { value: '0', label: 'Documents stored on our infra' },
  { value: '< 50ms', label: 'In-browser embedding time' },
  { value: '5+', label: 'Supported databases' },
];

export default function AboutPage() {
  const openAuth = () => {
    window.location.href = '/login?signup=true';
  };

  return (
    <main className="hr-page">
      <SiteHeader activePath="/about" />

      <section className="hr-about-hero">
        <div className="hr-about-hero-inner">
          <span className="hr-about-eyebrow">
            <Sparkles size={14} /> Our story
          </span>
          <h1>
            We&apos;re building the private knowledge layer
            <br />
            <em>modern teams actually trust.</em>
          </h1>
          <p>
            HushRag started with a simple frustration: every RAG tool we tried asked for
            our data before it would answer a question. We wanted better answers without
            giving up our documents. So we built it.
          </p>
          <div className="hr-about-hero-actions">
            <Button
              className="hr-btn hr-btn-primary hr-btn-large"
              type="button"
              onClick={openAuth}
            >
              Get Started <ArrowRight size={18} />
            </Button>
            <a className="hr-btn hr-btn-outline hr-btn-large hr-btn-link" href="/widget">
              Open Playground
            </a>
          </div>
        </div>
      </section>

      <section className="hr-about-mission">
        <div className="hr-about-section-inner">
          <div className="hr-about-mission-grid">
            <div>
              <h2>Our mission</h2>
              <p className="hr-about-lead">
                Make accurate internal knowledge as easy to ask as a search bar — without
                trading away the privacy that knowledge deserves.
              </p>
            </div>
            <div className="hr-about-mission-copy">
              <p>
                Companies sit on years of policy, onboarding and engineering knowledge.
                Most of it never reaches the people who need it, because the only way to
                surface it was to upload it to someone else&apos;s cloud.
              </p>
              <p>
                HushRag flips that trade-off. Embeddings run in the browser, retrieval
                happens against a database you control, and the only thing that leaves
                your environment is the question and the answer you already wrote.
              </p>
              <p>
                We don&apos;t think privacy should be a feature you opt into. It should be
                the default — and the architecture.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hr-about-stats">
        <div className="hr-about-section-inner">
          <div className="hr-about-stats-grid">
            {STATS.map((s) => (
              <div className="hr-about-stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hr-about-values">
        <div className="hr-about-section-inner">
          <div className="hr-about-section-header">
            <h2>What we believe</h2>
            <p>The principles that guide every feature, every release and every support reply.</p>
          </div>
          <div className="hr-about-values-grid">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <article className="hr-about-value-card" key={title}>
                <span className="hr-about-value-icon">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
