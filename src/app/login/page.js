'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowLeft, ShieldCheck, Database, Zap, Eye, EyeOff } from 'lucide-react';

function HushRagMark() {
  return (
    <span className="hr-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync tab mode with query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
      setIsLogin(false);
    }
  }, []);

  // Protect route: Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
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
          orgName: isLogin ? undefined : orgName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', data.orgId);
      localStorage.setItem('orgName', data.orgName);
      localStorage.setItem('userEmail', data.email);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="auth-split-layout">
        
        {/* Left Pane - Brand Info */}
        <div className="auth-brand-pane">
          <a className="hr-brand" href="/" aria-label="HushRag home" style={{ display: 'inline-flex', alignSelf: 'flex-start', marginBottom: '1rem' }}>
            <HushRagMark />
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>HushRag</span>
          </a>

          <h1 className="auth-brand-title">
            Private AI support,<br />
            live in minutes.
          </h1>

          <p className="auth-brand-desc">
            Connect your company knowledge base, configure access rules, and deploy a secure assistant to your team—without storing any data on our servers.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span className="auth-feature-icon"><Lock size={16} /></span>
              <span>Zero-Knowledge Encryption by default</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon"><Database size={16} /></span>
              <span>BYODB: Connect to your database</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon"><ShieldCheck size={16} /></span>
              <span>Client-side security and WASM processing</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon"><Zap size={16} /></span>
              <span>Deploy to Web, Telegram, and WhatsApp</span>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#607070', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back to homepage
            </a>
          </div>
        </div>

        {/* Right Pane - Card Form */}
        <div className="auth-card-pane">
          <div className="auth-card hr-auth-modal" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            
            <div className="hr-auth-header">
              <HushRagMark />
              <h2>{isLogin ? 'Sign In to HushRag' : 'Create Admin Account'}</h2>
              <p>{isLogin ? 'Manage your private policy assistant.' : 'Set up your zero-knowledge workspace.'}</p>
            </div>

            <div className="hr-auth-tabs" role="tablist" aria-label="Authentication mode">
              <button className={isLogin ? 'active' : ''} type="button" onClick={() => { setIsLogin(true); setError(''); }}>
                Login
              </button>
              <button className={!isLogin ? 'active' : ''} type="button" onClick={() => { setIsLogin(false); setError(''); }}>
                Sign Up
              </button>
            </div>

            {error && <div className="hr-error-alert">{error}</div>}

            <form className="hr-auth-form" onSubmit={handleAuthSubmit}>
              {!isLogin && (
                <label>
                  Organization Name
                  <Input
                    type="text"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    required
                  />
                </label>
              )}

              <label>
                Email Address
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                Password
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#607070',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <Button className="hr-btn hr-btn-primary hr-auth-submit" type="submit" disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
