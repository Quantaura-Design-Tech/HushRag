# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

HushRag takes security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT open a public issue.** Security vulnerabilities must be reported privately.
2. Email **contact@quantaura.in** with:
   - A description of the vulnerability
   - Steps to reproduce it
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: You will receive an acknowledgment within **48 hours**.
- **Updates**: We will provide updates on the status of the fix within **7 days**.
- **Resolution**: We aim to resolve critical vulnerabilities within **30 days**.
- **Credit**: If you'd like, we will credit you in the security advisory and release notes.

## Scope

The following are in scope:
- The HushRag web application (`src/`)
- API endpoints (`src/app/api/`)
- Cryptographic implementations (`src/lib/crypto.js`, `src/lib/crypto-server.js`)
- Database drivers (`src/lib/db/`)
- Widget embedding script (`src/app/api/widget/`)
- Dependencies with known CVEs

The following are out of scope:
- Issues in third-party services (OpenAI, Anthropic, Pinecone, Turso, etc.)
- Issues caused by misconfiguration by the deploying organization
- Social engineering attacks

## Security Considerations for Self-Hosters

If you are self-hosting HushRag, please ensure:

1. **Set `ENCRYPTION_KEY`** to a strong random value (minimum 32 bytes). Do not use the default fallback.
2. **Set `JWT_SECRET`** to a strong random value. Do not use the default fallback.
3. **Use HTTPS** in production. Never expose the API over plain HTTP.
4. **Keep dependencies updated** by running `npm audit` regularly.
5. **Restrict database access** using the principle of least privilege.
