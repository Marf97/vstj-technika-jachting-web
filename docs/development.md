# Development setup

[Documentation index](README.md)

## Prerequisites

- Node 20.19+ or 22.12+ for Vite 7; a maintained Node 24 LTS installation is suitable. Use npm with `package-lock.json`.
- PHP 8.1+ (the Dockerfile uses 8.1) with OpenSSL, cURL (news batching), sessions, JSON and `allow_url_fopen`/HTTPS streams enabled. Source uses `str_starts_with` and `match`.
- An authorized test Entra tenant/app registration and SharePoint test content for integration work. Ask the maintainer for access through approved secret channels; do not put secrets in issues or PRs.
- Optional Docker with Compose for the PHP backend.

## Install and configure

```sh
npm ci
```

The repository tracks environment-specific defaults; do not assume they are suitable for your machine or edit them with secrets. Create an untracked `.env.development.local` at the repository root:

```dotenv
VITE_NEWS_PROXY_URL=http://localhost:5173/api/php/endpoints/news.php
VITE_GALLERY_PROXY_URL=http://localhost:5173/api/php/endpoints/gallery.php
VITE_AUTH_PROXY_URL=http://localhost:5173/api/php/endpoints/auth.php
VITE_MEMBER_CALENDAR_URL=http://localhost:5173/api/php/endpoints/member-calendar.php
```

Use absolute URLs: auth and calendar call `new URL(value)` without a base. These examples intentionally route every request through the Vite origin; `/api` is removed by the proxy. `http://localhost:5173/api/php/endpoints/news.php` reaches `http://localhost:8080/php/endpoints/news.php`.

Create untracked `.env.php` with KEY=value lines using [Configuration](configuration.md). Set the OIDC web callback to `http://localhost:5173/api/php/endpoints/auth.php?action=callback`, exactly matching the Entra registration. Include `http://localhost:5173` in `ALLOWED_ORIGINS`. Use `localhost` consistently; switching to `127.0.0.1`, another port or scheme changes cookie/origin behavior. If Vite chooses port 5174 because 5173 is occupied, stop and reconcile URLs, callback and origins instead of assuming it will work.

## Start both servers

In terminal 1 at the repository root:

```sh
php -S localhost:8080 -t .
```

In terminal 2:

```sh
npm run dev
```

Open `http://localhost:5173`. The PHP development server is bound to localhost only; do not expose this source-root server to the network. No frontend build is needed for this development path. Vite serves `public/` and transforms source; PHP serves the source endpoint tree. With no credentials, the frontend may render local pages but public remote content/member login will fail; this is not an offline mock mode.

### Docker backend alternative

The current Compose service binds host port 8080 to Apache and mounts `php/core`, `php/modules`, `php/endpoints` under `/var/www/html/php/`. It also mounts `.env.php` and both tracked PHP environment overrides. The Dockerfile by itself copies `php/` contents to a different root layout; **the Compose mounts are what make `/php/endpoints/...` available** in this setup.

1. Supply `.env.php` as KEY=value text (Compose `env_file` cannot consume a PHP-return-array file).
2. Ensure both `.env.php.development` and `.env.php.production` files exist; review the selected development override, not secret values in logs.
3. Start the backend, then Vite:

```sh
docker compose up -d --build php-proxy
npm run dev
```

Check `docker compose logs php-proxy` privately if startup fails; redact any upstream/token errors before sharing. Stop with `docker compose down`. This service does not compile or serve the full production frontend.

## Verification before review

1. `npm run lint` (JS/JSX only; see `eslint.config.js`).
2. In a **minimal isolated build environment**, `npm run build`; first read [build safety](../DEPLOYMENT_README.md#build-environment-warning).
3. If PHP is installed, run `php -l` on each changed PHP file. Linting PHP does not exercise Graph/session behavior.
4. Check local about/boats pages; browse news years/article detail and gallery/lightbox.
5. With test identities: anonymous calendar denied, allowed member reads, non-allowlisted identity denied, admin-only actions correctly gated.
6. For mutations, use disposable test list items only: confirm/cancel a reservation, delete a test club event, reload and verify SharePoint state. Never treat a successful button click as proof of persistence.
7. Check member rules/price-list navigation, direct deep-link reload, mobile layout, keyboard navigation and error states.
8. Review README, related handbook pages and diagrams for the changed behavior.

No application test suite or CI workflow is tracked. Build does not run TypeScript type checking. `npm run preview` is a **static** preview, not a PHP server, and lacks the dev `/api` proxy. Full production-like checks need PHP hosting with the built frontend; see [Deployment](../DEPLOYMENT_README.md).

For documentation-only changes, check links, Markdown/diagram rendering and source accuracy; no live Graph mutations are needed. Record what you actually ran and what was not exercised in the PR.
