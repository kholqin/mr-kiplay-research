# Mr.Kiplay Research Platform

Mr.Kiplay Research is an authenticated, audit-oriented workspace for **authorized security research**. It centralizes project scope, authorization records, workflow progress, findings, evidence metadata, and reporting preparation without executing exploits, automated attacks, or arbitrary security binaries from the browser.

## Product scope

The platform is intentionally designed as a **research operations system**, not an offensive automation framework. Every target must have an authorization record and a documented scope. The workflow modules—Android, web, binary, network, fuzzing, source analysis, correlation, evidence, and reporting—track process and results only. Execution engines can be integrated later behind a separately isolated worker boundary, but this application does not expose such execution by default.

## Stack

| Layer | Implementation |
| --- | --- |
| UI | React 19, Tailwind CSS 4, shadcn/ui primitives |
| API | Express, tRPC 11, Zod validation |
| Data | Drizzle ORM with MySQL/TiDB-compatible schema |
| Auth | Manus OAuth with protected tRPC procedures |
| Storage | S3-compatible object storage references for evidence metadata |
| Quality | TypeScript strict checking and Vitest |

## Local development

```bash
pnpm install
pnpm dev
```

Use `pnpm check` for TypeScript validation, `pnpm test` for the test suite, and `pnpm build` for a production build. Environment values are injected by the managed project runtime; do not commit `.env` files or credentials.

## Data model

The core tables are `workspaces`, `researchProjects`, `findings`, `evidence`, `workflowModules`, and `auditActivities`, alongside the authenticated `users` table. Evidence stores object-storage references, file metadata, and URLs; file bytes are never stored in database columns. All protected procedures derive ownership from the authenticated session rather than accepting an arbitrary actor identity from the client.

## Safety and compliance

Use this project only for systems, applications, and data for which the operator has explicit permission. Keep authorization references current, document boundaries before research begins, and attach evidence that can be reviewed by the project owner. High-priority findings and project creation events notify the owner through the managed notification channel. Before adding any worker or engine integration, implement authentication, authorization, resource limits, timeout controls, network policy, filesystem isolation, artifact validation, cancellation, and audit logging.

## GitHub release checklist

Create a private repository first, review secrets and migration history, run `pnpm check && pnpm test && pnpm build`, then push the project. Change the repository visibility only after confirming that no credentials, private evidence, or sensitive target data are present.

## License

Released under the MIT License. See [LICENSE](./LICENSE).
