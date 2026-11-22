# Configuration reference

[Documentation index](README.md) · [Local setup](development.md)

## Frontend build configuration

Vite reads `.env`, `.env.local` and mode-specific files (development for dev, production for build), with local overrides; pre-existing process variables take precedence. Restart Vite/rebuild after changes. **Every `VITE_*` value is public browser configuration**, never a secret.

| Variable | Consumer / meaning |
| --- | --- |
| `VITE_NEWS_PROXY_URL` | News and NewsFeed; full `news.php` endpoint URL |
| `VITE_GALLERY_PROXY_URL` | Gallery; full `gallery.php` endpoint URL |
| `VITE_AUTH_PROXY_URL` | `src/lib/auth.ts`; absolute `auth.php` URL |
| `VITE_MEMBER_CALENDAR_URL` | MemberCalendar; absolute `member-calendar.php` URL |

Use the explicit current endpoints; the `/php_proxy.php` rewriting in some Graph helpers is legacy and inconsistent across helpers. Old `VITE_AAD_*`, `VITE_SITE_*` and `VITE_FOLDER_PATH` examples do not configure the active member-auth/public-content path. MSAL remains a package dependency but is not the implemented login flow.

## PHP runtime loading and precedence

`Config::getAllowedOrigins()` triggers private `Config::loadEnv()` once per request. Loading order:

1. Existing server environment (and, for built PHP, build-time fallback injection).
2. Root `.env.php`, if present; its keys overwrite existing values.
3. Root `.env.php.<ENVIRONMENT>`, if present; its keys overwrite earlier values. `ENVIRONMENT` is read after the base file and defaults to `development`.

The root is two directories above `php/core/Config.php`: repository root in development, `dist/` root after build. Files accept KEY=value lines or a PHP file returning an array. Compose requires KEY=value for `.env.php` because it also uses it as `env_file`. An `ENVIRONMENT=production` setting can be placed in the base runtime file; ensure overrides do not replace credentials unintentionally.

Only `.env.php` is ignored by the current `.gitignore`; `.env.php.development` and `.env.php.production` are tracked. Keep tracked overrides non-sensitive. Do not create secret-bearing files under other names without checking ignore rules. Runtime secrets must be inaccessible over HTTP, including KEY=value `.env.php` files which are **not executable PHP** despite their suffix.

### Graph application credentials

| Variable | Required | Meaning |
| --- | --- | --- |
| `CLIENT_ID` | Yes for Graph calls | Entra application/client ID |
| `TENANT_ID` | Yes for Graph calls | Entra tenant ID |
| `CLIENT_SECRET` | Yes for Graph calls | Server-only app secret |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated exact browser origins; defaults in Config include local ports and the sailing domain |
| `ENVIRONMENT` | Recommended | Select runtime override; default `development` |

`Auth.php` requests a **client-credentials application token** using `https://graph.microsoft.com/.default`, not delegated browser scopes. Ask the tenant administrator to grant/consent the application's required read access to the configured public drive and read/update/delete access to configured calendar lists as appropriate. Choose least-privilege application grants supported by the deployment (for example, site-scoped permissions with explicit site grants), rather than blindly granting tenant-wide write access. The repository does not provision or prove those grants. OIDC login permissions do not replace Graph application permissions.

### Member OIDC/session

| Variable | Required / default |
| --- | --- |
| `MEMBER_OIDC_CLIENT_ID` | Required; web/confidential-client app ID |
| `MEMBER_OIDC_TENANT_ID` | Required; tenant for discovery/token validation |
| `MEMBER_OIDC_CLIENT_SECRET` | Required server-only secret |
| `MEMBER_OIDC_REDIRECT_URI` | Required; exact web callback URL ending `auth.php?action=callback` |
| `MEMBER_SESSION_SECRET` | Required by the constructor; currently stored but not otherwise used in the implementation (not a session-signing guarantee) |
| `MEMBER_SESSION_NAME` | Optional, default `vstj_member_session` |
| `MEMBER_EMAILS` | Comma-separated allowed member identities |
| `MEMBER_ADMIN_EMAILS` | Comma-separated allowed admins; admin takes precedence |
| `MEMBER_ALLOWED_EMAIL` | Legacy fallback, required only if both role lists are empty |

