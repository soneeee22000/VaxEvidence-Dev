Plan: MVP Assessment & Roadmap

TL;DR — Produce a concise, actionable assessment of the current MVP (what’s built, technical details, gaps, PMF evaluation, AI opportunities) and a prioritized roadmap to push the product toward product–market fit.

Steps
1. Draft the full technical summary using `README.md` and `MVP_FEATURES.md` and reference implementation files (evidence UI, exports, API routes).
2. Map implemented features to code by linking key files: `components/evidence/pubmed-search.tsx`, `app/api/export`, `components/collaboration/comment-thread.tsx`, and protocol pages under `app/app`.
3. Write the PMF evaluation and prioritized product roadmap (team/admin, audit trails, scheduled exports, onboarding templates).
4. Enumerate AI integration opportunities with suggested approaches and complexity (summaries, tagging, relevance ranking).
5. Produce a 1–2 page deliverable (Assessment + Roadmap) and ask for feedback before finalizing.

Further Considerations
- Clarify priority: business-impact-first vs engineering-effort-first.
- Decide deliverable format: Markdown in repo vs PDF report (or both).
- Security notes should be high-level unless an audit of current RLS policies is requested.

Outcome
- A concise, linked assessment file that documents implemented features, gaps, PMF analysis, prioritized roadmap, AI opportunities, and next steps for the team.

Notes
- Filename requested used the prefix `untitled:` but Windows disallows `:` in filenames; created `untitled-plan-vaxEvidence.prompt.md` instead. If you prefer a different name or to open as an untitled editor buffer, tell me and I will adjust.

What's next
- Review this plan and tell me whether to (A) prioritize by impact or effort, and (B) produce the full assessment file to commit into the repo or keep it as a working draft here.