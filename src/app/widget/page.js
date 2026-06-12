'use client';

import { useState, useEffect, useRef } from 'react';
import { searchIndex } from '@/lib/client-search';
import { generateQueryEmbedding } from '@/lib/embeddings-client';
import { parseMarkdown } from '@/lib/markdown';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WidgetPage() {
  const [orgId, setOrgId] = useState('');
  const [locked, setLocked] = useState(null); // null = checking access, true = locked, false = unlocked
  const [passcode, setPasscode] = useState('');
  const [lockedError, setLockedError] = useState('');
  const [channel, setChannel] = useState('web-widget');

  // Conversation state
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [pineconeEnabled, setPineconeEnabled] = useState(false);

  const chatBottomRef = useRef(null);

  // Parse query params and initiate access check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const org = params.get('org') || '';
    const ch = params.get('channel') || 'web-widget';
    const passQuery = params.get('pass') || '';

    setOrgId(org);
    setChannel(ch);
    setSessionId('sess_' + Math.random().toString(36).substr(2, 9));

    if (org) {
      const isVerified = sessionStorage.getItem(`sp_verified_${org}`) === 'true';
      if (isVerified) {
        setLocked(false);
        // Load settings to fetch pinecone config
        checkAccess(org, '', true);
      } else {
        checkAccess(org, passQuery, false);
      }
    } else {
      setLocked(true);
    }
  }, []);

  // Check organization access code settings
  const checkAccess = async (org, passQuery, alreadyVerified) => {
    try {
      const res = await fetch(`/api/settings?orgId=${org}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data) {
        setPineconeEnabled(data.pinecone_enabled === 1);
        if (alreadyVerified) {
          setLocked(false);
          return;
        }

        if (data.has_access_code) {
          if (passQuery) {
            const verifyRes = await fetch('/api/channels/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orgId: org, code: passQuery })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              sessionStorage.setItem(`sp_verified_${org}`, 'true');
              setLocked(false);
              return;
            }
          }
          setLocked(true);
        } else {
          setLocked(false);
        }
      } else {
        setLocked(false);
      }
    } catch (e) {
      console.error('Failed to load settings or verify access in widget:', e);
      setLocked(false); // Fallback to avoid completely blocking users on transient network errors
    }
  };

  // Welcome the user once unlocked
  useEffect(() => {
    if (!orgId || locked !== false) return;
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I am your policy assistant. Ask me anything about our company guidelines.'
      }
    ]);
  }, [orgId, locked]);

  // Handle unlock request from code prompt form
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passcode.trim() || loading) return;
    setLoading(true);
    setLockedError('');

    try {
      const res = await fetch('/api/channels/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, code: passcode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(`sp_verified_${orgId}`, 'true');
        setLocked(false);
      } else {
        setLockedError(data.error || 'Invalid access code.');
      }
    } catch (err) {
      setLockedError('Failed to verify access code.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);


  // Select category
  const selectCategory = (category) => {
    setActiveCategory(category);
    setMessages(prev => [
      ...prev.filter(m => !m.isSystemOptions),
      { role: 'user', content: `Selected Category: ${category.name}` },
      { role: 'assistant', content: `Great! You are now asking in the **${category.name}** folder. What would you like to know?` }
    ]);
  };

  // Perform search and LLM completion
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // 1. Generate query embedding if Pinecone is enabled
      let queryVector = null;
      if (pineconeEnabled) {
        queryVector = await generateQueryEmbedding(userMessage);
      }

      // 2. Fetch search matches from unified API
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          categoryId: activeCategory ? activeCategory.id : null,
          query: userMessage,
          vector: queryVector,
          limit: 8
        })
      });

      if (!searchRes.ok) {
        throw new Error('Failed to resolve search query.');
      }

      const topChunks = await searchRes.json();
      const contextText = topChunks.map(c => `[Section: ${c.title}]\n${c.text}`).join('\n\n');

      // 3. Call serverless API
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          query: userMessage,
          context: contextText,
          history: messages.filter(m => !m.isSystemOptions).slice(-6).map(m => ({ role: m.role, content: m.content })),
          stream: true
        })
      });

      if (!chatRes.ok) {
        let errMsg = 'Chat server error.';
        try {
          const chatErr = await chatRes.json();
          errMsg = chatErr.error || errMsg;
        } catch (_) {
          try {
            const errText = await chatRes.text();
            errMsg = errText || errMsg;
          } catch (_) {}
        }
        throw new Error(errMsg);
      }

      // Initialize the assistant message in UI state
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          assistantMessage += chunk;
          setMessages(prev => {
            const list = [...prev];
            list[list.length - 1] = { role: 'assistant', content: assistantMessage };
            return list;
          });
        }
      }

      // 4. Save chat history log for audit (Asynchronously)
      const updatedHistory = [
        ...messages.filter(m => !m.isSystemOptions), 
        { role: 'user', content: userMessage }, 
        { role: 'assistant', content: assistantMessage }
      ];

      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          sessionId,
          channel,
          history: updatedHistory
        })
      }).catch(e => console.error('Failed to log audit chat:', e));

    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.parent.postMessage('sp-close-chat', '*');
  };

  if (locked === null) {
    return (
      <div className="widget-container" style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading assistant...</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="widget-container" style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {/* Widget Header */}
        <div className="widget-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="pulse-indicator" style={{ backgroundColor: 'var(--warning)' }}></span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Policy Assistant</h4>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Secure • Powered by HushRag</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={handleClose} className="widget-header-btn" title="Close Widget" style={{ fontSize: '1.1rem', padding: '0.2rem 0.4rem' }}>
              ✖
            </button>
          </div>
        </div>

        {/* Lock Screen UI */}
        <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--bg-sidebar)' }}>
          <Card className="widget-locked-card" style={{ border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent style={{ padding: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>🔒</div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem' }}>Access Code Required</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  This assistant is restricted. Please enter your employee access code to continue.
                </p>
              </div>

              <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  style={{ textAlign: 'center' }}
                  disabled={loading}
                />
                {lockedError && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 500 }}>
                    {lockedError}
                  </span>
                )}
                <Button type="submit" disabled={loading} style={{ width: '100%', fontWeight: 600 }}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container" style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Widget Header */}
      <div className="widget-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="pulse-indicator"></span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Policy Assistant</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Secure • Powered by HushRag</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={handleClose} className="widget-header-btn" title="Close Widget" style={{ fontSize: '1.1rem', padding: '0.2rem 0.4rem' }}>
            ✖
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flexGrow: 1, minHeight: 0, padding: '1.25rem 1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div
              className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
            />
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bubble-bot" style={{ opacity: 0.6 }}>
            Processing query...
          </div>
        )}
        <div ref={chatBottomRef}></div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="chat-input-area widget-input-area" style={{ flexShrink: 0, padding: '0.75rem 1rem' }}>
        <Input
          type="text"
          placeholder="Type a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flexGrow: 1 }}
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </div>
  );
}
