'use client';

import { Fragment, useState } from 'react';
import {
  BarChart3,
  Box,
  Cpu,
  CloudUpload,
  Database,
  FileText,
  Filter,
  Folder,
  ListChecks,
  LayoutGrid,
  MessageCircle,
  Network,
  Search,
  Sparkles,
} from 'lucide-react';

const PIPELINES = {
  upload: {
    label: 'A. Document Upload Pipeline',
    caption: 'Admins upload documents and build the knowledge base in your own environment.',
    cards: [
      {
        number: 1,
        icon: CloudUpload,
        title: 'Upload & Parse',
        body: 'Admin uploads docs (PDF, DOCX, TXT, Markdown up to 5MB).',
        badge: { kind: 'code', label: 'POST /api/parse' },
      },
      {
        number: 2,
        icon: FileText,
        title: 'Text Extraction',
        body: 'Server parses the file and converts it to clean markdown text.',
        badge: { kind: 'tag', label: 'Markdown Output' },
      },
      {
        number: 3,
        icon: ListChecks,
        title: 'Chunk & Prepare',
        body: 'In-browser tokenizer splits text into 500-word overlapping chunks.',
        badge: { kind: 'tag', label: 'Sliding Window Chunking' },
      },
      {
        number: 4,
        icon: Network,
        title: 'Synonym Expansion',
        body: 'Browser-level synonym mapper expands acronyms for better search relevance.',
        badge: { kind: 'code', label: 'e.g. pto → vacation' },
      },
    ],
    branch: {
      number: 5,
      icon: Box,
      title: 'Vectorize or Index',
      body: 'Choose your search mode (set in your settings).',
      badge: { kind: 'tag', label: 'Vector or Keyword' },
      a: {
        number: '5A',
        title: 'Vectorize (WASM)',
        icon: LayoutGrid,
        body: 'Browser WASM loads ONNX model and generates vector embeddings.',
        badge: null,
      },
      b: {
        number: '5B',
        title: 'Keyword Index',
        icon: Search,
        body: 'Browser builds a serialized MiniSearch keyword index.',
        badge: { kind: 'tag', label: 'MiniSearch Index' },
      },
    },
    end: {
      number: 6,
      icon: Database,
      title: 'Store in Your DB',
      body: 'Chunks, vectors or index are written to your database. We never store them.',
      badge: { kind: 'tag', label: 'Your Database' },
    },
  },
  query: {
    label: 'B. Employee Query Pipeline',
    caption: 'Employees ask questions and get accurate answers from your private knowledge base.',
    cards: [
      {
        number: 1,
        icon: MessageCircle,
        title: 'Ask Question',
        body: 'Employee types a question into the chat widget on any channel.',
        badge: { kind: 'code', label: 'POST /api/chat' },
      },
      {
        number: 2,
        icon: Filter,
        title: 'Query Processing',
        body: 'Browser trims, normalizes and strips PII from the raw input.',
        badge: { kind: 'tag', label: 'Trimmed + Normalized' },
      },
      {
        number: 3,
        icon: Network,
        title: 'Synonym Expansion',
        body: 'Same browser-level mapper expands acronyms for better recall.',
        badge: { kind: 'code', label: 'e.g. pto → vacation' },
      },
      {
        number: 4,
        icon: Cpu,
        title: 'Embed Query',
        body: 'Browser WASM generates a query vector using the same ONNX model.',
        badge: { kind: 'tag', label: '384-dim Vector' },
      },
    ],
    branch: {
      number: 5,
      icon: BarChart3,
      title: 'Search & Rank',
      body: 'Run retrieval against the index in your database.',
      badge: { kind: 'tag', label: 'Vector or Keyword' },
      a: {
        number: '5A',
        title: 'Vector Search',
        icon: LayoutGrid,
        body: 'Cosine similarity lookup across the stored vectors.',
        badge: { kind: 'tag', label: 'Top-K Matches' },
      },
      b: {
        number: '5B',
        title: 'Keyword Search',
        icon: Search,
        body: 'MiniSearch index returns ranked BM25 matches.',
        badge: { kind: 'tag', label: 'BM25 Top-K' },
      },
    },
    end: {
      number: 6,
      icon: Sparkles,
      title: 'LLM Answer',
      body: 'Top chunks + question are sent to your LLM. Answer streams back in real time.',
      badge: { kind: 'tag', label: 'Your Provider' },
    },
  },
};

function PipelineCard({ number, icon: Icon, title, body, badge }) {
  return (
    <div className="hr-pipe-card">
      <div className="hr-pipe-card-top">
        <span className="hr-pipe-num">{number}</span>
        <h4>{title}</h4>
      </div>
      <div className="hr-pipe-icon-wrap">
        <Icon size={26} strokeWidth={1.6} />
      </div>
      <p>{body}</p>
      {badge ? (
        <span className={`hr-pipe-badge hr-pipe-badge-${badge.kind}`}>{badge.label}</span>
      ) : null}
    </div>
  );
}

