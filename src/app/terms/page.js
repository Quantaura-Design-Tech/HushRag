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
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of HushRag, the
          privacy-first RAG platform developed by Quantaura Design Tech (quantaura.in) and
          released as open-source software. By deploying, configuring, or running HushRag,
          you agree to these Terms.
        </p>
        <p>
          If you are accepting these Terms on behalf of a company, you represent that you
          have authority to bind that company, in which case &ldquo;you&rdquo; refers to
          that company.
        </p>
      </>
    ),
  },
  {
    id: 'what-hushrag-is',
    title: 'What HushRag is (and isn\u2019t)',
    body: (
      <>
        <p>
          HushRag is an <strong>open-source, self-hosted application</strong>. You
          clone the repository, run it on your own infrastructure, and connect it to a
          database <strong>you</strong> choose and host (Turso, Supabase, MongoDB,
          Firestore, or a local SQLite).
        </p>
        <p>
          Authentication is handled entirely within your HushRag instance using
          <strong> PBKDF2</strong> password hashing and <strong>JWT</strong> session
          tokens. No third-party authentication service is required.
        </p>
        <p>
          Because you self-host, Quantaura Design Tech does not see your documents,
          embeddings, chat history, audit logs, or user credentials. Your data stays
          in the database you configured, on your infrastructure.
        </p>
      </>
    ),
  },
  {
    id: 'license',
    title: 'License',
    body: (
      <>
        <p>
          HushRag is licensed under the{' '}
          <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">
            <strong>GNU Affero General Public License v3.0 (AGPL-3.0)</strong>
          </a>. The full source code is available at{' '}
          <a href="https://github.com/Quantaura-Design-Tech/HushRag" target="_blank" rel="noopener">
            github.com/Quantaura-Design-Tech/HushRag
          </a>.
        </p>
        <p>
          Under AGPL-3.0, you are free to use, study, modify, and redistribute
          HushRag, including for commercial use. If you modify HushRag and make it
          available over a network (e.g. host it for others to use), you must make
          the modified source code available under the same license.
        </p>
        <p>
          HushRag is also distributed with optional components and integrations
          (Firebase admin SDK, Twilio, Telegram bot libraries) that are subject to
          their own licenses. The AGPL-3.0 applies to the HushRag source code itself.
        </p>
      </>
    ),
  },
  {
    id: 'your-responsibilities',
    title: 'Your responsibilities',
    body: (
      <>
        <p>You are responsible for:</p>
        <ul>
          <li>Keeping your sign-in credentials and server environment variables secret (including <code>JWT_SECRET</code> and <code>ENCRYPTION_KEY</code>).</li>
          <li>Configuring access controls and password hygiene for your workspace users.</li>
          <li>Choosing and securing the database that stores your workspace data.</li>
          <li>Choosing and securing the LLM provider, Pinecone, Twilio, and Telegram accounts you connect.</li>
          <li>The content you upload and the answers your employees receive.</li>
          <li>Complying with privacy, employment, and sector-specific laws that apply to your use.</li>
          <li>Keeping your HushRag deployment up to date with security patches.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use HushRag to process content you do not have the right to use.</li>
          <li>Use HushRag to harass, defame, or harm others.</li>
          <li>Probe, scan, or attempt to disrupt a HushRag instance you do not own.</li>
          <li>Violate the terms of any third party you connect (LLM provider, Pinecone, Twilio, Telegram, your database host).</li>
          <li>Remove or alter license attributions in the source code when redistributing.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'support-and-updates',
    title: 'Support & updates',
    body: (
      <>
        <p>
          The HushRag project is maintained by Quantaura Design Tech and the open-source
          community. Updates, security patches, and new features are published to the
          GitHub repository. Because you self-host, you are responsible for pulling
          updates and deploying them to your instance.
        </p>
        <p>
          Community support is available through{' '}
          <a href="https://github.com/Quantaura-Design-Tech/HushRag/issues" target="_blank" rel="noopener">
            GitHub Issues
          </a>. Commercial support, if offered, will be described separately.
        </p>
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Fees',
    body: (
      <>
        <p>
          HushRag is free and open-source software. There are no fees charged by
          Quantaura Design Tech for using HushRag.
        </p>
        <p>
          You are responsible for any fees charged by third parties you connect
          (LLM provider, Pinecone, Twilio, Telegram, your database host, or your
          hosting provider).
        </p>
      </>
    ),
  },
  {
    id: 'data-and-ownership',
    title: 'Data & ownership',
    body: (
      <>
        <p>
          You retain all rights to the documents, embeddings, and chat history stored
          in the database you connect to HushRag. Quantaura Design Tech claims no
          ownership of that data.
        </p>
        <p>
          Because HushRag is self-hosted, the encrypted credentials needed to read
          your data are stored on your server, encrypted with a key you control via
          the <code>ENCRYPTION_KEY</code> environment variable. Quantaura Design Tech
          has no access to your server, your database, or your encryption key. If you
          voluntarily share data with the project (e.g. by filing a GitHub issue with
          logs attached), you grant a limited license to use it solely to resolve
          your request.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <>
        <p>
          You may stop using HushRag at any time. Disconnect your database, delete
          your workspace, shut down the server, or simply stop running the
          application. Your data remains in the database you chose — it was always
          yours.
        </p>
        <p>
          Because HushRag is self-hosted, there is no account to &ldquo;delete on our
          end.&rdquo; Removing user accounts is done directly in your database.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <>
        <p>
          To the maximum extent permitted by law, HushRag is provided &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo;, without warranties of any kind, express or implied,
          including but not limited to merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
        <p>
          Quantaura Design Tech does not warrant that the software will be uninterrupted,
          secure, or error-free, or that answers generated by your configured LLM will
          be accurate, safe, or suitable for any particular purpose.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <p>
          To the maximum extent permitted by law, the total liability of Quantaura
          Design Tech and its contributors arising out of or relating to these Terms
          or the HushRag software will not exceed USD $100. Neither Quantaura Design
          Tech nor any contributor will be liable for indirect, incidental, special,
          consequential, or punitive damages.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <>
        <p>
          These Terms may be updated. Material changes will be reflected in the
          &ldquo;Last updated&rdquo; date below and announced in the GitHub repository.
          Continued use of HushRag after the change constitutes acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <>
        <p>
          These Terms are governed by the laws of the jurisdiction where Quantaura Design Tech is
          incorporated, without regard to its conflict of laws rules. Any dispute will be
          resolved in the courts of that jurisdiction.
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
          Questions about these Terms? Email{' '}
          <a href="mailto:contact@quantaura.in">contact@quantaura.in</a>.
        </p>
        <p className="hr-legal-placeholder">
          This is a placeholder Terms of Service. Please have it reviewed by counsel
          before relying on it in production.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  const [active, setActive] = useState('overview');
  return (
    <main className="hr-page">
      <SiteHeader activePath="/terms" />

      <section className="hr-legal-hero">
        <div className="hr-legal-hero-inner">
          <span className="hr-about-eyebrow">Legal</span>
          <h1>Terms of Service</h1>
          <p>The rules of the road for using HushRag.</p>
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