The role lists are trimmed/lowercased. Email resolution checks ID-token `preferred_username`, then `email`, then `upn`. Configure test accounts matching actual claims. Entra registration must use the **Web** redirect URI, not the old SPA redirect example. Login requests `openid profile email` and validates state, nonce and the ID token using discovery/JWKS. Return targets are normalized by `MemberAuth.php` against allowed origins.

A redacted base file outline (replace placeholders privately; it is not a complete working credential set):

```dotenv
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
CLIENT_ID=<graph-app-id>
TENANT_ID=<tenant-id>
CLIENT_SECRET=<server-only-secret>
MEMBER_OIDC_CLIENT_ID=<oidc-app-id>
MEMBER_OIDC_TENANT_ID=<tenant-id>
MEMBER_OIDC_CLIENT_SECRET=<server-only-secret>
MEMBER_OIDC_REDIRECT_URI=http://localhost:5173/api/php/endpoints/auth.php?action=callback
MEMBER_SESSION_SECRET=<independent-random-server-secret>
MEMBER_EMAILS=member@example.invalid
MEMBER_ADMIN_EMAILS=admin@example.invalid
MEMBER_CALENDAR_SITE_HOST=<tenant>.sharepoint.com
MEMBER_CALENDAR_SITE_PATH=sites/<test-site>
MEMBER_CALENDAR_LIST_ID=<reservation-list-id>
CLUB_EVENTS_LIST_ID=<club-events-list-id>
```

## SharePoint public drive contract

Constants in `php/core/Config.php` (not the old frontend env variables) select public site `technikapraha.sharepoint.com`, path `sites/jachting`, and folders in its default document-library drive:

```text
verejne/
  fotky-verejne/
    YYYY/
      images/
        photo.jpg
  novinky-verejne/
    YYYY/
      Article title/
        article.md
        thumbnail.jpg      (optional; inspect News.php for supported names)
        images/            (optional article images)
```

Folder name is the news article title/key. `News.php` loads Markdown and rewrites image references through the gallery endpoint. Publish only intentionally public files in these trees. There is no arbitrary SharePoint path/list chooser in the browser.

## Calendar site and lists

| Variable | Meaning / fallback |
| --- | --- |
| `MEMBER_CALENDAR_SITE_HOST` | Required host; no protocol |
| `MEMBER_CALENDAR_SITE_PATH` | Required path, e.g. `sites/jachting` |
| `MEMBER_CALENDAR_LIST_ID` | Reservation list ID; preferred over title |
| `MEMBER_CALENDAR_LIST_TITLE` | Required if reservation ID is absent; exact displayName match |
| `CLUB_EVENTS_LIST_ID` | Club list ID; preferred over title |
| `CLUB_EVENTS_LIST_TITLE` | Fallback title, default `Klubove udalosti` |

Both sources share the configured calendar site. The implementation is two explicit sources, **not** a `MEMBER_CALENDAR_SOURCES` registry. ID resolution is preferable to title resolution; title enumeration does not follow list-discovery pagination.

Use SharePoint **internal field names**, which can differ from display labels. Ensure start/end fields contain parseable dates. Invalid/missing starts are skipped; missing/unparseable end falls back to start.

| Normalized value | Reservation variable / default | Club-event variable / default |
| --- | --- | --- |
| title | `MEMBER_CALENDAR_TITLE_FIELD` / `Title` | `CLUB_EVENTS_TITLE_FIELD` / `Title` |
| start | `MEMBER_CALENDAR_START_FIELD` / `Start` | `CLUB_EVENTS_START_FIELD` / `Start` |
| end | `MEMBER_CALENDAR_END_FIELD` / `End` | `CLUB_EVENTS_END_FIELD` / `End` |
| allDay | `MEMBER_CALENDAR_ALL_DAY_FIELD` / unset | `CLUB_EVENTS_ALL_DAY_FIELD` / unset |
| location | `MEMBER_CALENDAR_LOCATION_FIELD` / unset | `CLUB_EVENTS_LOCATION_FIELD` / unset |
| description | `MEMBER_CALENDAR_DESCRIPTION_FIELD` / unset | `CLUB_EVENTS_NOTE_FIELD` / `Poznamka` |
| state | `MEMBER_CALENDAR_STATE_FIELD` / `State` | none |

Reservation values normally include `Requested`, `Confirmed`, `Canceled`; legacy `Rejected` is also recognized for display/filtering. The website only writes `Confirmed` or `Canceled`, not `Requested`. Member visibility excludes canceled/rejected reservations; admins retain them. See [API](api.md) for capabilities and mutation IDs.
