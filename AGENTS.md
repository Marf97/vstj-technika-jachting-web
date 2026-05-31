# AGENTS.md — Coding Guidelines for This Repository

This document provides clear, practical instructions for coding agents working on **VSTJ Technika Jachting Web** to ensure changes are consistent, safe, and easy to review.

---

## 1. Project Overview

**VSTJ Technika Jachting Web** is a React + PHP web application for the University Sports Club sailing section.

### Architecture
- **Frontend**: React 18 (SPA) with Vite, built in `src/`
- **Backend**: Custom PHP router in `php/`, serves JSON endpoints via `/api`
- **Build output**: Vite copies PHP files to `dist/` and serves them at build time
- **Deployment**: Docker via `Dockerfile` and `docker-compose.yml`

### Key integrations
- Azure AD authentication via MSAL
- Microsoft Graph API for SharePoint gallery and news
- Material-UI (MUI) with custom brand theme
- Full Calendar for member events

---

## 2. General Coding Standards

### Core principles
1. **Keep changes small and focused**  
   - One feature or bugfix per commit or pull request.
   - Do not combine refactoring with new features.

2. **Follow existing architecture and naming conventions**  
   - Study the existing code structure before making changes.
   - Use the same patterns and naming style as surrounding code.

3. **Do not reformat unrelated files**  
   - Never apply linting or formatting to files you didn't modify.
   - If a file's formatting bothers you, address it in a separate PR.

4. **Do not introduce new dependencies without explanation**  
   - Justify every new npm package or PHP dependency in the commit message.
   - Consider using existing libraries (e.g., MUI already includes icons, date utilities).

5. **Prefer readable, maintainable code over clever code**  
   - Explicit is better than implicit.
   - Future maintainers should understand the code without deep analysis.

6. **Preserve existing public APIs and behavior**  
   - Do not change endpoint signatures, response formats, or component props without clear justification.
   - If you must change a public API, document it and explain the breaking change.

7. **Design for reuse and realistic extension**  
   - When creating components, hooks, modules, or authorization logic, make them flexible enough for nearby future use cases instead of hardcoding a single current scenario.
   - Prefer data-driven configuration, props, and role/capability checks over fixed identities or one-off branches.
   - Example: if members can currently log in through `clen.jachting@technika-praha.cz`, do not build the member area as if that is the only possible authenticated account forever. Structure the solution so another account such as `jaching@technika-praha.cz` can be added with a different role, such as an admin who can approve or reject calendar events, without rewriting the component or endpoint from scratch.
   - Keep this pragmatic: do not over-engineer broad frameworks, but avoid designs that are obviously tied to one email address, one role, or one page.

---

## 3. React / Frontend Standards

### Component structure
- **Location**: Place components in `src/components/`  
- **Naming**: Use PascalCase (e.g., `MemberArea.jsx`, `Gallery.tsx`)
- **Style**: Prefer functional components with hooks (the project already uses this pattern)
- **Scope**: One component per file unless a component is purely internal to another

### Component design
- Keep components **small and focused**; break large components into smaller pieces.
- Prioritize **reusable, flexible components**. Accept props for data, permissions, labels, callbacks, and state instead of embedding one specific workflow or user role directly in the component.
- Avoid duplicating state. Use a parent component or shared context if needed.
- Handle **loading, empty, and error states** explicitly (do not assume data always arrives).
- Pass computed/derived data as props; avoid complex logic in JSX.

### Styling
- Use MUI components and the custom theme from `src/theme.js` when possible.
- Style overrides: use MUI's `sx` prop or Emotion `styled` components.
- Never hardcode colors, spacing, or font sizes; use theme values.
- Global styles in `src/index.css` only for true global rules.

### Accessibility
- Add `alt` text to all images (`Gallery.tsx` should already follow this).
- Use semantic HTML: `<button>`, `<a>`, `<nav>`, etc.
- Include `aria-label` or `aria-describedby` for icon-only buttons.
- Ensure all interactive controls are keyboard-accessible.
- Use adequate color contrast; test with a11y tools if making theme changes.

### TypeScript
- New components may use `.tsx` if the component logic is complex or data-heavy.
- Keep types simple and avoid overly generic types.
- Do not use `any` without a comment explaining why.

### Configuration and magic values
- Never hardcode API endpoints, cache times, or feature flags in components.
- Add such constants to `src/theme.js` or `src/lib/` as appropriate.
- Environment variables: use `import.meta.env.VITE_*` (Vite convention).

---

## 4. PHP / Backend Standards

### Directory structure and routing
- **Endpoints**: Add new endpoints to `php/endpoints/` as new files (e.g., `php/endpoints/members.php`).
- **Business logic**: Implement in `php/modules/` as classes (e.g., `php/modules/Members.php`).
- **Core utilities**: Shared code in `php/core/` (e.g., `Config.php`, `Auth.php`).
- **Routing**: The `Router` class dispatches requests by the `action` query parameter.

### Request handling pattern
- All endpoints return JSON in the format: `{ success: bool, data?: any, error?: string }`
- Extract query parameters safely: `$_GET['param'] ?? default`
- Validate and sanitize all external input before use.
- Set appropriate HTTP status codes: 200 (success), 400 (bad request), 404 (not found), 500 (server error).

### Environment and secrets
- Sensitive values (API keys, client IDs, tokens) go in `.env.php` at the repository root.
- Never commit `.env.php` or include credentials in code.
- Load environment config via `Config::loadEnv()` before using credentials.
- The app supports environment-specific overrides: `.env.php.development`, `.env.php.production`.

