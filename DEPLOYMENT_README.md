# Deployment runbook

[Documentation index](docs/README.md) · [Configuration reference](docs/configuration.md)

## Supported shape, not provisioned infrastructure

The full site requires a static SPA **and executable PHP endpoints**, HTTPS, outbound access to Entra/Graph/SharePoint, PHP sessions and writable private temporary storage. A static-only Netlify/Vercel/GitHub Pages deployment cannot provide the PHP backend by itself. A separately hosted PHP API is possible but requires deliberately configured absolute URLs, origins, cookies and callbacks; it is not provisioned here.

The existing Dockerfile/Compose setup is a **backend development aid**, not a production full-stack image. It does not run npm or copy the built React application. Compose mounts source under `/php/`; the standalone Dockerfile copies PHP contents directly under the web root. Do not assume the two layouts expose identical URLs.

## Build environment warning

**Current behavior of `vite.config.js`:** reads `.env.php` and `.env.php.production`, merges every nonempty string from `process.env` (process values win), serializes them and injects PHP bootstrap code into every emitted PHP source file. The source comment saying it avoids inlining secrets is misleading. The plugin does this even though runtime `.env.php` files themselves are not copied as public assets.

Consequences:

- A normal build in a developer shell or CI runner can capture unrelated credentials, tokens and personal environment values in `dist/php/**`.
- Use a clean isolated checkout/build account/container with **only necessary OS/toolchain environment variables** and explicit non-sensitive frontend settings. Do not inherit the parent shell's entire environment.
- Do not copy `.env.php*` secret files into the build workspace. Supply backend secrets privately at runtime, not through build injection. Review tracked overrides too.
- Vite `VITE_*` values remain public. Backend secrets must never use that prefix.
- Treat generated output as sensitive until inspected by the operator. Do not attach it to PRs, logs or public artifact stores, even for a documentation verification build.
- This runbook does not fix the injection. Removing it safely needs a separately reviewed code change with deployment regression checks.

## Prepare a release

1. Use a reviewed commit and the lockfile. Confirm README, API/configuration pages and diagrams match the release.
2. Set the four production frontend URLs before building. For a same-origin PHP host:

   ```dotenv
   VITE_NEWS_PROXY_URL=https://<site-host>/php/endpoints/news.php
   VITE_GALLERY_PROXY_URL=https://<site-host>/php/endpoints/gallery.php
   VITE_AUTH_PROXY_URL=https://<site-host>/php/endpoints/auth.php
   VITE_MEMBER_CALENDAR_URL=https://<site-host>/php/endpoints/member-calendar.php
   ```

   `/api` is a Vite dev-only prefix unless the production server explicitly configures an equivalent route. Auth/calendar values must be absolute.
3. In the isolated minimal build environment, run:

   ```sh
   npm ci
   npm run lint
   npm run build
   ```

4. Inspect the output layout: `dist/index.html`, assets, copied public content, `.htaccess`, and `dist/php/{endpoints,core,modules}`. Verify the exact current endpoints exist: `news.php`, `gallery.php`, `auth.php`, `member-calendar.php`. Old `php_proxy.php`/`php_get_image.php` deployment instructions no longer apply.
5. Verify emitted PHP contains no unintended captured secrets/environment values. Keep inspection private and do not print generated PHP into shared logs.

## Configure the host

- Use PHP 8.1+ with OpenSSL, sessions, cURL (News uses parallel curl requests), JSON, HTTPS streams/`allow_url_fopen` and trusted CA certificates. The Dockerfile's base tag is not proof all extensions/settings needed by every path are configured.
- Serve built files from the intended document root. Keep PHP includes relative to the `dist/php/` structure.
- Supply required runtime settings per [Configuration](docs/configuration.md), selecting `ENVIRONMENT=production`. Config reads base `.env.php` then `.env.php.production`, which can overwrite server values; ensure precedence is intentional.
- **Explicitly deny HTTP access to all `.env*`, repository files and private config files.** KEY=value `.env.php` files are plain text without a PHP opening tag; PHP hosting alone does not protect them. Verify requests return 403/404 without disclosing contents.
- Configure existing static files normally, execute existing PHP endpoint files and route remaining frontend paths to `index.html`. Do not rewrite API errors/missing API files to the SPA. Apache's copied `.htaccess` requires mod_rewrite and appropriate AllowOverride. Other hosts need equivalent rules.
- Set `ALLOWED_ORIGINS` to exact browser origins. For same-origin deployment prefer keeping cookie-based auth on the site's origin. Cross-site cookie hosting is not covered by the current SameSite=Lax behavior.
- Register the exact production **Web** callback URL `https://<site-host>/php/endpoints/auth.php?action=callback` in Entra and in `MEMBER_OIDC_REDIRECT_URI`.
- Ensure PHP sees HTTPS correctly behind trusted proxies, stores sessions securely and can write private temp/cache files. Prevent public/shared caching of auth/calendar responses.
- Confirm least-privilege Graph application grants, configured lists/fields and member/admin allowlists using a staging tenant/site first.

## Post-deploy acceptance

Use a staging environment/disposable items for mutation tests; do not perform destructive production verification without explicit authorization.

- [ ] Home, boats, public news years/article images, gallery thumbnails/full image work.
- [ ] Deep-link reloads work without turning endpoint requests into HTML.
- [ ] `.env*` and private files cannot be fetched over HTTP; no secret values are exposed in browser bundles.
- [ ] Anonymous calendar request is denied; session endpoint reports anonymous correctly.
- [ ] Allowed member can log in and read calendar; disallowed identity cannot access it.
- [ ] Admin capabilities are correct; basic members cannot invoke admin operations directly.
- [ ] Test reservation confirmation/cancellation persists on readback; test club-event deletion removes the correct list item.
- [ ] Rules/price list render; external creation links and external form/list processing are separately checked.
- [ ] TLS/cookies/callbacks and server logs show no unexpected failures; logs are not exposing tokens or member data.

Lint/build alone do not satisfy these checks. Record the release commit, actual checks and any untested integrations without including secrets.

## Rollback

Retain the previous reviewed build and its non-secret configuration description in a private release store. Redeploy that artifact/configuration if checks fail; verify the endpoint URLs, callback and sessions again. A frontend rollback does **not** reverse SharePoint PATCH/DELETE operations or external form submissions. Recovery of list data must follow the SharePoint operator's backup/recycle-bin procedures, which are not automated here.
