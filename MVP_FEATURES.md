# VaxEvidence MVP Features

## Purpose
Build a focused MVP for vaccine researchers while leaving room to expand to
regulatory and other stakeholders after the core workflow is solid.

## Target Personas
- Vaccine scientists / researchers (primary)
- Regulators / compliance reviewers
- Evidence reviewers / policy advisors
- Internal admins (ops, onboarding, QA)

## Current Features (Implemented)
- Marketing landing page with core sections (hero, features, how-it-works, CTA).
- Waitlist API with validation + rate limiting (`/api/waitlist`).
- Supabase email OTP auth (sign up / log in) with `/auth` UI.
- Protected app placeholder at `/app` with sign-out.

## Core Workflow (Next)
- Protocol Builder
  - Create, edit, view, delete study protocols.
  - Store in Supabase with per-user access (RLS).
  - Dashboard list + protocol detail pages.

## Next Feature After Core
- Evidence / Insight Library
  - Curated evidence catalog with filters/search.
  - Link evidence to protocol context.

## Later Phases (Queued)
- Dataset upload + basic analysis
- Collaboration (comments, reviews, approvals)
- Reporting/export (PDF/Word)
- Audit trails + compliance logging
- Admin tools (user management, templates)

## Delivery Approach
Ship one feature at a time: core protocol builder first, then evidence library,
then the remaining phases as we validate value with users.