### Error handling
- Catch exceptions and return JSON error responses; do not expose stack traces to the client.
- Log errors to the server (if a logging system is in place) for debugging.
- Example:
  ```php
  try {
      // Code here
  } catch (Exception $e) {
      $this->respond(['success' => false, 'error' => 'Operation failed'], 500);
  }
  ```

### Cache patterns
- The `Auth` class caches access tokens with encryption in `sys_get_temp_dir()`.
- Other cache times are configured in `Config::*_CACHE_TIME` constants.
- For new endpoints: evaluate whether caching is needed based on data volatility and performance.

### Data validation and security
- **Input validation**: Check that required parameters exist and are the expected type.
- **Output escaping**: When returning user input, ensure it is JSON-encoded (PHP's `json_encode()` handles escaping).
- **SQL/API injection**: Use parameterized queries or ORM if database access is added.
- **Authorization**: Check membership status in `MemberAuth` before exposing restricted data.

---

## 5. Security and Configuration

### Secrets and credentials
- **Never commit**: `.env.php`, API keys, client secrets, personal tokens, or credentials.
- **Verify before deployment**: Check that no sensitive data is in git history or comments.
- Use `.gitignore` to exclude `.env.php*` (verify it is already listed).

### External input handling
- **Always validate and sanitize** query parameters, POST bodies, file uploads, and headers.
- Assume user input is untrusted.
- Use allowlists where possible (e.g., enum values for `action`).

### Authentication and authorization
- Azure AD tokens are managed by `Auth` and `MemberAuth` classes.
- Verify token validity before granting access to protected endpoints.
- Member-only features: use `MemberAuth::isMember()` checks.

### CORS and redirects
- CORS is handled by the server (check Dockerfile for headers).
- Redirect URLs must be allowlisted; do not redirect to user-supplied URLs.

---

## 6. Testing and Verification

### Scripts and commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with hot reload (http://localhost:5173) |
| `npm run build` | Build for production; outputs to `dist/` |
| `npm run lint` | Run ESLint on frontend code |
| `npm run preview` | Preview production build locally |

### Development server setup
- Frontend dev server runs on `http://localhost:5173`
- Vite proxy forwards `/api/*` to `http://localhost:8080` (backend must run separately or via Docker)
- Backend: PHP can be served via `php -S localhost:8080 -t dist/` (after build) or Docker

### Verification before review
1. **Lint**: Run `npm run lint` and fix any warnings or errors.
2. **Build**: Run `npm run build` to ensure no build errors.
3. **Test manually**: 
   - Frontend changes: test in `npm run dev` and then in the production build preview.
   - Backend changes: test the endpoint with a tool like `curl` or Postman.
4. **Check TypeScript**: If adding `.tsx` files, ensure `src/vite-env.d.ts` types are available.

### Current limitations
- **No automated tests**: This repository does not have test suites (Jest, PHPUnit, etc.).  
  Consider adding tests for new PHP modules or complex React hooks.
- **No CI/CD pipeline**: Manual verification is required before deployment.

---

## 7. Git and Review Discipline

### Commit messages
- Use clear, imperative subject lines (e.g., "Add member area component" not "added stuff").
- Include a brief description of what changed and why.
- Reference any related issue or feature request.

### Pull request / review checklist
- **Changed files**: List the files modified. Be specific (e.g., "Modified `src/components/Gallery.jsx`, `php/modules/Gallery.php`").
- **What was done**: Summarize the change in 2–3 sentences.
- **How to test**: Include reproduction steps or commands to verify the change works.
- **Risks or follow-up**: Mention any edge cases, technical debt, or future work needed.
- **Example**:
  ```
  ## Summary
  Adds a date filter to the gallery component to let users browse by year.
  
  ## Files changed
  - src/components/Gallery.tsx (added year picker)
  - php/modules/Gallery.php (new getAvailableYears() method)
  - php/endpoints/gallery.php (new list_gallery_years action)
  
  ## How to test
  1. npm run dev
  2. Navigate to Gallery page
  3. Select a year from the filter dropdown
  4. Verify images change accordingly
  
  ## Notes
  - Caching time for year list is 24 hours (update in Config if needed).
  - Requires backend running on localhost:8080.
  ```

### Avoid common mistakes
- Do not mix unrelated changes (refactoring + new feature).
- Do not commit debug logs, commented-out code, or temporary files.
- Do not update dependencies unless necessary; if you do, explain why in the commit.

---

## 8. Quick Reference: Key Files and Patterns

### Frontend entry points
- `src/main.jsx` — Application bootstrap
- `src/App.jsx` — Main component and routing
- `src/lib/auth.ts` — Azure AD setup
- `src/lib/graph.ts` — Microsoft Graph API utilities
- `src/theme.js` — MUI custom theme

### Backend entry points
- `php/core/Config.php` — Configuration and environment loading
- `php/core/Auth.php` — Azure AD token caching
- `php/modules/Router.php` — Request dispatcher
- `php/endpoints/*.php` — Public endpoint files

### Build and deployment
- `vite.config.js` — Vite configuration; copies PHP files to `dist/`
- `Dockerfile` — Container image; serves PHP via Apache
- `docker-compose.yml` — Full stack (frontend + backend)
- `.env.php` — Secrets and config (not in git)

---

## Questions or issues?

If a guideline is unclear or contradicts existing code, prioritize the existing code pattern over this document and leave a comment for the team to clarify.
