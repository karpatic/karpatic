# Karpatic Code Writing Conventions

This file documents the coding conventions used across the client app, especially in `src/head.js`, `src/index.js`, and `src/utils/route.js`.

## Purpose

The app is a hybrid static-site and client-side SPA system with three runtime modes:

- Local/dev
- Build/prerender
- Production/docs

Code in this repository prioritizes:

- Reliability across those environments
- Fast initial load via lazy imports
- Practical browser-native behavior over framework-heavy patterns

## Architecture Conventions

### 1) Global runtime state lives on `window`

Use `window.w = window` and store shared mutable state on `w`.

Common global fields:

- `w.oldRoute`, `w.newRoute`
- `w.meta`, `w.oldMeta`
- `w.navEvent`, `w.handleRoute`
- `w._redirectHandler`, `w._popstateHandler`
- `w.preRendering`, `w.isLocal`

Guideline:

- Prefer `w.<name>` for shared state.
- Avoid creating new implicit globals.

### 2) Event-driven navigation pipeline

Navigation flow is intentionally split:

1. `head.js` performs metadata bootstrap and triggers `window.redirect?.()`.
2. `index.js` owns event wiring and lazy-loads router logic.
3. `route.js` resolves content and dispatches a `refresh` event.
4. `refresh_template.js` listens for `refresh` and renders DOM/template state.

Guideline:

- Keep each file focused on its stage.
- Prefer dispatch/listen boundaries instead of direct cross-file DOM mutation.

### 3) Lazy-load expensive modules

Use dynamic imports for route/template/conversion features:

- Router chunk from `index.js`
- Template chunk from `route.js`
- Notebook conversion module in local mode only

Guideline:

- New heavy features should be lazy-loaded unless needed on first paint.

### 4) Environment-aware route and content resolution

Route normalization should account for:

- `/docs/` paths
- `.html` suffixes
- Relative path artifacts (`./`, `../`)
- Root defaulting to `index`

Content loading order:

1. Preferred source (JSON in prod/prerender or ipynb conversion in local)
2. CMS fallback for note-like routes
3. Recovery behavior to prevent reload loops

Guideline:

- Keep fallbacks explicit and ordered.
- Always guard against infinite retries.

## Style Conventions

### 1) Pragmatic, compact JavaScript

Code favors concise expressions and direct browser APIs (`fetch`, `history`, `CustomEvent`, `scrollIntoView`, `sendBeacon`).

Guideline:

- Compact code is fine, but avoid obscuring behavior.
- When logic becomes non-obvious, split into small helpers.

### 2) Comments describe intent and runtime context

File headers and block comments explain runtime responsibilities, not just syntax.

Guideline:

- Keep comments operational: what stage this runs in, what side effects occur, and why.

### 3) Defensive null-safe access

Optional chaining and early returns are used heavily to avoid runtime breaks across prerender/dev/prod differences.

Guideline:

- Use `?.` and guard clauses when touching dynamic DOM/runtime globals.

### 4) Console logging is part of diagnostics

`console.group`/`console.log` trace route and refresh flow.

Guideline:

- Keep useful lifecycle logs.
- Avoid noisy logs in steady-state production paths.

## DOM and Navigation Conventions

### 1) Delegated navigation, not per-link listeners

Relative link clicks are handled with delegated listeners.

Guideline:

- Ensure handlers are idempotent: remove old listener before adding new one.

### 2) Hash and history behavior must avoid duplication

Anchor-only navigation should avoid history spam; base-route changes should push once.

Guideline:

- Preserve existing checks for duplicate pushes/replaces.
- Keep internal route trackers (`w.href`, `w.lastPushedBase`) synchronized.

### 3) Template refresh owns post-route DOM population

After route resolution, the renderer updates content slots, TOC, sitemap, utilities, and script refresh behavior.

Guideline:

- Route resolution should produce data.
- Template refresh should own DOM presentation.

## Metadata and SEO Conventions

Head rendering is generated with Helmet in build/prerender flows and merged from:

- Base `header.json`
- Per-page meta JSON when available

Guideline:

- Preserve backward-compatible meta keys (`title`, `tab`, `summary`, `description`, etc.).
- Add new fields in a non-breaking way.

## Service Worker Conventions

Service worker registration is one-time and conditional.

Guideline:

- Keep cache-busting explicit.
- Keep activation cleanup safe and deterministic.

## Editing Rules For Contributors

When modifying app flow files (`head.js`, `index.js`, `route.js`, `refresh_template.js`):

1. Maintain global-state compatibility (`w` contract).
2. Keep route normalization behavior stable.
3. Preserve lazy import boundaries.
4. Keep navigation listeners idempotent.
5. Do not break prerender assumptions.
6. Preserve failure fallbacks and loop guards.

## Known Drift To Avoid

These patterns have caused confusion and should be avoided in new code:

- Mixing `w.<name>` with bare implicit globals for shared state
- Multiple registrations of the same global event without teardown
- Re-fetching the same URL in the same try block
- Extremely dense one-liners when intent is not obvious

## Suggested Pattern For New Features

For new runtime features:

1. Resolve any route/data inputs in `route.js`.
2. Store state on `w` in a stable key.
3. Trigger `refresh` if UI output changes.
4. Render in template layer functions.
5. Add guards for dev/prerender/prod behavior.
6. Add concise logs at stage boundaries.

## Quick PR Checklist

- Does it work in root and `/docs/` paths?
- Does hash navigation still behave correctly?
- Are listeners attached exactly once?
- Are failures handled without reload loops?
- Is shared state stored consistently on `w`?
- Are expensive modules still lazy-loaded?
