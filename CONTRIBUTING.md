# Contributing to HushRag

Thank you for your interest in contributing to HushRag! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hushrag.git
   cd hushrag
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Quantaura-Design-Tech/HushRag.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   For local development, `LOCAL_MODE=true` is sufficient.

## How to Contribute

### Reporting Bugs

- Check [existing issues](https://github.com/Quantaura-Design-Tech/HushRag/issues) to avoid duplicates.
- Use the [bug report template](https://github.com/Quantaura-Design-Tech/HushRag/issues/new?template=bug_report.md).
- Include:
  - Clear description of the bug
  - Steps to reproduce
  - Expected vs. actual behavior
  - Environment details (OS, Node.js version, browser)
  - Relevant logs or screenshots

### Suggesting Features

- Open a [feature request](https://github.com/Quantaura-Design-Tech/HushRag/issues/new?template=feature_request.md).
- Clearly describe the problem your feature solves.
- Explain why it fits the project's goals (zero-knowledge, client-side, privacy-first).

### Submitting Code

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
2. Make your changes and commit with clear, descriptive messages.
3. Push to your fork and open a Pull Request against `main`.

## Development Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
│   └── api/       # Serverless API endpoints
├── components/    # Shared React components
│   └── ui/        # Base UI primitives
└── lib/           # Core business logic, DB drivers, crypto
    └── db/        # Multi-tenant database layer
```

## Pull Request Process

1. **Keep PRs focused**: One feature or fix per PR.
2. **Write clear commit messages**: Use conventional commits when possible (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).
3. **Update documentation**: If you change behavior, update the README or relevant docs.
4. **Ensure the build passes**: Run `npm run build` and `npm run lint` before submitting.
5. **Fill out the PR template** completely.
6. A maintainer will review your PR. Please be responsive to feedback.

### PR Title Format

Use a clear, imperative title:
- `feat: add Supabase row-level security support`
- `fix: prevent widget from collapsing on mobile Safari`
- `docs: update database configuration examples`

## Coding Standards

- **Language**: JavaScript (ES modules). No TypeScript yet.
- **Framework**: Next.js App Router.
- **Styling**: Tailwind CSS v4 + shadcn/ui components.
- **Formatting**: Follow the existing code style. Run `npm run lint` to check.
- **Comments**: Write clear inline comments for complex logic. Use JSDoc for public functions.
- **Security**: Never log or expose sensitive credentials. All secrets go through the encryption layer (`src/lib/crypto-server.js`).
- **Database**: Follow the multi-tenant pattern in `src/lib/db/`. Always use `orgId` to scope queries.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](./LICENSE).
