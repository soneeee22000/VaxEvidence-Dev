# Contributing

Thanks for your interest in contributing to VaxEvidence! This document covers the setup, conventions, and process for contributing.

## Prerequisites

- **Node.js** >= 22
- **pnpm** >= 10
- **Git**
- **Supabase account** (for integration tests, optional)

## Local Setup

```bash
# Clone the repository
git clone https://github.com/VaxEvidence/vax-evidence-dev.git
cd vax-evidence-dev

# Install dependencies
pnpm install

# Set up environment variables
cp .env.test.example .env.local
# Edit .env.local with your Supabase project credentials

# Start development server
pnpm dev
```

The app runs at `http://localhost:3000`. The demo mode at `/demo` works without Supabase credentials.

## Code Standards

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- Zod schemas for all validation
- Prefer type inference; explicit types at API boundaries

### Styling

- Tailwind CSS utility classes only (no CSS modules)
- Use `cn()` from `@/lib/utils` for conditional class merging
- OKLCH color space via CSS variables
- Dark mode is the default

### File Naming

- Components: `kebab-case.tsx`
- Library modules: `kebab-case.ts`
- Pages/layouts: `page.tsx`, `layout.tsx`

### Imports

Use `@/*` absolute imports. Order: external libs, UI components, feature components, lib, types, icons.

## Branch & Commit Conventions

### Branches

- `main` is the production branch
- Feature branches: `feat/description`
- Bug fixes: `fix/description`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PRISMA flow diagram export
fix: correct RLS policy for workspace members
docs: update API endpoint documentation
refactor: extract screening logic into separate module
test: add integration tests for evidence CRUD
chore: update dependencies
```

## Testing

Run the full test suite before submitting a PR:

```bash
pnpm lint            # ESLint
pnpm typecheck       # TypeScript strict check
pnpm test            # Unit tests (~1,400 tests)
pnpm test:e2e        # E2E tests (63 tests, requires running app)
```

Integration tests require Supabase credentials:

```bash
pnpm test:integration  # 60 tests against real Supabase
```

### Writing Tests

- Unit tests go in `__tests__/` mirroring the source structure
- E2E tests go in `e2e/`
- Use `vitest` for unit/integration, `@playwright/test` for E2E
- Aim for meaningful coverage on new features

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with conventional commits
3. Ensure all checks pass (`lint`, `typecheck`, `test`)
4. Open a PR against `main`
5. Fill out the PR template
6. Address review feedback

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design details before making structural changes.
