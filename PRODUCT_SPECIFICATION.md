# SecurePolicy: Full Product Specification & Architecture Document

SecurePolicy is an AI-powered corporate policy assistant that lets organizations upload employee handbooks, HR guidelines, and standard operating procedures, and provides instant, conversational answers to employee questions. 

---

## 1. Core Value Proposition

1. **Zero-Configuration SaaS**: Admins and employees log in immediately without the friction of decryption keys or master passwords.
2. **100% Data Ownership (BYODB + BYOP)**: Solves corporate data privacy and developer liability. Sensitive documents, chunks, and logs are stored directly on the client's own cloud databases (Turso and Pinecone).
3. **$0 Server Embedding Costs**: Offloads CPU/GPU-intensive embedding generation from the server to the client's web browser using client-side WebAssembly (WASM).

---

## 2. Key Features

### 📁 Policy Guideline Folders (CMS)
* **Drag-and-Drop Uploader**: Supports PDF, DOCX, TXT, and Markdown files up to 5MB.
* **Sliding Window Chunking**: Automatically splits documents into overlapping 500-word segments on upload to preserve context.
* **Synonym Expansion**: Expands common acronyms (e.g., `pto` ➜ `vacation`, `wfh` ➜ `remote work`) in browser queries to improve search recall.

### 🔌 Multi-Channel Integrations
* **Embeddable Chat Widget**: A lightweight chat bubble script that can be embedded into any company portal or website.
* **One-Click Telegram Connect**: Registers webhooks and connects the bot to custom Telegram bots.
* **WhatsApp Gateway**: Integrates with Twilio to answer queries sent to the company's WhatsApp number.

### 💬 Admin Dashboard & Audit Logs
* **RAG Debug Monitor**: Displays matched text chunks and search scores in the dashboard playground.
* **7-Day Chat Logs**: Retains employee conversation transcripts for audit purposes, automatically deleted after 7 days to preserve storage.
* **Optional Access Code Control**: Allows organizations to configure a passcode required for employees to unlock the widget or chat on mobile channels.

---

## 3. Data Flow & Routing Architecture

### A. Document Upload Pipeline
```
[Admin Uploads PDF]
       │
       ▼
1. POST /api/parse ➜ Returns Plaintext Markdown
       │
       ▼
2. Browser splits text into 500-word overlapping chunks
       │
       ▼
3. Is Pinecone Enabled?
     ├── YES: Browser WASM loads ONNX model ➜ Generates Vector Arrays
     └── NO:  Browser builds serialized MiniSearch index string
       │
       ▼
4. POST /api/documents ➜ Writes chunks/vectors to Client's Turso/Pinecone
```

### B. Employee Query Pipeline
```
[Employee asks a question in Widget]
       │
       ▼
1. Is Pinecone Enabled?
     ├── YES: Browser widget WASM generates Query Vector ➜ POST /api/search
     └── NO:  POST /api/search with raw Query Text
       │
       ▼
2. Server queries Turso (or local SQLite) ➜ Runs RAG match ➜ Returns top 8 chunks
       │
       ▼
3. POST /api/chat ➜ Server decrypts LLM key ➜ Calls LLM ➜ Streams tokens back
```

---

## 4. API Endpoint Specification

| Endpoint | Method | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `/api/settings` | `GET` | `?orgId=...` | Retrieves settings and masks keys as `••••••••`. |
| `/api/settings` | `POST` | settings JSON | Saves LLM, Database, and Pinecone credentials (encrypted server-side). |
| `/api/categories` | `GET` | `?orgId=...` | Retrieves plaintext category folders. |
| `/api/categories` | `POST` | `{ orgId, categoryId, name, description }` | Creates/updates folder category metadata. |
| `/api/documents` | `GET` | `?orgId=...&categoryId=...` | Lists plaintext document metadata. |
| `/api/documents` | `POST` | document JSON + vectors | Writes chunks to Turso and vectors to Pinecone index. |
| `/api/search` | `POST` | `{ orgId, query, vector, categoryId }` | Returns top 8 matched chunks (via Pinecone or MiniSearch fallback). |
| `/api/chat` | `POST` | `{ orgId, query, context, history }` | Server decrypts LLM key and streams LLM chat tokens. |
| `/api/chats` | `GET` | `?orgId=...` | Retrieves plaintext conversation history lists. |
| `/api/chats` | `POST` | `{ orgId, sessionId, channel, history }` | Logs plaintext conversation transcripts. |

---

## 5. Database Schema & Data Models

All client-specific data is stored either in local SQLite or the client's private Turso database using **6 tables**:

### `users`
* `id` (TEXT, PRIMARY KEY): Unique user identifier.
* `email` (TEXT, UNIQUE): User email for login.
* `password_hash` (TEXT): Hashed password (PBKDF2).
* `org_id` (TEXT): Associated organization ID.

### `organizations`
* `id` (TEXT, PRIMARY KEY): Unique organization identifier.
* `name` (TEXT): Name of the organization.

### `categories`
* `id` (TEXT, PRIMARY KEY): Folder ID.
* `org_id` (TEXT): Associated organization.
* `name` (TEXT): Plaintext category name.
* `description` (TEXT): Folder description.

### `documents`
* `id` (TEXT, PRIMARY KEY): Document ID.
* `org_id` (TEXT): Associated organization.
* `category_id` (TEXT): Folder category ID.
* `name` (TEXT): Plaintext filename.
* `chunks` (TEXT): Plaintext JSON string of chunk text arrays.
* `search_index` (TEXT): Serialized keyword search index.

### `settings`
* `org_id` (TEXT, PRIMARY KEY): Organization ID.
* `llm_provider` (TEXT): OpenAI, Anthropic, or OpenRouter.
* `active_model` (TEXT): Selected LLM model.
* `encrypted_llm_key` (TEXT): Hashed/encrypted API key.
* `db_provider` (TEXT): Client DB choice (Turso, Firestore, SQLite, etc.).
* `encrypted_db_credentials` (TEXT): Hashed DB connection credentials.
* `telegram_token` (TEXT): Telegram bot credentials.
* `whatsapp_config` (TEXT): WhatsApp config credentials.
* `employee_access_code_hash` (TEXT): Hashed employee access passcode.
* `pinecone_enabled` (INTEGER): Enabled state (0 or 1).
* `encrypted_pinecone_key` (TEXT): Hashed vector DB credential.
* `pinecone_host` (TEXT): Pinecone Index Host URL.
* `embedding_provider` (TEXT): in-process, openai, or local-api.
* `encrypted_embedding_key` (TEXT): Dedicated embeddings credentials.
* `embedding_model` (TEXT): Model identifier.

### `chat_sessions`
* `id` (TEXT, PRIMARY KEY): Unique session ID.
* `org_id` (TEXT): Associated organization.
* `channel` (TEXT): web-widget, telegram, whatsapp.
* `history` (TEXT): Plaintext JSON transcript of conversation.
* `is_verified` (INTEGER): Employee access validation state (0 or 1).
* `expires_at` (TEXT): Auto-cleanup expiry timestamp.
