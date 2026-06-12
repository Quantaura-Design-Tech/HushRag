'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LandingAndAuthPage() {
  // Navigation & Page State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Database active tab selector in bento grid
  const [activeDbVisual, setActiveDbVisual] = useState('turso');

  // Interactive Bot Simulator State
  const [simMessages, setSimMessages] = useState([
    { role: 'bot', content: 'Hello! I am your local policy assistant. Ask me anything about our company guidelines.' }
  ]);
  const [simLoading, setSimLoading] = useState(false);
  const simEndRef = useRef(null);

  // Auto-scroll simulation chat
  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, simLoading]);

  // Check if already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  // Database visual auto-switching demo
  useEffect(() => {
    const dbs = ['turso', 'supabase', 'mongodb'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % dbs.length;
      setActiveDbVisual(dbs[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle Auth submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'signup',
          email,
          password,
          orgName: isLogin ? undefined : orgName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Store auth session
      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', data.orgId);
      localStorage.setItem('orgName', data.orgName);
      localStorage.setItem('userEmail', data.email);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run chat simulator questions
  const handleSimQuestion = (question, answer) => {
    if (simLoading) return;

    // Add user message
    setSimMessages((prev) => [...prev, { role: 'user', content: question }]);
    setSimLoading(true);

    // Simulate short network chunk latency
    setTimeout(() => {
      setSimMessages((prev) => [...prev, { role: 'bot', content: answer }]);
      setSimLoading(false);
    }, 1200);
  };

  return (
    <div className="landing-page">
      <div className="landing-glow-1"></div>
      <div className="landing-glow-2"></div>

      {/* HEADER / NAV */}
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-accent">■</span> HushRag
        </div>
        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#security" className="landing-nav-link">Zero-Knowledge</a>
          <a href="#demo" className="landing-nav-link">Interactive Demo</a>
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button 
            variant="ghost" 
            style={{ color: '#ffffff', fontWeight: 500 }} 
            onClick={() => { setIsLogin(true); setIsAuthOpen(true); }}
          >
            Sign In
          </Button>
          <Button 
            style={{ backgroundColor: '#ffffff', color: '#09090b', fontWeight: 600, border: 'none' }}
            onClick={() => { setIsLogin(false); setIsAuthOpen(true); }}
          >
            Deploy Free
          </Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="landing-hero-section">
        <div className="hero-content">
          <div className="hero-tagline">
            <span className="pulse-indicator"></span>
            <span>Enterprise-Grade local security</span>
          </div>
          <h1 className="hero-headline">HushRag: The Airtight Policy AI Bot.</h1>
          <p className="hero-description">
            A secure, Zero-Knowledge platform that runs corporate policy indexing directly in your browser. Document chunks, vector embeddings, and connection credentials remain inside your private systems.
          </p>
          <div className="hero-ctas">
            <Button 
              size="lg" 
              style={{ backgroundColor: '#34d399', color: '#09090b', fontWeight: 600, padding: '0 2rem' }}
              onClick={() => { setIsLogin(false); setIsAuthOpen(true); }}
            >
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
              onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Try Interactive Demo
            </Button>
          </div>
        </div>

        {/* Hero visual: Actual generated Awwwards-style design mockup */}
        <div className="hero-graphic-pane">
          <img 
            src="/images/hero_section.png" 
            alt="HushRag Enclave Secured Design Board" 
            style={{ 
              width: '100%', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)' 
            }} 
          />
        </div>
      </section>

      {/* FEATURES BENTO GRID */}
      <section id="features" className="landing-bento-section">
        <div className="section-header">
          <h2>Engineered for Strict Corporate Privacy</h2>
          <p>We eliminate standard SaaS liability by moving heavy processing to the edge.</p>
        </div>

        <div className="bento-grid">
          {/* Bento Block 1: BYODB connection */}
          <div className="bento-card">
            <div>
              <h3 className="bento-title">Bring Your Own Database (BYODB)</h3>
              <p className="bento-desc">
                Your folder categories, parsed plaintext paragraphs, and chat history logs reside within your private datastore. Support for modern serverless and cloud database endpoints.
              </p>
            </div>
            
            <div className="bento-visual">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa' }}>ACTIVE DATABASE ENGINES</span>
              <div className="db-selectors">
                <div className={`db-logo-card ${activeDbVisual === 'turso' ? 'active' : ''}`}>
                  <span>⚡</span> Turso SQLite
                </div>
                <div className={`db-logo-card ${activeDbVisual === 'supabase' ? 'active' : ''}`}>
                  <span>🔌</span> Supabase
                </div>
                <div className={`db-logo-card ${activeDbVisual === 'mongodb' ? 'active' : ''}`}>
                  <span>🍃</span> MongoDB Atlas
                </div>
              </div>
            </div>
          </div>

          {/* Bento Block 2: In-browser WASM */}
          <div className="bento-card">
            <div>
              <h3 className="bento-title">In-Browser WASM Indexing</h3>
              <p className="bento-desc">
                We load a 23MB ONNX embedding model directly inside the employee browser. Text chunk vector calculation is performed locally, eliminating OpenAI API token costs.
              </p>
            </div>

            <div className="bento-visual" style={{ gap: '0.5rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>ONNX model: all-MiniLM-L6-v2</span>
                <span style={{ color: '#34d399' }}>WASM Loaded</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#34d399', borderRadius: '4px' }}></div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Speed metric: vector computed in ~14ms</span>
            </div>
          </div>

          {/* Bento Block 3: Passcode Security (Full width) */}
          <div className="bento-card full-width" id="security">
            <div>
              <h3 className="bento-title">Airtight Channel Verification</h3>
              <p className="bento-desc">
                Protect internal handbooks from external access. Configure a master access code. Our loader script caches verification securely in sessionStorage, allowing smooth user experience without repeated logins. Add bots easily to WhatsApp or Telegram with encrypted Webhook security bounds.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#34d399' }}>✓</span> Secure Passcode Removal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#34d399' }}>✓</span> sessionStorage persistence
                </div>
              </div>
            </div>

            <div className="bento-visual" style={{ alignSelf: 'stretch', justifyContent: 'center', backgroundColor: 'rgba(9,9,11,0.6)' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backgroundColor: 'rgba(24,24,27,0.5)', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem', color: '#ef4444' }}>🔒 Restrictive Access</span>
                <div style={{ width: '100%', height: '36px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#a1a1aa' }}>
                  ••••••••••••
                </div>
                <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'block', marginTop: '0.5rem' }}>
                  Client hashes verify instantly. Plaintext passcodes never stored on our servers.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Features Bento image comp from design board */}
        <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Data Ownership Architecture Board
          </span>
          <img 
            src="/images/features_bento.png" 
            alt="HushRag Data Ownership Bento Grid Design Board" 
            style={{ 
              width: '100%', 
              maxWidth: '960px', 
              borderRadius: '24px', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)' 
            }} 
          />
        </div>
      </section>

      {/* INTERACTIVE DEMO SHOWCASE */}
      <section id="demo" className="landing-bento-section" style={{ backgroundColor: 'rgba(9, 9, 11, 0.4)', borderTop: '1px solid rgba(39, 39, 42, 0.3)', borderBottom: '1px solid rgba(39, 39, 42, 0.3)' }}>
        <div className="section-header">
          <h2>Test the Policy Assistant</h2>
          <p>Interact with the live simulator below to experience how the Zero-Knowledge widget responds.</p>
        </div>

        <div className="sim-container">
          <div className="widget-simulator-card">
            {/* Header */}
            <div className="sim-header">
              <div className="sim-status">
                <span className="pulse-indicator"></span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>HushRag Assistant</h4>
                  <span style={{ fontSize: '0.65rem', color: '#71717a' }}>✓ Zero-Knowledge Secured</span>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717a' }}>Demo Mode</span>
            </div>

            {/* Messages body */}
            <div className="sim-messages">
              {simMessages.map((msg, i) => (
                <div key={i} className={`sim-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.content}
                </div>
              ))}
              {simLoading && (
                <div className="sim-bubble bot" style={{ opacity: 0.6 }}>
                  Thinking & matching local index...
                </div>
              )}
              <div ref={simEndRef} />
            </div>

            {/* Suggestion prompts */}
            <div className="sim-suggested">
              <span>SUGGESTED QUESTIONS</span>
              <button 
                className="sim-chip"
                onClick={() => handleSimQuestion(
                  'What is our remote work policy?',
                  'Our remote work policy allows for up to 3 days of remote work per week, subject to departmental approval. Please refer to Section 4.2 of the Employee Handbook v3.1 for full details.'
                )}
                disabled={simLoading}
              >
                💼 What is our remote work policy?
              </button>
              <button 
                className="sim-chip"
                onClick={() => handleSimQuestion(
                  'Is my policy data stored on your servers?',
                  'No! HushRag is a zero-knowledge platform. Documents are tokenized in the browser and stored directly in your own private database (Turso/Supabase/Firestore). We store 0% of your documents.'
                )}
                disabled={simLoading}
              >
                🔒 Is my policy data stored on your servers?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <footer className="landing-footer">
        <div className="footer-cta">
          <h2>Ready to secure your company knowledge?</h2>
          <p>Deploy your local zero-knowledge policy assistant bot in under 5 minutes.</p>

          <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/images/cta_footer.png" 
              alt="HushRag CTA Sign-up Design Board" 
              style={{ 
                width: '100%', 
                maxWidth: '640px', 
                borderRadius: '20px', 
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)' 
              }} 
            />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setIsLogin(false); setIsAuthOpen(true); }} className="footer-form">
            <Input 
              type="email" 
              placeholder="Enter your business email" 
              required 
              style={{ backgroundColor: 'rgba(24, 24, 27, 0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              type="submit" 
              style={{ backgroundColor: '#34d399', color: '#09090b', fontWeight: 600, border: 'none' }}
            >
              Get Started
            </Button>
          </form>
        </div>

        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#security" className="footer-link">Security Whitepaper</a>
          <a href="https://github.com/harildixit/HushRag" target="_blank" className="footer-link">GitHub</a>
          <a href="mailto:contact@quantaura.in" className="footer-link">Support</a>
        </div>

        <div className="footer-copy">
          <p>© 2026 Quantaura Design Tech Pvt. Ltd. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#3f3f46' }}>
            Contact: contact@quantaura.in • Website: quantaura.in
          </p>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {isAuthOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-content">
            <button 
              className="auth-modal-close" 
              onClick={() => { setIsAuthOpen(false); setError(''); }}
              title="Close modal"
            >
              ✖
            </button>

            <div style={{ padding: '2.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {isLogin ? 'Sign In to HushRag' : 'Create Admin Account'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
                  {isLogin ? 'Enter credentials to manage your policy bot' : 'Set up your zero-knowledge organization panel'}
                </p>
              </div>

              <Tabs value={isLogin ? 'login' : 'signup'} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => { setIsLogin(true); setError(''); }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    onClick={() => { setIsLogin(false); setError(''); }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {error && (
                <div className="error-alert" style={{ marginBottom: '1.25rem' }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#52525b', fontSize: '0.75rem' }}>Organization Name</label>
                    <Input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required={!isLogin}
                      style={{ border: '1px solid #e4e4e7', color: '#09090b' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: '#52525b', fontSize: '0.75rem' }}>Email Address</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ border: '1px solid #e4e4e7', color: '#09090b' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#52525b', fontSize: '0.75rem' }}>Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ border: '1px solid #e4e4e7', color: '#09090b' }}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  style={{ backgroundColor: '#09090b', color: '#ffffff', fontWeight: 600, marginTop: '0.5rem' }}
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
