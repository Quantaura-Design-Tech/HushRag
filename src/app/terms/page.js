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
          privacy-first RAG platform provided by Quantaura Design Tech (quantaura.in) (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). By installing, configuring, or running HushRag, you agree to
          these Terms.
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
    title: 'What HushRag is (and isn&apos;t)',
    body: (
      <>
        <p>
          HushRag is a <strong>hosted service</strong> operated by Quantaura Design
          Tech. You access it through the web dashboard or the chat widget — you do
          not install anything. The service connects to a database{' '}
          <strong>you</strong> choose and host (Turso, Supabase, MongoDB, Firestore,
          or a local SQLite).
        </p>
        <p>
          Sign-in is handled by <strong>Firebase Authentication</strong> (a
          Google-managed service). Firebase holds your email, password hash, and a
          user ID. Quantaura Design Tech does not see those.
        </p>
        <p>
          We do not see your documents, embeddings, chat history, or audit logs
          unless you explicitly share them with us. Your data stays in the database
          you configured.
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
          HushRag is proprietary software owned by Quantaura Design Tech. The source
          code is not redistributed. We grant you a non-exclusive, non-transferable
          right to use the HushRag service through the interfaces we provide (the web
          dashboard, the chat widget, and the connected channels) for the purpose of
          building an internal RAG assistant over your own data.
        </p>
        <p>
          You may not reverse engineer, decompile, resell, or attempt to extract the
          source code of HushRag. You may not use the service to build a directly
          competing product.
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
          <li>Keeping your sign-in credentials secret.</li>
          <li>Configuring access controls and password hygiene for your workspace users.</li>
          <li>Choosing and securing the database that stores your workspace data.</li>
          <li>Choosing and securing the LLM provider, Pinecone, Twilio, and Telegram accounts you connect.</li>
          <li>The content you upload and the answers your employees receive.</li>
          <li>Complying with privacy, employment, and sector-specific laws that apply to your use.</li>
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
          <li>Reverse engineer, decompile, or attempt to extract the source code of HushRag.</li>
          <li>Probe, scan, or attempt to disrupt the service.</li>
          <li>Use HushRag to build a directly competing product.</li>
          <li>Violate the terms of any third party you connect (LLM provider, Pinecone, Twilio, Telegram, your database host).</li>
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
          We may release updates, security patches, and new features from time to time.
          Because HushRag is a hosted service, these are applied on our side — you
          do not need to deploy anything.
        </p>
        <p>
          Support channels, response times, and any paid support tiers will be
          described on our website or in a separate order form.
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
          HushRag is currently free to use. If we ever offer paid plans (managed
          hosting, premium support, enterprise features), pricing will be posted on
          our website and governed by a separate order form.
        </p>
        <p>
          You are still responsible for fees charged by third parties you connect
          (LLM provider, Pinecone, Twilio, Telegram, your own database host).
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
          in the database you connect to HushRag. We claim no ownership of that data.
        </p>
        <p>
          The HushRag service is hosted by Quantaura Design Tech, but the encrypted
          credentials needed to read your data never leave your browser. We do not
          have a way to decrypt and read your workspace data. If you voluntarily send
          data to us (e.g. by emailing a support question with logs attached), you
          grant us a limited license to use it solely to resolve your support request.
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
          your workspace, or simply stop signing in. Your data remains in the
          database you chose — we do not need to &ldquo;delete&rdquo; anything on
          our end because the data is yours, not ours.
        </p>
        <p>
          We may suspend or terminate access if you breach these Terms. If you have a
          paid plan with us, termination terms are in the applicable order form.
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
          We do not warrant that the software will be uninterrupted, secure, or
          error-free, or that answers generated by your configured LLM will be accurate,
          safe, or suitable for any particular purpose.
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
          To the maximum extent permitted by law, our total liability arising out of or
          relating to these Terms will not exceed the greater of (a) the fees you paid
          us in the 12 months before the claim, or (b) USD $100. We will not be liable
          for indirect, incidental, special, consequential, or punitive damages.
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
          We may update these Terms. Material changes will be reflected in the
          &ldquo;Last updated&rdquo; date below and announced in the project&apos;s release
          notes. Continued use of new releases after the change constitutes acceptance.
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
