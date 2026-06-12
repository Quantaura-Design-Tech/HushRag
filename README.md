# HushRag

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.0-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![WebAssembly](https://img.shields.io/badge/WebAssembly-WASM-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Security](https://img.shields.io/badge/Security-Zero--Knowledge-green?style=for-the-badge)
[![License: Custom NC-ND](https://img.shields.io/badge/License-Custom_NC--ND-orange.svg?style=for-the-badge)](file:///Users/harildixit/Documents/RAG-bot/LICENSE)

**Secure, Client-Side Zero-Knowledge RAG Corporate Policy Assistant & Platform.**
*Enterprise-grade security meets lightning-fast local RAG chat. Upload company handbooks, support guidelines, and operating procedures, and let employees query them securely.*

[Explore Features](#-features) • [How It Works](#-how-it-works) • [Architecture](#-structural-architecture) • [Quick Start](#-quick-start) • [Integrations](#-channel-integrations) • [API Specs](#-api-endpoints)

</div>

---

## 🔒 The Zero-Knowledge Core Value

HushRag solves corporate data privacy and liability issues by offloading CPU-intensive indexing and security models directly to the browser:

1. **BYODB + BYOP (Data Ownership):** All corporate documents, search indices, vectors, and transcripts are stored directly on the client's own private database (Turso, SQLite, Supabase, Firestore, or MongoDB Atlas). Sensitive information never touches SaaS servers.
2. **$0 Server Embedding Costs:** Employs client-side WebAssembly (WASM) loading in-browser ONNX models to compile vector embeddings directly in the employee/admin browser.
3. **Zero-Configuration SaaS:** Zero password configuration overhead. Administrators and employees gain instant, secure access with zero storage keys or decryption passwords stored server-side.

---

## 📁 Features

### 📁 Policy Guideline Folders (CMS)
* **Drag-and-Drop Uploader:** Supports PDF, DOCX, TXT, and Markdown files up to 5MB.
* **Sliding Window Chunking:** In-browser tokenizer automatically splits files into 500-word segments with configurable overlap to preserve contextual continuity.
* **Synonym Expansion:** Browser-level synonym mapper expands common acronyms (e.g., `pto` ➜ `vacation`, `wfh` ➜ `remote work`) to maximize search relevance.

### 🔌 Multi-Channel Integrations
* **Embeddable Chat Widget:** A lightweight chat bubble script that can be embedded into any company portal or intranet.
* **One-Click Telegram Connect:** Integrates custom Telegram bots instantly with webhooks.
* **WhatsApp twilio Gateway:** Hook up Twilio numbers to answer queries sent to the company's WhatsApp channel.

### 💬 Admin Dashboard & Audit Logs
* **RAG Debug Monitor:** Shows the matched text chunks, search cosine similarities, and index scores in the playground in real time.
* **7-Day Chat Logs:** Retains plaintext conversation transcripts for auditor review, automatically purged after 7 days to preserve storage.
* **Optional Access Code Control:** Set a master passcode settings hash. Employees will be required to input this code before accessing the widget or webhooks.

---

## ⚙️ How It Works

### A. Document Upload Pipeline
```
[Admin Uploads PDF/Doc]
          │
          ▼
1. POST /api/parse ➜ Server parses file to plaintext markdown
          │
          ▼
2. Browser tokenizes & splits text into 500-word overlapping chunks
          │
          ▼
3. Is Pinecone Vector DB enabled?
     ├── YES: Browser WASM loads ONNX model ➜ Generates Vector Arrays
     └── NO:  Browser builds serialized MiniSearch index keyword string
          │
          ▼
4. POST /api/documents ➜ Writes chunks/vectors to Client's Turso/Pinecone
```

### B. Employee Query Pipeline
```
[Employee asks a question in Web Widget]
          │
          ▼
1. Is Pinecone Vector DB enabled?
     ├── YES: Browser widget WASM generates Query Vector ➜ POST /api/search
     └── NO:  POST /api/search with raw Query Text
          │
          ▼
2. Server queries Client DB ➜ Runs RAG match ➜ Returns top 8 chunks
          │
          ▼
3. POST /api/chat ➜ Server decrypts LLM key ➜ Calls LLM ➜ Streams tokens back
```

---

## 🏗️ Structural Architecture

### System Architecture Flow (Multi-Tenant BYODB + Client-Side WASM)
HushRag splits execution responsibilities between the client's local environment, the Next.js API Gateway server, and the client's own remote databases/AI engines. This design maintains zero storage footprint of corporate data on the SaaS platform itself.

```mermaid
graph TB
    subgraph "Client-Side (Browser Context)"
        Widget[Client Portal / Web Widget]
        Dash[Admin Dashboard / Playground]
        WASM[In-Browser WASM Engine<br/>ONNX all-MiniLM-L6-v2]
        
        Dash -->|1. Parse File| API_Parse[api/parse]
        Dash -->|2. Local Vectorizer| WASM
        Dash -->|3. Save Document Chunks| API_Doc[api/documents]
        Widget -->|Verify Access Code| Verify[api/channels/verify]
        Widget -->|Search / RAG Chunks| API_Search[api/search]
        Widget -->|Query Stream Response| API_Chat[api/chat]
    end

    subgraph "SaaS Cloud Gateway (Next.js App Router API)"
        API_Parse
        API_Doc
        API_Search
        Verify
        API_Chat
        Crypto[Crypto Engine<br/>AES-256-GCM]
        Drivers[Database Driver Switcher]
        
        API_Doc --> Drivers
        API_Search --> Drivers
        API_Chat -->|Decrypt Keys| Crypto
        Verify --> Drivers
    end

    subgraph "External Provider Integrations"
        LLM[LLM Engines<br/>Gemini / OpenAI / Anthropic]
        API_Chat -->|Stream prompt + top-8 chunks| LLM
    end

    subgraph "Client Private Databases (BYODB + BYOP)"
        SaaS_DB[(SaaS Central Settings DB<br/>SQLite/Local)]
        Client_DB[(Client DB<br/>SQLite / Turso / Supabase / Firestore / MongoDB)]
        Pinecone[(Client Pinecone Index)]
        
        Crypto -->|Read/Write Encrypted Settings| SaaS_DB
        Drivers -->|Read/Write categories, docs, chats| Client_DB
        Drivers -->|Vector Similarity search| Pinecone
    end
    
    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef server fill:#efebe9,stroke:#5d4037,stroke-width:2px;
    classDef ext fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef db fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    
    class Widget,Dash,WASM client;
    class API_Parse,API_Doc,API_Search,Verify,API_Chat,Crypto,Drivers server;
    class LLM ext;
    class SaaS_DB,Client_DB,Pinecone db;
```

### In-Browser vs. Cloud Embedding Generation
HushRag allows organizations to toggle between local client-side processing (default) and OpenAI cloud embeddings:

| Embedding Option | Execution Location | Cost Profile | How It Works |
| :--- | :--- | :--- | :--- |
| **In-Browser WASM (Default)** | Client's Browser | **$0 Server Cost** | Loads the 23MB ONNX `all-MiniLM-L6-v2` model in browser WASM. Text is tokenized and vectorized locally before upload. |
| **Cloud (OpenAI)** | OpenAI API Cloud | Client-billed | Server intercepts plaintext, generates embeddings via OpenAI API using the client's decrypted embeddings key, and uploads them. |

### Complete Project Structure & File Guide

Below is the layout of files and folders inside the repository showing the purpose of each package and engine:

```
├── public/                 # Static assets and test harness files
│   ├── test-widget.html    # Local sandbox page to verify embed widget behavior
│   └── favicon.ico         # App logo icon
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── auth/       # Admin account creation, session management and authentication
│   │   │   ├── categories/ # Plaintext RAG document grouping categories (CMS)
│   │   │   ├── channels/   # Access verification endpoint for company passcode security
│   │   │   ├── chat/       # Serverless gateway decrypting LLM keys & streaming model answers
│   │   │   ├── chats/      # Plaintext RAG chat session logging endpoint (audit compliance)
│   │   │   ├── documents/  # CRUD endpoints for handbooks and policy chunks
│   │   │   ├── parse/      # Document parser router (extracts plain text from PDFs/DOCX)
│   │   │   ├── search/     # Unified vector search endpoint (delegates to Pinecone or local search)
│   │   │   ├── settings/   # Handles secure retrieval & storage of database/LLM/Pinecone keys
│   │   │   ├── webhooks/   # Webhook ingestion targets for WhatsApp (Twilio) and Telegram Bots
│   │   │   └── widget/     # JS loader script that injects the responsive 440px x 680px floating chat
│   │   ├── dashboard/      # Admin Panel frontend (WASM-based PDF uploader and playground)
│   │   ├── widget/         # Floating widget chat frame page, including access passcode verification
│   │   ├── globals.css     # Global style rules, Tailwind parameters, and custom variables
│   │   ├── layout.js       # Global document metadata and font definitions
│   │   └── page.js         # Landing page and admin onboarding wizard login
│   ├── components/         # Shared React design blocks
│   │   └── ui/             # Radix/Base UI visual elements (Buttons, Dialogs, Selects, Cards)
│   └── lib/                # Platform core business logic and database drivers
│       ├── db/             # Multi-tenant DB layer with fallback connection caching
│       │   ├── drivers/    # Database drivers for external data targets
│       │   │   ├── firestore.js    # Firebase Firestore driver mapping policies & categories
│       │   │   ├── mongodb.js      # MongoDB Atlas client mapping collections
│       │   │   ├── sqlite-local.js # Default SaaS-shared database sqlite3 client
│       │   │   ├── supabase.js     # PostgreSQL Supabase database client
│       │   │   └── turso.js        # Serverless Turso SQLite client
│       │   └── index.js            # Unified DB client entrypoint & dynamic driver resolver
│       ├── client-search.js        # Client-side MiniSearch builder, overlap chunker & synonym mapper
│       ├── cron-cleanup.js         # Scheduled task purging chat transcripts older than 7 days
│       ├── crypto-server.js        # AES-256-GCM backend key encryption & decryption service
│       ├── crypto.js               # Standalone browser/client crypto modules
│       ├── document-parser.js      # Plaintext parser (PDF-parse, mammoth docx, txt extractors)
│       ├── embeddings-client.js    # Browser/server utility matching vector embedding setups
│       ├── markdown.js             # Plaintext layout sanitizer and markdown transformer
│       └── utils.js                # Tailwind CSS class merger and styling helper utilities
```

---

## 🚀 Quick Start

### Prerequisites
* Node.js (v18+ recommended)
* NPM or Yarn

### 1. Clone & Install
```bash
git clone https://github.com/yourorg/rag-bot.git
cd rag-bot
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
LOCAL_MODE=true
# Set to true to bypass organization credentials and run off local SQLite database.sqlite
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔌 Channel Integrations

### 1. Web Widget Script
Add this script to the bottom of your company portal or website. It injects a floating bubble that opens a spacious, responsive **440px x 680px** chat modal:

```html
<!-- HushRag Widget -->
<script 
  src="http://localhost:3000/api/widget"
  data-org="your_org_id"
  data-channel="web-widget"
  data-pass="optional_passcode"
  defer>
</script>
```

* **Important features of the script:**
  * **Cache-busting:** Served with `no-store` headers so UI/styling updates load instantly.
  * **CSS Isolation:** Styled with `!important` bounds (`width: 440px`, `height: 680px`, `min-height: 500px`) to prevent host site CSS reset libraries from collapsing the widget to a small bar.
  * **Persistent Sessions:** Unlocking the widget with an access code saves verification in `sessionStorage` to prevent re-locking during site browsing.

---

## 📋 API Endpoints

| Endpoint | Method | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `/api/settings` | `GET` | `?orgId=...` | Retrieves settings and masks keys as `••••••••`. |
| `/api/settings` | `POST` | settings JSON | Saves LLM, Database, and Pinecone credentials (encrypted server-side). |
| `/api/categories` | `GET` | `?orgId=...` | Retrieves plaintext category folders. |
| `/api/categories` | `POST` | `{ orgId, categoryId, name, description }` | Creates/updates folder category metadata. |
| `/api/documents` | `GET` | `?orgId=...&categoryId=...` | Lists plaintext document metadata. |
| `/api/documents` | `POST` | document JSON + vectors | Writes chunks to database and vectors to Pinecone. |
| `/api/search` | `POST` | `{ orgId, query, vector, categoryId }` | Returns top 8 matched chunks (via Pinecone or SQLite fallback). |
| `/api/chat` | `POST` | `{ orgId, query, context, history }` | Decrypts LLM key and streams LLM chat tokens. |
| `/api/chats` | `GET` | `?orgId=...` | Retrieves plaintext conversation history lists. |
| `/api/chats` | `POST` | `{ orgId, sessionId, channel, history }` | Logs plaintext conversation transcripts. |
| `/api/channels/verify` | `POST` | `{ orgId, code }` | Verifies employee access code passcode. |

---

## 🗄️ Database Configurations

All organization metadata, categories, handbooks, and transcripts are stored in the client's database. When configuring database credentials in the Admin Dashboard, the credentials must be entered as a serialized JSON string. The required keys depend on the database provider selected:

* **SQLite Local (`sqlite-local`):** No configurations required. Config: `{}`
* **Turso (`turso`):**
  ```json
  {
    "url": "libsql://db-name-username.turso.io",
    "authToken": "JWT_TOKEN"
  }
  ```
* **Supabase / PostgreSQL (`supabase`):**
  ```json
  {
    "connectionString": "postgresql://postgres:password@db.supabase.co:5432/postgres"
  }
  ```
* **Cloud Firestore (`firestore`):**
  ```json
  {
    "projectId": "project-id",
    "clientEmail": "admin@project.iam.gserviceaccount.com",
    "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"
  }
  ```
* **MongoDB (`mongodb`):**
  ```json
  {
    "uri": "mongodb+srv://user:pass@cluster.mongodb.net",
    "dbName": "policy_bot"
  }
  ```

---

## 📄 License

This project is owned and developed by **Quantaura Design Tech Pvt. Ltd.**
* **Website:** [quantaura.in](https://quantaura.in)
* **Contact:** contact@quantaura.in

This project is licensed under a Custom Non-Commercial No-Derivatives License - see the [LICENSE](file:///Users/harildixit/Documents/RAG-bot/LICENSE) file for details.



