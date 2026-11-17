# Operations and known limitations

[Documentation index](README.md)

## Publishing content

| Content | Authoritative location | Release needed? |
| --- | --- | --- |
| About/contact | `public/onas.md`, `public/vedeni.md` | Yes |
| Boats | `public/boats-chilli.md`, `public/boats-cuba.md`, local images | Yes |
| Price list/rental rules/payment QR | `src/content/member/` | Yes; assets are bundled and not confidential |
| Public photos | SharePoint default drive: `verejne/fotky-verejne/YYYY/images` | Normally no; caches delay visibility |
| Public articles | `verejne/novinky-verejne/YYYY/Article title/article.md`, optional thumbnail/images | Normally no; caches delay visibility |
| Reservations/club events | Configured SharePoint lists | Normally no; website only supports documented read/state/delete operations |

Use [Configuration](configuration.md) for fields and paths. The website is not a CMS editor. External creation links live in `MemberArea.jsx`; any form-to-list automation is managed outside this repository. Check it separately before promising end-to-end creation behavior.

For local content, preserve Czech accents, accessible headings/image text and working image paths. For SharePoint content, publish only material intended for public download. Verify the article list, article detail, gallery and image rendering after cache expiry. Duplicate similarly named files in `src/assets/` are not necessarily used; follow the importing component.

## Troubleshooting by symptom

| Symptom | Check first |
| --- | --- |
| `Unexpected token <` / HTML instead of JSON | Exact URL, PHP execution, SPA fallback order; preview/static-only servers cannot execute APIs |
| Blank remote sections | Network request status/body; required Graph credentials, consent/site grants, public folder layout; distinguish empty data from errors |
| `Invalid URL` in member area | Absolute `VITE_AUTH_PROXY_URL` and `VITE_MEMBER_CALENDAR_URL`; restart Vite/rebuild |
| Login redirect mismatch | Exact Web callback URI, including scheme/host/port/path/query; local proxy URL vs backend URL |
| Login loop / lost session | Same hostname/scheme, browser cookie, PHP session storage, HTTPS forwarding, allowed return origin; reload to clear browser module cache |
| Authenticated but no membership | ID-token identity claim matches configured email role lists; check role precedence without copying tokens |
| Calendar 401 / 403 | Cookie included / required capability respectively; hiding a button does not authorize calls |
| Empty/partial calendar | Internal field names, parseable dates, list IDs/site grants, response warnings, range and canceled visibility |
| Club events missing only | Inspect `warnings`; club-source failure is partial success and frontend helper drops warnings |
| Newly published content stale | Browser/component, PHP and HTTP caches; see Architecture cache durations |
| Deep-link reload 404 | Rewrite configuration/AllowOverride and existing endpoint exclusions; `public/.htaccess` only works on configured Apache |
| Compose endpoints 404 | Compose mounts `/php/...`; standalone Dockerfile layout differs and does not build the frontend |
| PHP Graph calls fail | HTTPS streams/CA trust, OpenSSL, cURL (news batching), network and tenant grants; inspect server logs privately |

Do not attach raw env files, callback URLs with codes, cookies, access tokens, generated PHP or member list records to public issues. Sanitized error messages and endpoint paths are usually enough to begin diagnosis.

## Security and correctness limitations

These are **source-level limitations**, not evidence of production exploitation and not fixed by this documentation PR. Reverify against current source before changing behavior.

1. **Build environment embedded in PHP.** `vite.config.js` reads `.env.php`, `.env.php.production` and all nonempty build process environment values, then embeds them in every emitted PHP file. Builds must be isolated/minimal; treat artifacts as sensitive. See [Deployment](../DEPLOYMENT_README.md#build-environment-warning).
2. **Public item-ID downloads need a stronger boundary.** Gallery binary requests accept a drive-item ID; current code does not enforce public-folder ancestry or a MIME allowlist before download. Exposure depends on app grants and obtainable IDs. Do not assume folder-based listings alone protect the rest of the drive.
3. **Session revocation/demotion is not immediate.** `MemberAuth::getSessionState()` can fall back to a stored role and stored capabilities after allowlist changes. Do not rely on an allowlist edit as an emergency revocation guarantee; plan server-side session invalidation with the operator and verify denial. `auth.ts` also has a nonexpiring module cache and refresh may reuse it.
4. **Calendar mutations lack an explicit CSRF token/origin-rejection check.** HttpOnly/SameSite/CORS and capability checks help but are not a complete CSRF design. Do not treat CORS as request authorization.
5. **Range reads can miss spanning events.** Graph's range query filters by start time; an event starting before the requested range but overlapping it may be absent on the filtered path. The fallback fetch-all path has different coverage.
6. **Public enumeration is not complete pagination.** News/gallery do not consistently follow Graph next links, unlike calendar item loading. Large folders can yield incomplete totals/results. List-title discovery also only checks its returned page.
7. **Caching and concurrent fetch edge cases remain.** Image caching JSON-encodes binary data; gallery year/cache pagination and public selection fetch races need focused regression coverage before refactoring. Cache TTLs are layered, not a single freshness guarantee.
8. **Member Markdown is public build material.** Session-gating the page does not make price-list/rules/QR files secret.
9. **Verification gaps.** No tracked application test suite or CI workflow; JS-only lint and a build without `tsc` do not validate all TS/PHP paths, Graph permissions or production hosting.

Do not broaden this documentation change into unreviewed security fixes. Scope hardening work separately with regression tests, tenant permission review and explicit rollout/revocation procedures.

## Operational ownership checklist

The maintainer/deployment operator must supply the actual production hosting layout, runtime secret store, Entra app ownership/consent, certificate/CA setup, SharePoint grants/internal schemas, PHP session storage, external form/automation ownership and rollback procedure. The repository alone does not establish these facts. Record non-secret confirmed decisions in the relevant handbook page when they change; do not replace uncertainty with invented infrastructure.
