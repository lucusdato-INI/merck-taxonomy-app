# Merck CTT Taxonomy Generator

## What this is

A client-side React app that generates MSD CTT-compliant taxonomy strings for Merck Canada media campaigns. Planners upload a blocking chart (.xlsx), fill in metadata, and download a complete traffic sheet with Social, Digital, and Search taxonomy strings.

## Tech stack

- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS v4 (styling)
- ExcelJS (browser build — reads and writes .xlsx)
- file-saver (triggers browser downloads)
- Vitest + React Testing Library (testing)
- ESLint + Prettier (linting/formatting)

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — TypeScript type checking only
- `npm run test` — run tests once
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — ESLint
- `npm run format` — Prettier (write)
- `npm run format:check` — Prettier (check only)

## Project structure

```
src/
  components/     # React UI components (FileUploader, CampaignForm, etc.)
  engine/         # Business logic (config, bcParser, taxonomyBuilder, validator, trafficSheetWriter)
  utils/          # Shared utilities (excelHelpers, formatters)
  test/           # Test setup
  App.tsx          # Main app shell with step-based flow
  main.tsx         # Vite entry point
```

## Key conventions

- All processing is client-side. No server, no API calls, no database.
- Taxonomy strings use underscores as field separators, plus signs for compound values.
- Product configs, platform mappings, and validation rules are hardcoded in `src/engine/config.ts`.
- The PRD at `docs/Merck_CTT_Taxonomy_App_PRD.md` is the source of truth for taxonomy string templates, validation rules, and output structure.

## CI

GitHub Actions runs on push/PR to main: lint, typecheck, test, build.
Deployed on Vercel (connected to the repo).
