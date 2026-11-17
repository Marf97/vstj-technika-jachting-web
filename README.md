# VŠTJ Technika Jachting Web

Website for the VŠTJ Technika sailing section: public news, photos and boat information, plus a member calendar, rental rules and price list. The UI is Czech; developer documentation is English.

## What runs where

- **Browser:** React 18, Vite 7, mixed JSX/TypeScript, React Router, MUI/Emotion, React Markdown and FullCalendar.
- **Server:** custom PHP endpoints. Public content is read from SharePoint through Microsoft Graph using an application token. Member login uses server-side OpenID Connect (OIDC) and a PHP session cookie, **not browser MSAL**.
- **Storage:** SharePoint document-library folders for public content and two SharePoint lists for reservations/club events. This repository has no application database.
- **Hosting:** static frontend **and a PHP-capable server** are required for the full site. A static-only host cannot run the APIs. Docker Compose currently provides the backend development service, not a production full-stack deployment.

## Start here

| Need | Read |
| --- | --- |
| Run locally for the first time | [Development setup](docs/development.md) |
| Understand components, trust boundaries and request flows | [Architecture and diagrams](docs/architecture.md) |
| Configure frontend, PHP, Entra ID and SharePoint | [Configuration reference](docs/configuration.md) |
| Integrate with or change an endpoint | [API reference](docs/api.md) |
| Publish content or diagnose an incident | [Operations and limitations](docs/operations.md) |
| Deploy a release | [Deployment runbook](DEPLOYMENT_README.md) |
| Make a pull request | [Contributing and documentation policy](CONTRIBUTING.md) |
| Browse every document | [Documentation index](docs/README.md) |

## Local quick start

Use Node **20.19+ or 22.12+** (Vite 7 minimums; Node 24 LTS is a suitable choice), npm, and PHP 8.1+ with OpenSSL, cURL, sessions and HTTPS stream support. Credentials and a test SharePoint site are needed to exercise integrations. Never test mutations against production data.

```sh
git clone https://github.com/Marf97/vstj-technika-jachting-web.git
cd vstj-technika-jachting-web
npm ci
```

Create `.env.development.local` with the four endpoint URLs from [Development setup](docs/development.md), and provision an untracked `.env.php` using [Configuration](docs/configuration.md). In separate terminals at the repository root:

```sh
php -S localhost:8080 -t .
```

```sh
npm run dev
```

Open `http://localhost:5173`. The built-in PHP server is **local development only**: its root contains source/configuration files and must never be exposed to the network. If PHP is unavailable, [the Docker alternative](docs/development.md#docker-backend-alternative) uses the existing Compose service.

## Commands and verification

| Command | Actual scope |
| --- | --- |
| `npm ci` | Install the lockfile dependency set |
| `npm run dev` | Vite dev server; `/api` requests proxy to port 8080 |
| `npm run lint` | ESLint; current configuration covers JS/JSX, not TypeScript |
| `npm run build` | Build frontend and emit PHP files under `dist/php`; does not run `tsc` |
| `npm run preview` | Static build preview; does **not** execute PHP or reproduce the dev proxy |

**Before building:** read [the build-environment warning](DEPLOYMENT_README.md#build-environment-warning). The current Vite plugin embeds PHP env-file values and all nonempty process environment strings into generated PHP. Use an isolated, minimal build environment; never upload build output or logs without checking for secrets. No automated application test suite or CI workflow is currently tracked; lint/build are not proof that login, Graph permissions or PHP work.

## Repository map

```text
src/App.jsx               Routes and page composition
src/components/           Public pages, member UI and FullCalendar
src/lib/auth.ts           Member session context and login/logout redirects
src/lib/graph.ts          Browser client for PHP APIs (not direct Graph)
src/content/member/       Bundled rules, price list and payment QR
src/theme.js              MUI theme
public/                   Local Markdown, images, fonts and Apache SPA rewrite
php/endpoints/            news.php, gallery.php, auth.php, member-calendar.php
php/modules/              News/Gallery logic and a legacy Router
php/core/                 Configuration, app token, OIDC/session and Graph transport
docs/                     Developer handbook and historical design proposals
vite.config.js            Dev proxy and PHP build emission
```

## Keeping documentation current

Every repository change must keep **README and relevant documentation accurate in the same PR**, including diagrams when architecture/flows change. If no edit is necessary, explain why in the PR checklist. See [Contributing](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Never copy credentials, session cookies, real member records or secret-bearing generated PHP into documentation.