function Arrow() {
  return (
    <span className="hr-pipe-arrow" aria-hidden="true">
      <svg viewBox="0 0 32 14" width="32" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 7h24" stroke="#0f6a4d" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" />
        <path d="M22 2l6 5-6 5" stroke="#0f6a4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

function BranchConnector() {
  return (
    <span className="hr-pipe-branch-connector" aria-hidden="true">
      <svg viewBox="0 0 28 14" width="28" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 7h20" stroke="#0f6a4d" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" />
        <path d="M18 2l6 5-6 5" stroke="#0f6a4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

function Flow({ pipeline }) {
  return (
    <div className="hr-hiw-flow">
      {pipeline.cards.map((card) => (
        <Fragment key={card.number}>
          <PipelineCard {...card} />
          {card.number < pipeline.cards.length ? <Arrow /> : null}
        </Fragment>
      ))}

      <Arrow />

      <PipelineCard {...pipeline.branch} />

      <div className="hr-pipe-branches">
        <div className="hr-pipe-branch-row">
          <span className="hr-pipe-branch-label hr-pipe-branch-on">Pinecone Enabled</span>
          <BranchConnector />
          <div className="hr-pipe-branch-card">
            <div className="hr-pipe-card-top">
              <span className="hr-pipe-num">{pipeline.branch.a.number}</span>
              <h4>{pipeline.branch.a.title}</h4>
            </div>
            <div className="hr-pipe-icon-wrap">
              <pipeline.branch.a.icon size={22} strokeWidth={1.6} />
            </div>
            <p>{pipeline.branch.a.body}</p>
            {pipeline.branch.a.badge ? (
              <span className={`hr-pipe-badge hr-pipe-badge-${pipeline.branch.a.badge.kind}`}>
                {pipeline.branch.a.badge.label}
              </span>
            ) : null}
          </div>
        </div>

        <div className="hr-pipe-branch-row">
          <span className="hr-pipe-branch-label hr-pipe-branch-off">Pinecone Disabled</span>
          <BranchConnector />
          <div className="hr-pipe-branch-card">
            <div className="hr-pipe-card-top">
              <span className="hr-pipe-num">{pipeline.branch.b.number}</span>
              <h4>{pipeline.branch.b.title}</h4>
            </div>
            <div className="hr-pipe-icon-wrap">
              <pipeline.branch.b.icon size={22} strokeWidth={1.6} />
            </div>
            <p>{pipeline.branch.b.body}</p>
            {pipeline.branch.b.badge ? (
              <span className={`hr-pipe-badge hr-pipe-badge-${pipeline.branch.b.badge.kind}`}>
                {pipeline.branch.b.badge.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Arrow />

      <PipelineCard {...pipeline.end} />
    </div>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState('upload');
  const pipeline = PIPELINES[active];

  return (
    <section className="hr-how-it-works" id="how-it-works">
      <div className="hr-hiw-bg" aria-hidden="true">
        <span className="hr-hiw-doc hr-hiw-doc-pdf">
          <FileText size={20} strokeWidth={1.6} />
          <em>PDF</em>
        </span>
        <span className="hr-hiw-doc hr-hiw-doc-docx">
          <FileText size={20} strokeWidth={1.6} />
          <em>DOCX</em>
        </span>
        <span className="hr-hiw-doc hr-hiw-doc-txt">
          <FileText size={20} strokeWidth={1.6} />
          <em>TXT</em>
        </span>
        <span className="hr-hiw-doc hr-hiw-doc-folder">
          <Folder size={26} strokeWidth={1.4} />
        </span>
        <svg className="hr-hiw-curve" viewBox="0 0 1200 360" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 60 80 Q 300 30 520 130" stroke="#a8c5b9" strokeWidth="1.4" strokeDasharray="3 5" fill="none" />
          <path d="M 40 200 Q 280 150 540 250" stroke="#a8c5b9" strokeWidth="1.4" strokeDasharray="3 5" fill="none" />
          <path d="M 680 130 Q 880 50 1140 110" stroke="#a8c5b9" strokeWidth="1.4" strokeDasharray="3 5" fill="none" />
          <path d="M 700 250 Q 900 200 1150 240" stroke="#a8c5b9" strokeWidth="1.4" strokeDasharray="3 5" fill="none" />
        </svg>
      </div>

      <div className="hr-hiw-header">
        <h2>How HushRag Works</h2>
        <p className="hr-hiw-subtitle">Two simple pipelines. 100% private.</p>
      </div>

      <div className="hr-hiw-tabs" role="tablist">
        {Object.entries(PIPELINES).map(([key, p]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            className={`hr-hiw-tab${active === key ? ' hr-hiw-tab-active' : ''}`}
            onClick={() => setActive(key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="hr-hiw-caption">{pipeline.caption}</p>

      <Flow pipeline={pipeline} key={active} />
    </section>
  );
}
