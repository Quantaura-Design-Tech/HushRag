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
          HushRag is an <strong>open-source, self-hosted</strong> application released
          under the <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">GNU Affero General Public License v3.0</a>.
          You run it on your own infrastructure — there is no cloud service operated by
          Quantaura Design Tech. Authentication, document storage, and embeddings all run
          on the machine where you deploy HushRag.
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

        <h3>1. Sign-in credentials (your server)</h3>
        <p>
          Email and password sign-in is handled entirely by the HushRag instance you
          run. Passwords are hashed using <strong>PBKDF2</strong> (1000 iterations,
          SHA-512) with a per-user salt, and session tokens are signed with JWT.
          Neither Quantaura Design Tech nor any third party has access to your
          sign-in data — it lives in the database on your server.
        </p>

        <h3>2. Workspace settings (your server, encrypted)</h3>
        <p>
          Your HushRag instance stores the configuration needed to operate each
          workspace:
        </p>
        <ul>
          <li>Which database each workspace uses, and the encrypted credentials to reach it.</li>
          <li>Encrypted LLM / Pinecone / embedding provider keys.</li>
          <li>Workspace name and settings.</li>
        </ul>
        <p>
          These are encrypted with <strong>AES-256-GCM</strong> at rest in your
          database. The encryption key is derived from a server-side environment
          variable (<code>ENCRYPTION_KEY</code>) that you control. Quantaura Design
          Tech has no access to your server, your database, or your encryption key.
        </p>

        <h3>3. Workspace data (your database)</h3>
        <p>
          Every workspace has a tenant database that <strong>you</strong> choose and
          host. Options include local SQLite, Turso, Supabase (Postgres), MongoDB, or
          Firestore. This database holds the actual content:
        </p>
        <ul>
          <li>Policy / guideline folders and document metadata</li>
          <li>Document chunks and embeddings (when Pinecone is not enabled)</li>
          <li>Chat sessions and audit logs (auto-purged after 7 days by default)</li>
          <li>Pinecone vector IDs (when Pinecone is enabled)</li>
        </ul>
        <p>
          Because you self-host HushRag, Quantaura Design Tech has no access to this
          database. Not by default, not via a backdoor, not via a side channel.
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
          Because HushRag is self-hosted and open source: <strong>nothing about your
          documents, embeddings, chat history, or user accounts is visible to
          Quantaura Design Tech.</strong>
        </p>
        <p>
          The only data Quantaura Design Tech may see is:
        </p>
        <ul>
          <li>Anything you voluntarily send via email, GitHub issues, or pull requests.</li>
          <li>Public contributions to the open-source repository.</li>
        </ul>
        <p>
          We do <strong>not</strong> see your documents, your embeddings, your chat
          history, your audit logs, your database, your LLM traffic, or your user
          credentials. Everything runs on your infrastructure.
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
        <p>All third-party services in HushRag are optional. None are required.</p>
        <h3>Optional</h3>
        <ul>
          <li><strong>Your LLM provider</strong> — receives the question and matched chunks at query time. Configured per workspace.</li>
          <li><strong>Pinecone</strong> — stores vectors if you enable it. Credentials are encrypted at rest.</li>
          <li><strong>Twilio</strong> — delivers WhatsApp messages to and from your employees.</li>
          <li><strong>Telegram</strong> — routes Telegram bot messages to your employees.</li>
          <li><strong>Firebase / Firestore</strong> — optional BYODB database driver. Only used if you explicitly configure it.</li>
        </ul>
        <p>
          Each has its own data processing terms. Disabling a feature in HushRag stops
          new data from going to that third party. Because you self-host, you have full
          control over which integrations are enabled.
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
          The HushRag dashboard stores a JWT in <code>localStorage</code> to keep
          you signed in. No tracking cookies are set. No third-party analytics scripts
          are loaded. Because you self-host, you have full visibility into all
          client-side and server-side code.
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
          hosting, not by Quantaura Design Tech. As a default, HushRag purges chat
          audit metadata after 7 days. You can change that interval, change
          your database, or wipe the database at any time.
        </p>
        <p>
          User accounts and password hashes live in your database. To delete a user,
          remove the record from the <code>users</code> table or drop the database.
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
          <li>Stop using the service. Your data remains in your database.</li>
          <li>Delete user accounts directly from your database, or drop the database entirely.</li>
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
