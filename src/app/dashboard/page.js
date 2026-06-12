'use client';

import { useState, useEffect, useRef } from 'react';
import { splitMarkdownIntoChunks, buildSearchIndex, searchIndex } from '@/lib/client-search';
import { generateEmbeddings, generateQueryEmbedding } from '@/lib/embeddings-client';
import { parseMarkdown } from '@/lib/markdown';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardPage() {
  // Authentication state
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [passphrase, setPassphrase] = useState('saas_mode'); // Bypass passphrase lock overlay
  
  // Dashboard navigation state
  const [activeTab, setActiveTab] = useState('files'); // 'files', 'settings', 'channels', 'audit-logs', 'playground'

  // Categories & Documents CMS state
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [cmsError, setCmsError] = useState('');
  const [cmsSuccess, setCmsSuccess] = useState('');
  const fileInputRef = useRef(null);
  const decryptedIndexCache = useRef({});



  // Settings state
  const [llmProvider, setLlmProvider] = useState('openai');
  const [activeModel, setActiveModel] = useState('gpt-4o-mini');
  const [customModelId, setCustomModelId] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [dbProvider, setDbProvider] = useState('sqlite-local');
  const [dbCredentials, setDbCredentials] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [whatsappConfig, setWhatsappConfig] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [hostedBotPassphrase, setHostedBotPassphrase] = useState('');
  const [employeeAccessCode, setEmployeeAccessCode] = useState('');
  const [hasAccessCode, setHasAccessCode] = useState(false);
  const [pineconeEnabled, setPineconeEnabled] = useState(false);
  const [pineconeKey, setPineconeKey] = useState('');
  const [pineconeHost, setPineconeHost] = useState('');
  const [embeddingProvider, setEmbeddingProvider] = useState('in-process');
  const [embeddingKey, setEmbeddingKey] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('all-MiniLM-L6-v2');
  const [allDocuments, setAllDocuments] = useState([]);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [telegramConnecting, setTelegramConnecting] = useState(false);
  const [telegramStatusMsg, setTelegramStatusMsg] = useState('');
  const [connectedBotUsername, setConnectedBotUsername] = useState('');

  // Channels configuration
  const [widgetKeyType, setWidgetKeyType] = useState('embed'); // 'embed' or 'prompt'

  // Audit Logs state
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Playground state
  const [playgroundCategory, setPlaygroundCategory] = useState('all');
  const [playgroundMessages, setPlaygroundMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your policy assistant. Please select a category folder or type a question to get started.' }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [debugChunks, setDebugChunks] = useState([]);
  const [playgroundSessionId, setPlaygroundSessionId] = useState('');

  const clearIndexCache = () => {
    decryptedIndexCache.current = {};
  };

  useEffect(() => {
    clearIndexCache();
  }, [activeCategory, playgroundCategory]);

  // Check login session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedOrgId = localStorage.getItem('orgId');
    const storedOrgName = localStorage.getItem('orgName');
    const storedEmail = localStorage.getItem('userEmail');

    if (!token || !storedOrgId) {
      window.location.href = '/';
      return;
    }

    setOrgId(storedOrgId);
    setOrgName(storedOrgName);
    setUserEmail(storedEmail);
    setPlaygroundSessionId('play_' + Math.random().toString(36).substr(2, 9));
  }, []);

  // Fetch initial data once orgId is resolved
  useEffect(() => {
    if (!orgId) return;
    fetchSettings();
    fetchCategories();
    fetchAllDocuments();
  }, [orgId]);

  // Load Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/settings?orgId=${orgId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load settings.');
      const data = await res.json();
      if (data) {
        setLlmProvider(data.llm_provider || 'openai');
        const model = data.active_model || 'gpt-4o-mini';
        if (data.llm_provider === 'openrouter' && !['google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat'].includes(model)) {
          setActiveModel('custom');
          setCustomModelId(model);
        } else {
          setActiveModel(model);
        }
        setDbProvider(data.db_provider || 'sqlite-local');
        setDbCredentials(data.encrypted_db_credentials || '{}');
        setTelegramToken(data.telegram_token || '');
        setWhatsappConfig(data.whatsapp_config || '');
        setLlmKey(data.llm_key || '');
        setHasAccessCode(data.has_access_code || false);
        setPineconeEnabled(data.pinecone_enabled === 1);
        setPineconeKey(data.pinecone_key || '');
        setPineconeHost(data.pinecone_host || '');
        setEmbeddingProvider(data.embedding_provider || 'in-process');
        setEmbeddingKey(data.embedding_key || '');
        setEmbeddingModel(data.embedding_model || 'all-MiniLM-L6-v2');

        if (data.telegram_token) {
          fetch(`https://api.telegram.org/bot${data.telegram_token}/getMe`)
            .then(res => res.json())
            .then(botData => {
              if (botData.ok && botData.result) {
                setConnectedBotUsername(botData.result.username);
              }
            })
            .catch(e => console.warn('Failed to load bot details:', e));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load categories in plaintext
  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?orgId=${orgId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load categories.');
      const data = await res.json();
      setCategories(data.map(cat => ({
        id: cat.id,
        name: cat.name || '',
        desc: cat.description || ''
      })));
    } catch (e) {
      console.error(e);
    }
  };

  // Load documents in plaintext
  const fetchDocuments = async (categoryId = null) => {
    try {
      const url = categoryId 
        ? `/api/documents?orgId=${orgId}&categoryId=${categoryId}`
        : `/api/documents?orgId=${orgId}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load documents.');
      const data = await res.json();
      setDocuments(data.map(doc => ({
        id: doc.id,
        category_id: doc.category_id,
        name: doc.name || '',
        chunks: doc.chunks || '[]',
        search_index: doc.search_index || '{}'
      })));
    } catch (e) {
      console.error(e);
    }
  };

  // Load all documents (independent of active category) for count warning
  const fetchAllDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?orgId=${orgId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load all documents.');
      const data = await res.json();
      setAllDocuments(data.map(doc => ({
        id: doc.id,
        category_id: doc.category_id,
        name: doc.name || '',
        chunks: doc.chunks || '[]',
        search_index: doc.search_index || '{}'
      })));
    } catch (e) {
      console.error('Failed to load all documents:', e);
    }
  };

  // Create new category folder
  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setCmsError('');
      const categoryId = 'cat_' + Math.random().toString(36).substr(2, 9);

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          categoryId,
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim()
        })
      });

      if (!res.ok) {
        let errMsg = 'Failed to save category folder.';
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      setNewCategoryName('');
      setNewCategoryDesc('');
      setCmsSuccess('Folder created successfully!');
      clearIndexCache();
      fetchCategories();
      setTimeout(() => setCmsSuccess(''), 3000);
    } catch (err) {
      setCmsError(err.message);
      setTimeout(() => setCmsError(''), 5000);
    }
  };

  // Delete category folder
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this folder? This will delete all documents inside it.')) return;
    try {
      const res = await fetch(`/api/categories?orgId=${orgId}&categoryId=${categoryId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete category.');
      
      setActiveCategory(null);
      clearIndexCache();
      fetchCategories();
      setDocuments([]);
    } catch (err) {
      setCmsError(err.message);
    }
  };

  // Handle Document upload and parsing
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeCategory) return;

    console.log('[Upload] Starting handleUploadFile for file:', file.name, 'size:', file.size, 'type:', file.type);
    setUploadingFile(true);
    setUploadStatusMsg('Parsing document content...');
    setCmsError('');
    setCmsSuccess('');

    try {
      // 1. Upload to stateless parser API
      const formData = new FormData();
      formData.append('file', file);

      console.log('[Upload] Sending file to /api/parse...');
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        body: formData
      });

      console.log('[Upload] /api/parse response status:', parseRes.status, parseRes.statusText);
      if (!parseRes.ok) {
        const parseErr = await parseRes.json();
        console.error('[Upload] /api/parse failed with error:', parseErr);
        throw new Error(parseErr.error || 'Failed to parse file.');
      }

      const parseData = await parseRes.json();
      if (!parseData || typeof parseData !== 'object') {
        console.error('[Upload] /api/parse returned invalid JSON:', parseData);
        throw new Error('Invalid response received from parser.');
      }
      const markdown = parseData.markdown || '';
      console.log('[Upload] /api/parse succeeded. Markdown length:', markdown.length);

      // 2. Split text and index locally
      console.log('[Upload] Splitting markdown into chunks...');
      setUploadStatusMsg('Chunking policy sections...');
      const chunks = splitMarkdownIntoChunks(markdown);
      console.log('[Upload] splitMarkdownIntoChunks returned chunks:', chunks.length);
      
      console.log('[Upload] Building MiniSearch index...');
      const { indexJson, chunksJson } = buildSearchIndex(chunks);
      console.log('[Upload] buildSearchIndex completed.');

      const documentId = 'doc_' + Math.random().toString(36).substr(2, 9);

      // Client-side embeddings if Pinecone is enabled
      let vectors = null;
      console.log('[Upload] pineconeEnabled state:', pineconeEnabled);
      if (pineconeEnabled) {
        setUploadStatusMsg('Generating browser embeddings (WASM)...');
        const textsToEmbed = chunks.map(c => c.text);
        console.log('[Upload] Generating browser embeddings for texts:', textsToEmbed.length);
        vectors = await generateEmbeddings(textsToEmbed);
        console.log('[Upload] generateEmbeddings returned vectors:', vectors ? vectors.length : null);
      }

      setUploadStatusMsg('Saving policy files to cloud...');
      console.log('[Upload] Saving document metadata to /api/documents...');
      // 4. Save plaintext payload & vectors to SaaS DB
      const saveRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          documentId,
          categoryId: activeCategory.id,
          name: file.name,
          chunks: chunksJson,
          search_index: indexJson,
          vectors
        })
      });

      console.log('[Upload] /api/documents response status:', saveRes.status, saveRes.statusText);
      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        console.error('[Upload] /api/documents failed with error:', saveErr);
        throw new Error(saveErr.error || 'Failed to save document metadata.');
      }

      console.log('[Upload] Document uploaded successfully!');
      setCmsSuccess(`Document "${file.name}" uploaded successfully!`);
      clearIndexCache();
      fetchDocuments(activeCategory.id);
      fetchAllDocuments();
      setTimeout(() => setCmsSuccess(''), 4000);
    } catch (err) {
      console.error('[Upload] Captured exception during upload flow:', err);
      setCmsError(err.message);
    } finally {
      setUploadingFile(false);
      setUploadStatusMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete Document
  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents?orgId=${orgId}&documentId=${documentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete document.');
      clearIndexCache();
      fetchDocuments(activeCategory.id);
      fetchAllDocuments();
    } catch (err) {
      setCmsError(err.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSettingsStatus('Saving settings...');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          llm_provider: llmProvider,
          active_model: (activeModel === 'custom' && llmProvider === 'openrouter') ? customModelId : activeModel,
          llm_key: llmKey,
          db_provider: dbProvider,
          encrypted_db_credentials: dbCredentials,
          telegram_token: telegramToken,
          whatsapp_config: whatsappConfig,
          employee_access_code: employeeAccessCode,
          pinecone_enabled: pineconeEnabled ? 1 : 0,
          pinecone_key: pineconeKey,
          pinecone_host: pineconeHost,
          embedding_provider: embeddingProvider,
          embedding_key: embeddingKey,
          embedding_model: embeddingModel
        })
      });

      if (!res.ok) throw new Error('Failed to save settings.');
      setSettingsStatus('Settings saved successfully!');
      setEmployeeAccessCode(''); // Clear access code text field after saving
      fetchSettings();
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      setSettingsStatus(`Error: ${err.message}`);
    }
  };

  // Remove Access Code
  const handleRemoveAccessCode = async () => {
    if (!confirm("Are you sure you want to remove the employee access code? This will allow public access to your widget and webhooks.")) return;
    setSettingsStatus('Removing access code...');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          llm_provider: llmProvider,
          active_model: (activeModel === 'custom' && llmProvider === 'openrouter') ? customModelId : activeModel,
          llm_key: llmKey,
          db_provider: dbProvider,
          encrypted_db_credentials: dbCredentials,
          telegram_token: telegramToken,
          whatsapp_config: whatsappConfig,
          employee_access_code: '', // Explicitly clear it
          pinecone_enabled: pineconeEnabled ? 1 : 0,
          pinecone_key: pineconeKey,
          pinecone_host: pineconeHost,
          embedding_provider: embeddingProvider,
          embedding_key: embeddingKey,
          embedding_model: embeddingModel
        })
      });

      if (!res.ok) throw new Error('Failed to update settings.');
      setSettingsStatus('Access code removed successfully!');
      setEmployeeAccessCode('');
      setHasAccessCode(false);
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      setSettingsStatus(`Error: ${err.message}`);
    }
  };

  // Migrate local database chunks to Pinecone
  const handleMigrateToPinecone = async () => {
    if (!confirm("Are you sure you want to migrate all existing document chunks to Pinecone? This will calculate embeddings and sync them to your vector index.")) return;
    setMigrationLoading(true);
    setMigrationStatus('Syncing vectors to Pinecone...');
    try {
      const res = await fetch('/api/migrate/pinecone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to migrate data to Pinecone.');
      }
      setMigrationStatus(`✅ Sync complete! Migrated ${data.count} chunks to Pinecone.`);
    } catch (err) {
      setMigrationStatus(`❌ Migration failed: ${err.message}`);
    } finally {
      setMigrationLoading(false);
    }
  };

  // Populate DB credentials template on provider change
  const handleDbProviderChange = (val) => {
    setDbProvider(val);
    
    // Check if credentials are empty, default, or match a placeholder template
    const isDefaultOrEmpty = !dbCredentials || 
      dbCredentials === '{}' || 
      dbCredentials.trim() === '' ||
      dbCredentials === 'Shared instance requires no configuration.' || 
      dbCredentials === 'postgresql://postgres:password@db.supabase.co:5432/postgres' ||
      dbCredentials.includes('"connectionString": "postgresql://postgres') || 
      dbCredentials.includes('"url": "libsql://your-db-name.turso.io"') || 
      dbCredentials.includes('"projectId": "your-project-id"') || 
      dbCredentials.includes('"uri": "mongodb+srv://user:pass@cluster.mongodb.net"');

    if (isDefaultOrEmpty) {
      if (val === 'sqlite-local') {
        setDbCredentials('{}');
      } else if (val === 'supabase') {
        setDbCredentials('{\n  "connectionString": "postgresql://postgres:password@db.supabase.co:5432/postgres"\n}');
      } else if (val === 'turso') {
        setDbCredentials('{\n  "url": "libsql://your-db-name.turso.io",\n  "authToken": "YOUR_AUTH_TOKEN"\n}');
      } else if (val === 'firestore') {
        setDbCredentials('{\n  "projectId": "your-project-id",\n  "clientEmail": "admin@your-project.iam.gserviceaccount.com",\n  "privateKey": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"\n}');
      } else if (val === 'mongodb') {
        setDbCredentials('{\n  "uri": "mongodb+srv://user:pass@cluster.mongodb.net",\n  "dbName": "policy_bot"\n}');
      }
    }
  };

  const handleConnectTelegram = async (e) => {
    e.preventDefault();
    if (!telegramToken) return;
    setTelegramConnecting(true);
    setTelegramStatusMsg('Connecting bot to webhook...');
    try {
      const res = await fetch('/api/channels/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          platform: 'telegram',
          token: telegramToken
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect bot.');
      
      setTelegramStatusMsg(`✅ Successfully connected as @${data.botUsername}!`);
      setConnectedBotUsername(data.botUsername);
      fetchSettings();
    } catch (err) {
      console.error(err);
      setTelegramStatusMsg(`⚠️ Connection failed: ${err.message}`);
    } finally {
      setTelegramConnecting(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram bot?')) return;
    setTelegramConnecting(true);
    setTelegramStatusMsg('Disconnecting bot webhook...');
    try {
      const res = await fetch(`/api/channels/connect?orgId=${orgId}&token=${telegramToken}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disconnect.');
      
      setTelegramToken('');
      setConnectedBotUsername('');
      setTelegramStatusMsg('✅ Disconnected Telegram webhook.');
      fetchSettings();
    } catch (err) {
      console.error(err);
      setTelegramStatusMsg(`⚠️ Disconnection failed: ${err.message}`);
    } finally {
      setTelegramConnecting(false);
    }
  };

  // Load Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    setSelectedSession(null);
    try {
      const res = await fetch(`/api/chats?orgId=${orgId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load chat history.');
      const sessions = await res.json();

      const decryptedSessions = [];
      for (const sess of sessions) {
        try {
          const history = JSON.parse(sess.history || '[]');
          decryptedSessions.push({
            id: sess.id,
            channel: sess.channel,
            created_at: sess.created_at,
            expires_at: sess.expires_at,
            history
          });
        } catch (e) {
          console.error(`Failed to parse history for session ${sess.id}:`, e);
          decryptedSessions.push({
            id: sess.id,
            channel: sess.channel,
            created_at: sess.created_at,
            expires_at: sess.expires_at,
            history: []
          });
        }
      }
      setChatSessions(decryptedSessions);
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Playground Chat Flow (Client-Side RAG + Proxy LLM generation)
  const handlePlaygroundSend = async (e) => {
    e.preventDefault();
    if (!playgroundInput || playgroundLoading) return;

    const userMessage = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundLoading(true);
    setPlaygroundMessages(prev => [...prev, { role: 'user', content: userMessage }]);

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
          categoryId: playgroundCategory === 'all' ? null : playgroundCategory,
          query: userMessage,
          vector: queryVector,
          limit: 8
        })
      });

      if (!searchRes.ok) {
        const searchErr = await searchRes.json();
        throw new Error(searchErr.error || 'Failed to retrieve search results.');
      }

      const topChunks = await searchRes.json();
      setDebugChunks(topChunks);

      // Format retrieved chunks context
      const contextText = topChunks.map(c => `[Section: ${c.title}]\n${c.text}`).join('\n\n');

      // 3. Request LLM completion via Stateless Proxy API
      const proxyRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          query: userMessage,
          context: contextText,
          history: playgroundMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          stream: true
        })
      });

      if (!proxyRes.ok) {
        let errMsg = 'Stateless chat proxy error.';
        try {
          const errJson = await proxyRes.json();
          errMsg = errJson.error || errMsg;
        } catch (_) {
          try {
            const errText = await proxyRes.text();
            errMsg = errText || errMsg;
          } catch (_) {}
        }
        throw new Error(errMsg);
      }

      // Initialize the assistant message in UI state
      setPlaygroundMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = proxyRes.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          assistantMessage += chunk;
          setPlaygroundMessages(prev => {
            const list = [...prev];
            list[list.length - 1] = { role: 'assistant', content: assistantMessage };
            return list;
          });
        }
      }

      // 4. Save plaintext chat history log for audit (Asynchronously)
      const updatedHistory = [...playgroundMessages, { role: 'user', content: userMessage }, { role: 'assistant', content: assistantMessage }];

      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          sessionId: playgroundSessionId,
          channel: 'web-playground',
          history: updatedHistory
        })
      }).catch(e => console.error('Failed to log playground chat:', e));

    } catch (err) {
      setPlaygroundMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error processing request: ${err.message}` }]);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  // Sign out
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };



  // Category card background colors (Bento variety)
  const bentoBackgrounds = [
    'rgba(6, 182, 212, 0.02)',
    'rgba(99, 102, 241, 0.02)',
    'rgba(16, 185, 129, 0.02)',
    'rgba(245, 158, 11, 0.02)'
  ];



  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="pulse-indicator"></div>
          <div>
            <h3 className="sidebar-logo-text">HushRag</h3>
            <span className="sidebar-logo-sub">{orgName}</span>
          </div>
        </div>

        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => { setActiveTab('files'); setActiveCategory(null); }}
          >
            📁 Guideline Folders
          </li>
          <li
            className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => { setActiveTab('playground'); setPlaygroundMessages([{ role: 'assistant', content: 'Hello! I am your policy assistant. Please select a category folder or type a question to get started.' }]); }}
          >
            💬 Bot Playground
          </li>
          <li
            className={`nav-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('audit-logs'); fetchAuditLogs(); }}
          >
            📜 Employee Chat Logs
          </li>
          <li
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Master Settings
          </li>
          <li
            className={`nav-item ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            🔌 Connect Channels
          </li>
        </ul>

        <div className="sidebar-footer">
          <span className="sidebar-email">{userEmail}</span>
          <button onClick={handleLogout} className="sidebar-logout-btn">Sign Out</button>
        </div>
      </div>

      {/* Main Dashboard Panel */}
      <div className="main-content">
        
        {/* VIEW: FILE & FOLDER CMS */}
        {activeTab === 'files' && (
          <div>
            {!activeCategory ? (
              // Categories List
              <div>
                <div className="back-header">
                  <h2>Policy Guideline Folders</h2>
                  <p>Manage guideline folders. Files within folders will be chunked, encrypted, and mapped to search indexes.</p>
                </div>

                {!pineconeEnabled && allDocuments.length > 100 && !dismissedWarning && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '1rem', 
                      backgroundColor: '#fef2f2', 
                      border: '1px solid #fee2e2', 
                      borderRadius: '6px', 
                      color: '#991b1b', 
                      marginBottom: '1.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⚠️</span>
                      <span>
                        <strong>Performance Warning:</strong> You have uploaded <strong>{allDocuments.length}</strong> documents. With keyword search, this may slow down query responses. We recommend enabling the <strong>Pinecone Serverless vector plugin</strong> in Settings for sub-millisecond semantic search.
                      </span>
                    </div>
                    <button 
                      onClick={() => setDismissedWarning(true)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#991b1b', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        padding: '0 0.5rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {cmsError && <div className="error-alert">{cmsError}</div>}
                {cmsSuccess && <div className="success-alert">{cmsSuccess}</div>}

                <div className="category-grid">
                  {/* Create New Category Card */}
                  <Card className="create-card">
                    <CardContent className="pt-6" style={{ padding: 0 }}>
                      <h3 style={{ marginBottom: '1rem' }}>Create Folder</h3>
                      <form onSubmit={handleCreateCategory}>
                        <div className="form-group">
                          <label className="form-label">Folder Name</label>
                          <Input
                            type="text"
                            placeholder="e.g. HR Policies"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Description (Optional)</label>
                          <Input
                            type="text"
                            placeholder="e.g. Benefits and time off"
                            value={newCategoryDesc}
                            onChange={(e) => setNewCategoryDesc(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                          + Add Folder
                        </button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Existing Folders List */}
                  {categories.map((cat, idx) => (
                    <Card 
                      key={cat.id} 
                      className="glass-panel-interactive cat-card"
                    >
                      <CardContent className="pt-6" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                        <div className="cat-card-header">
                          <span style={{ fontSize: '2rem' }}>📁</span>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)} 
                            className="delete-icon"
                            title="Delete Folder"
                          >
                            🗑️
                          </button>
                        </div>
                        <h3 style={{ marginBottom: '0.25rem' }}>{cat.name}</h3>
                        <p style={{ fontSize: '0.85rem', flexGrow: 1, color: 'var(--text-secondary)' }}>{cat.desc || 'No description provided.'}</p>
                        <Button 
                          onClick={() => { setActiveCategory(cat); fetchDocuments(cat.id); }} 
                          variant="secondary"
                          className="w-full mt-4"
                        >
                          Open Folder
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Documents inside Active Category
              <div>
                <div className="back-header">
                  <button onClick={() => setActiveCategory(null)} className="back-btn">
                    ← Back to Folders
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>📁</span>
                    <div>
                      <h2>{activeCategory.name}</h2>
                      <p>{activeCategory.desc || 'Guideline documents folder.'}</p>
                    </div>
                  </div>
                </div>

                {cmsSuccess && <div className="success-alert">{cmsSuccess}</div>}
                {cmsError && <div className="error-alert">{cmsError}</div>}

                <Card className="document-panel">
                  <CardContent className="pt-6" style={{ padding: 0 }}>
                    <div className="upload-header">
                      <h3>Document Files</h3>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleUploadFile}
                          accept=".pdf,.docx,.txt,.md"
                          style={{ display: 'none' }}
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (uploadStatusMsg || 'Uploading & Parsing...') : '📤 Upload Document'}
                        </Button>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.5rem' }}>
                      Supported formats: PDF, DOCX, TXT, MD. Maximum size 5MB.
                    </span>

                    {documents.length === 0 ? (
                      <div className="empty-state">
                        <span style={{ fontSize: '2.5rem' }}>📄</span>
                        <p style={{ marginTop: '0.75rem' }}>This folder is empty. Upload your first policy file.</p>
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table className="sp-table">
                          <thead>
                            <tr>
                              <th className="sp-th">Document Name</th>
                              <th className="sp-th">Type</th>
                              <th className="sp-th" style={{ width: '100px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => (
                              <tr key={doc.id} className="sp-tr">
                                <td className="sp-td" style={{ fontWeight: 500 }}>📄 {doc.name}</td>
                                <td className="sp-td">
                                  <Badge variant="secondary" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                                    Plaintext
                                  </Badge>
                                </td>
                                <td className="sp-td">
                                  <button onClick={() => handleDeleteDocument(doc.id)} className="action-btn">
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* VIEW: PLAYGROUND */}
        {activeTab === 'playground' && (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="back-header">
              <h2>Bot Playground</h2>
              <p>Live test the RAG engine against your encrypted policies.</p>
            </div>

            <div className="playground-grid">
              {/* Chat panel */}
              <Card className="chat-panel">
                <CardContent className="pt-6" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="pulse-indicator"></span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Policy Assistant Widget</span>
                    </div>
                    <div>
                      <select
                        className="form-select"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '180px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                        value={playgroundCategory}
                        onChange={(e) => setPlaygroundCategory(e.target.value)}
                      >
                        <option value="all">Search all folders</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <ScrollArea style={{ flexGrow: 1, height: '320px' }}>
                    <div className="chat-messages">
                      {playgroundMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                        />
                      ))}
                      {playgroundLoading && (
                        <div className="chat-bubble bubble-bot" style={{ opacity: 0.6 }}>
                          Thinking and searching documents...
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handlePlaygroundSend} className="chat-input-area">
                    <Input
                      type="text"
                      placeholder="Ask a question about HR, leaves, benefits..."
                      value={playgroundInput}
                      onChange={(e) => setPlaygroundInput(e.target.value)}
                      disabled={playgroundLoading}
                      style={{ flexGrow: 1 }}
                    />
                    <Button type="submit" disabled={playgroundLoading}>
                      Send
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Debug retrieval panel */}
              <Card className="debug-panel">
                <CardContent className="pt-6" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>RAG Debug Monitor</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                    See what E2EE chunks are matched locally by MiniSearch in the browser before prompt injection.
                  </p>

                  {debugChunks.length === 0 ? (
                    <div className="empty-debug">
                      No query run yet. Type a message to see matched chunks.
                    </div>
                  ) : (
                    <ScrollArea style={{ flexGrow: 1, height: '320px' }}>
                      <div className="chunks-list" style={{ paddingRight: '0.5rem' }}>
                        {debugChunks.map((chunk, i) => (
                          <div key={i} className="chunk-item">
                            <div className="chunk-title">
                              <span>📌 {chunk.title}</span>
                              <span className="chunk-score">Score: {chunk.score.toFixed(3)}</span>
                            </div>
                            <pre>
                              <code>{chunk.text}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '720px' }}>
            <div className="back-header">
              <h2>Master Settings</h2>
              <p>Configure your LLM private keys, database providers, and routing connections.</p>
            </div>

            {settingsStatus && (
              <div className={settingsStatus.startsWith('Error') ? 'error-alert' : 'success-alert'}>
                {settingsStatus.startsWith('Error') ? '⚠️' : '✓'} {settingsStatus}
              </div>
            )}

            <Card style={{ marginTop: '1rem' }}>
              <CardContent className="pt-6" style={{ padding: '2.5rem' }}>
                <form onSubmit={handleSaveSettings}>
                  <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                    1. AI Model Provider (BYOK)
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">LLM Provider</label>
                      <Select 
                        value={llmProvider} 
                        onValueChange={(val) => {
                          setLlmProvider(val);
                          if (val === 'openai') setActiveModel('gpt-4o-mini');
                          else if (val === 'anthropic') setActiveModel('claude-3-5-haiku');
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select LLM Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="openrouter">OpenRouter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Active Model</label>
                      <Select 
                        value={activeModel} 
                        onValueChange={(val) => setActiveModel(val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Active Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {llmProvider === 'openai' && (
                            <>
                              <SelectItem value="gpt-4o-mini">gpt-4o-mini (Fast & Cheap)</SelectItem>
                              <SelectItem value="gpt-4o">gpt-4o (High Quality)</SelectItem>
                            </>
                          )}
                          {llmProvider === 'anthropic' && (
                            <>
                              <SelectItem value="claude-3-5-haiku">claude-3-5-haiku</SelectItem>
                              <SelectItem value="claude-3-5-sonnet">claude-3-5-sonnet</SelectItem>
                            </>
                          )}
                          {llmProvider === 'openrouter' && (
                            <>
                              <SelectItem value="google/gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                              <SelectItem value="meta-llama/llama-3.3-70b-instruct">llama-3-3-70b</SelectItem>
                              <SelectItem value="deepseek/deepseek-chat">deepseek-chat</SelectItem>
                              <SelectItem value="custom">Custom Model ID...</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {activeModel === 'custom' && llmProvider === 'openrouter' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Custom OpenRouter Model ID</label>
                      <Input
                        type="text"
                        placeholder="e.g. anthropic/claude-3.5-sonnet"
                        value={customModelId}
                        onChange={(e) => setCustomModelId(e.target.value)}
                        required
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                        Enter any valid OpenRouter model identifier from their official catalog.
                      </span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label className="form-label">API Private Key</label>
                    <Input
                      type="password"
                      placeholder="Paste your secret key (sk-...) here"
                      value={llmKey}
                      onChange={(e) => setLlmKey(e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      This key will be encrypted securely on the server before being stored.
                    </span>
                  </div>

                  <h3 style={{ marginTop: '2rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                    2. Database Config (BYODB)
                  </h3>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Database Provider</label>
                    <Select 
                      value={dbProvider} 
                      onValueChange={handleDbProviderChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select DB Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqlite-local">SaaS Shared (Local SQLite default)</SelectItem>
                        <SelectItem value="turso">Turso (Serverless SQLite URL)</SelectItem>
                        <SelectItem value="firestore">Cloud Firestore (Firebase Account Key)</SelectItem>
                        <SelectItem value="supabase">Supabase / PostgreSQL (Conn String)</SelectItem>
                        <SelectItem value="mongodb">MongoDB Atlas (URI connection)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Connection Credentials (JSON / Connection String)</label>
                    <Textarea
                      rows={4}
                      placeholder={
                        dbProvider === 'sqlite-local' 
                          ? 'Shared instance requires no configuration.' 
                          : dbProvider === 'supabase'
                          ? '{\n  "connectionString": "postgresql://postgres:password@db.supabase.co:5432/postgres"\n}'
                          : dbProvider === 'turso'
                          ? '{\n  "url": "libsql://db-name.turso.io",\n  "authToken": "JWT_TOKEN"\n}'
                          : dbProvider === 'firestore'
                          ? '{\n  "projectId": "project-id",\n  "clientEmail": "admin@project.iam.gserviceaccount.com",\n  "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"\n}'
                          : '{\n  "uri": "mongodb+srv://user:pass@cluster.mongodb.net",\n  "dbName": "policy_bot"\n}'
                      }
                      value={dbCredentials}
                      onChange={(e) => setDbCredentials(e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      ⚠️ Please replace the placeholder values in the JSON template with your actual database connection credentials.
                    </span>
                  </div>

                  <h3 style={{ marginTop: '2rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                    3. Pinecone Vector DB Plugin (BYODB)
                  </h3>

                  <div className="form-group" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="pineconeEnabled"
                      checked={pineconeEnabled}
                      onChange={(e) => setPineconeEnabled(e.target.checked)}
                      style={{ width: '1rem', height: '1rem', accentColor: '#000', cursor: 'pointer' }}
                    />
                    <label htmlFor="pineconeEnabled" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
                      Enable Pinecone Serverless Plugin
                    </label>
                  </div>

                  {pineconeEnabled && (
                    <>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Pinecone Index Host</label>
                        <Input
                          type="text"
                          placeholder="e.g. index-name-project.svc.us-east-1.pinecone.io"
                          value={pineconeHost}
                          onChange={(e) => setPineconeHost(e.target.value)}
                          required={pineconeEnabled}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                          Find your Host URL in the Pinecone console. Do not include https:// prefix.
                        </span>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Pinecone API Key</label>
                        <Input
                          type="password"
                          placeholder="Paste your Pinecone API Key here"
                          value={pineconeKey}
                          onChange={(e) => setPineconeKey(e.target.value)}
                          required={pineconeEnabled && pineconeKey !== '••••••••'}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Embedding Provider</label>
                        <Select 
                          value={embeddingProvider} 
                          onValueChange={(val) => setEmbeddingProvider(val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Embedding Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-process">Local (In-Browser WASM - $0 Host Cost)</SelectItem>
                            <SelectItem value="openai">OpenAI (Cloud API Key)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {embeddingProvider === 'openai' && (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label className="form-label">Dedicated Embedding API Key (Optional)</label>
                          <Input
                            type="password"
                            placeholder="Paste dedicated API key if different from LLM key"
                            value={embeddingKey}
                            onChange={(e) => setEmbeddingKey(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Data Sync & Migration */}
                      <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', textTransform: 'none' }}>
                          Data Sync & Migration
                        </label>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'block' }}>
                          Calculate embeddings and upload all existing document chunks from your active database to your Pinecone index.
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleMigrateToPinecone}
                            disabled={migrationLoading || !pineconeHost || !pineconeKey}
                            style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                          >
                            {migrationLoading ? 'Syncing to Pinecone...' : 'Sync Local DB to Pinecone'}
                          </Button>
                          {migrationStatus && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: migrationStatus.includes('❌') ? '#ef4444' : '#10b981' }}>
                              {migrationStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <h3 style={{ marginTop: '2rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                    4. Hosted Channels & Access Security
                  </h3>



                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Employee Access Code</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Input
                        type="text"
                        placeholder={hasAccessCode ? "(Access code is set. Type a new code to change it)" : "Set access code for widget/webhook validation"}
                        value={employeeAccessCode}
                        onChange={(e) => setEmployeeAccessCode(e.target.value)}
                        style={{ flexGrow: 1 }}
                      />
                      {hasAccessCode && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleRemoveAccessCode}
                          style={{ flexShrink: 0 }}
                        >
                          Remove Code
                        </Button>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                      Employees will be required to enter this access code to unlock the bot widget or gain access on Telegram/WhatsApp.
                    </span>
                  </div>

                  <Button type="submit" className="w-full">
                    Save Configurations
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW: CHANNELS & INTEGRATION */}
        {activeTab === 'channels' && (
          <div>
            <div className="back-header">
              <h2>Integrate Bot Channels</h2>
              <p>Connect your custom policy bot to your website, Telegram, or WhatsApp.</p>
            </div>

            <div className="channel-container">
              {/* Web widget embedding */}
              <Card className="channel-card">
                <CardContent className="pt-6" style={{ padding: 0 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>1. Web Widget Script</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Embed a floating chat bubble directly into your website or employee portal.
                  </p>

                  <pre>
                    <code>
                      {`<!-- HushRag Widget -->
<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget"
  data-org="${orgId}"
  data-channel="web-widget"
  defer>
</script>`}
                    </code>
                  </pre>
                </CardContent>
              </Card>

              {/* Telegram Integration Card */}
              <Card className="channel-card">
                <CardContent className="pt-6" style={{ padding: 0 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>2. Telegram Messaging Channel</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Connect a Telegram bot so employees can query policy docs via Telegram chat.
                  </p>

                  {typeof window !== 'undefined' && window.location.protocol !== 'https:' && (
                    <div style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      marginBottom: '1.25rem',
                      lineHeight: '1.5'
                    }}>
                      <strong style={{ color: '#7f1d1d' }}>⚠️ Local HTTP Host Warning:</strong> Telegram requires an <strong>HTTPS</strong> endpoint to connect webhooks. Since you are currently on <code style={{ backgroundColor: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>{window.location.origin}</code>, bot connection will fail.
                      <div style={{ marginTop: '0.5rem', color: '#7f1d1d' }}>
                        To test locally, run <code style={{ backgroundColor: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>npx ngrok http 3000</code> and open the dashboard using the secure <code style={{ backgroundColor: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>https://...ngrok-free.app</code> URL.
                      </div>
                    </div>
                  )}

                  {telegramStatusMsg && (
                    <div style={{ padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', marginBottom: '1rem', color: '#fbbf24' }}>
                      {telegramStatusMsg}
                    </div>
                  )}

                  {connectedBotUsername ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 600 }}>
                        ✅ Connected as @{connectedBotUsername}
                      </div>
                      <Button onClick={handleDisconnectTelegram} variant="secondary" style={{ width: 'fit-content' }} disabled={telegramConnecting}>
                        Disconnect Bot
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleConnectTelegram} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Telegram Bot Token (from @BotFather)</label>
                        <Input
                          type="text"
                          placeholder="e.g. 123456789:ABCdefGhI..."
                          value={telegramToken}
                          onChange={(e) => setTelegramToken(e.target.value)}
                          disabled={telegramConnecting}
                          required
                        />
                      </div>
                      <Button type="submit" variant="secondary" style={{ width: 'fit-content' }} disabled={telegramConnecting}>
                        {telegramConnecting ? 'Connecting...' : '🔌 Connect Telegram Bot'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp Integration Card */}
              <Card className="channel-card">
                <CardContent className="pt-6" style={{ padding: 0 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>3. WhatsApp Messaging Channel (via Twilio)</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Configure your Twilio WhatsApp sender webhook URL to match the one below.
                  </p>

                  <div className="webhook-url-box" style={{ marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Twilio Webhook URL:</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp?orgId={orgId}
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">WhatsApp Twilio Config (JSON)</label>
                      <Input
                        type="text"
                        placeholder='e.g. {"accountSid": "AC...", "authToken": "..."}'
                        value={whatsappConfig}
                        onChange={(e) => setWhatsappConfig(e.target.value)}
                      />
                    </div>
                    <Button type="submit" variant="secondary" style={{ width: 'fit-content' }}>
                      Save WhatsApp Config
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Local bot gateway */}
              <Card className="channel-card">
                <CardContent className="pt-6" style={{ padding: 0 }}>
                  <h3 style={{ marginBottom: '0.75rem' }}>🔒 3. Zero-Knowledge Local Gateway</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    Because webhooks process messages on our SaaS server, hosted chat sessions normally require keys to be saved in Settings. 
                    To maintain 100% Zero-Knowledge privacy for messaging apps, you can run a <strong>Local Bot Gateway</strong> on your own server.
                  </p>
                  
                  <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>Deploy the lightweight node script `local-gateway.js` on your own local server.</li>
                    <li>Configure `.env` locally with your private LLM key and organization decryption passphrase.</li>
                    <li>Set your Telegram/WhatsApp bot webhooks to point directly to your Local Gateway server IP/domain.</li>
                    <li>The local script pulls encrypted documents from our SaaS, decrypts them locally, runs the search locally, and responds directly. Your keys never leave your offices.</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW: AUDIT LOGS */}
        {activeTab === 'audit-logs' && (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="back-header">
              <h2>Employee Chat Audit Logs</h2>
              <p>Review conversations logged by your employees. Logs are automatically deleted after 7 days.</p>
            </div>

            <div className="audit-grid">
              {/* Sessions List */}
              <Card className="list-panel">
                <CardContent className="pt-6" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Conversations</h3>
                  {auditLogsLoading ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading logs...</p>
                  ) : chatSessions.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No transcripts found.</p>
                  ) : (
                    <ScrollArea style={{ flexGrow: 1, height: '360px' }}>
                      <ul className="session-list" style={{ paddingRight: '0.5rem' }}>
                        {chatSessions.map((sess) => (
                          <li
                            key={sess.id}
                            onClick={() => setSelectedSession(sess)}
                            className={`session-item ${selectedSession?.id === sess.id ? 'session-item-active' : ''}`}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                {sess.channel === 'web-playground' ? '💻 Playground' : sess.channel === 'web-widget' ? '🌐 Web Widget' : '📱 Bot Channel'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(sess.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              ID: {sess.id}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Selected Conversation View */}
              <Card className="transcript-panel">
                <CardContent className="pt-6" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {selectedSession ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                      <div className="transcript-header">
                        <div>
                          <h3 style={{ fontSize: '1rem' }}>Session Audit Log</h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Session ID: {selectedSession.id}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Expires: {new Date(selectedSession.expires_at).toLocaleString()}
                        </div>
                      </div>

                      <ScrollArea style={{ flexGrow: 1, height: '320px', marginTop: '1rem' }}>
                        <div className="transcript-messages" style={{ paddingRight: '0.5rem' }}>
                          {selectedSession.history.map((msg, idx) => (
                            <div key={idx} className="message-row">
                              <div className="role-badge" style={{ color: msg.role === 'user' ? 'var(--accent-color)' : 'var(--success)' }}>
                                {msg.role === 'user' ? 'EMPLOYEE' : 'ASSISTANT'}
                              </div>
                              <div className="message-text">{msg.content}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="empty-transcript">
                      Select a conversation session on the left to decrypt and view transcript.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
