'use client';

import { useState } from 'react';
import PageFooter from '@/components/PageFooter';
import SiteHeader from '@/components/SiteHeader';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          HushRag is a <strong>hosted service</strong> operated by Quantaura Design
          Tech (quantaura.in). You access it through our web dashboard or the chat
          widget — you do not install anything. The only piece that runs outside our
          infrastructure is sign-in, which uses Firebase Authentication (a
          Google-managed service).
        </p>
        <p>
          This page explains where each piece of data lives, who can see it, and what
          choices you have.
        </p>
      </>
    ),
  },
  {
    id: 'what-hushrag-stores',
    title: 'What HushRag stores (and where)',
    body: (
      <>
        <p>There are three pieces of state in the system. Each lives somewhere different.</p>

        <h3>1. Sign-in (Firebase Authentication — managed by Google)</h3>
        <p>
          Email/password sign-in is handled by <strong>Firebase Authentication</strong>.
          Google holds the email, the hashed password, and the Firebase user ID (UID).
          HushRag does not store passwords, password hashes, or any user credentials
          of its own.
        </p>
        <p>
          When a user signs in, HushRag receives a signed Firebase ID token, verifies it,
          and uses the Firebase UID to identify the workspace. No profile data is copied
          into HushRag&apos;s own storage.
        </p>

        <h3>2. Workspace settings (our infrastructure, encrypted)</h3>
        <p>
          Our service stores the configuration needed to operate each workspace:
        </p>
        <ul>
          <li>Which database each workspace uses, and the encrypted credentials to reach it.</li>
          <li>Encrypted LLM / Pinecone / embedding provider keys.</li>
          <li>Workspace name and settings.</li>
        </ul>
        <p>
          These are encrypted with AES-256-GCM at rest in our database. Even though
          we store them, we do not have a way to decrypt and read them: the
          encryption key is derived from a passphrase you set, and the passphrase
          lives in your browser, not on our servers. Quantaura Design Tech cannot
          read your credentials.
        </p>

        <h3>3. Workspace data (your database)</h3>
        <p>
          Every workspace has a tenant database that <strong>you</strong> choose and host.
          Options include local SQLite, Turso, Supabase (Postgres), MongoDB Atlas, or
          Firestore. This database holds the actual content:
        </p>
        <ul>
          <li>Policy / guideline folders and document metadata</li>
          <li>Document chunks and embeddings (when Pinecone is not enabled)</li>
          <li>Chat sessions and audit logs (auto-purged after 7 days by default)</li>
          <li>Pinecone vector IDs (when Pinecone is enabled)</li>
        </ul>
        <p>
          HushRag, Inc. — sorry, <strong>Quantaura Design Tech</strong> — has no access
          to this database. Not by default, not via a backdoor, not via a side channel.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-see',
    title: 'What Quantaura Design Tech can see',
    body: (
      <>
        <p>
          Unless you explicitly send it to us: <strong>nothing about your documents,
          embeddings, or chat history.</strong>
        </p>
        <p>We can see:</p>
        <ul>
          <li>Anything you email us, file in a support ticket, or post in a public channel.</li>
          <li>Aggregated install / version telemetry if you opt in.</li>
        </ul>
        <p>
          We do <strong>not</strong> see your documents, your embeddings, your chat
          history, your audit logs, your database, your LLM traffic, or your Firebase
          password (Google holds that).
        </p>
      </>
    ),
  },
  {
    id: 'embeddings-and-llm',
    title: 'Embeddings and the LLM',
    body: (
      <>
        <h3>Embeddings</h3>
        <p>
          Vector embeddings are generated <strong>in the browser</strong> using a WASM ONNX
          model. The embedding model files are downloaded to the user&apos;s device; no
          embedding text or vector ever leaves that device.
        </p>
        <h3>LLM calls</h3>
        <p>
          When a question is asked, the user&apos;s browser sends the question plus the
          matched chunks to the LLM provider configured for that workspace (OpenAI, Anthropic,
          or whoever you chose). That provider&apos;s terms then apply to that traffic.
          Quantaura Design Tech does not proxy or log that traffic.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party services',
    body: (
      <>
        <p>Two services are always in the loop. The rest are optional.</p>
        <h3>Always on</h3>
        <ul>
          <li>
            <strong>Firebase Authentication (Google)</strong> — handles sign-in and
            sign-up. Google holds the email, hashed password, and Firebase UID for each
            user. Google&apos;s privacy policy applies to that data.
          </li>
        </ul>
        <h3>Optional</h3>
        <ul>
          <li><strong>Your LLM provider</strong> — receives the question and matched chunks at query time.</li>
          <li><strong>Pinecone</strong> (optional) — stores vectors if you enable it. We never see your Pinecone key in plaintext.</li>
          <li><strong>Twilio</strong> (optional) — delivers WhatsApp messages to and from your employees.</li>
          <li><strong>Telegram</strong> (optional) — routes Telegram bot messages to your employees.</li>
        </ul>
        <p>
          Each has its own data processing terms. Disabling a feature in HushRag stops new
          data from going to that third party. To remove Firebase Auth, you would need
          to remove HushRag (there is no other sign-in path).
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & local storage',
    body: (
      <>
        <p>
          The HushRag dashboard stores a single JWT in <code>localStorage</code> to keep
          you signed in. We do not set tracking cookies. We do not run third-party
          analytics scripts.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    body: (
      <>
        <p>
          Your workspace data lives in the database you chose, so its retention is
          governed by <strong>your</strong> database and <strong>your</strong>{' '}
          hosting, not by Quantaura Design Tech. As a default the dashboard purges
          chat audit metadata after 7 days. You can change that interval, change
          your database, or wipe the database at any time.
        </p>
        <p>
          Your sign-in identity is held by Firebase under their retention policies.
          To request deletion of your Firebase account, follow Google&apos;s account
          deletion process.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <p>Because your workspace data lives in the database you chose, you always have full control of it. You can at any time:</p>
        <ul>
          <li>Rotate or delete the encrypted credentials in your workspace settings.</li>
          <li>Point HushRag at a different tenant database.</li>
          <li>Wipe or delete the tenant database — this is your data, in your database.</li>
          <li>Stop using the service. Your data remains in your database; we have no copy to delete.</li>
          <li>Delete your Firebase account, which removes your sign-in identity held by Google. (This is done from the dashboard or directly with Firebase.)</li>
        </ul>
        <p>
          For anything that requires us, email{' '}
          <a href="mailto:contact@quantaura.in">contact@quantaura.in</a>.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <>
        <p>
          If we make material changes, we will update the &ldquo;Last updated&rdquo; date and
          announce the change in the project&apos;s release notes.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <>
        <p>
          Questions? Email <a href="mailto:contact@quantaura.in">contact@quantaura.in</a>.
        </p>
        <p className="hr-legal-placeholder">
          This is a placeholder Privacy Policy. Please have it reviewed by counsel
          before relying on it in production.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  const [active, setActive] = useState('overview');
  return (
    <main className="hr-page">
      <SiteHeader activePath="/privacy" />

      <section className="hr-legal-hero">
        <div className="hr-legal-hero-inner">
          <span className="hr-about-eyebrow">Legal</span>
          <h1>Privacy Policy</h1>
          <p>Where your data lives, who can see it, and what you can do about it.</p>
          <span className="hr-legal-updated">Last updated: today</span>
        </div>
      </section>

      <section className="hr-legal-body">
        <div className="hr-legal-layout">
          <aside className="hr-legal-toc" aria-label="On this page">
            <h2>On this page</h2>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={active === s.id ? 'is-active' : ''}
                    onClick={() => setActive(s.id)}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <article className="hr-legal-article">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="hr-legal-section">
                <h2>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
