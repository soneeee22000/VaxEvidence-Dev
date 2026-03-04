# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

**Email:** security@vaxevidence.com

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

**Do not** open a public GitHub issue for security vulnerabilities.

## Security Measures

### Authentication & Authorization

- **Supabase Auth** for OAuth and passwordless authentication
- **Row-Level Security (RLS)** on all PostgreSQL tables
- **Session management** via `@supabase/ssr` with automatic token refresh
- **Route protection** via `proxy.ts` (Next.js 16 convention)
- **API key authentication** for public REST API endpoints

### Transport & Headers

- HTTPS enforced (Vercel platform)
- Content Security Policy restricting connect-src to `*.supabase.co`
- `X-Frame-Options: DENY` preventing clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation

### Input Validation

- Zod schema validation on all API inputs
- Input sanitization via `lib/security/`
- Parameterized queries via Supabase client (no raw SQL injection vectors)

### API Security

- Rate limiting on public API endpoints
- HMAC-signed webhook deliveries
- API key rotation support
- Request logging and audit trail

### Secrets Management

- Environment variables for all secrets (never committed)
- `.env*` files in `.gitignore`
- Service role key restricted to server-side only

## Known Limitations

- No independent penetration testing has been performed
- No SOC 2 or HIPAA certification
- Regulatory exports produce structured templates, not submission-ready packages
- SSO/SAML requires Supabase Enterprise plan

## Dependencies

Dependencies are monitored via:

- `pnpm audit` for known vulnerabilities
- Dependabot for automated update PRs
- Manual review of critical dependency updates

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
