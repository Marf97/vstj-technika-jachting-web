# API reference

[Documentation index](README.md) · Source of truth: `php/endpoints/*.php`, `src/lib/graph.ts`, `src/lib/auth.ts`.

Paths below are relative to the PHP host, without Vite's development-only `/api` prefix. Typical local browser URL: `http://localhost:5173/api/php/endpoints/news.php`. Production commonly uses `https://<host>/php/endpoints/news.php`; configure the four frontend URLs explicitly.

## Conventions

- Public reads need no member session. Auth/calendar requests use `credentials: "include"` for the PHP session cookie.
- Most JSON responses have `success` and action-specific **top-level** keys, not a universal `data` wrapper. Check both HTTP status and `success`.
- Calendar/auth support credentialed CORS only for configured exact origins. CORS is not authorization or CSRF protection.
- Public JSON/image responses may return 304 with no body. Browser normal fetch caching handles revalidation; custom clients must handle it.
- `OPTIONS` preflight exits before normal handling. Do not infer a supported POST operation from broad advertised CORS method headers.
- Examples below are synthetic contract illustrations, not captured production responses.

## Public news — `/php/endpoints/news.php`

| GET query | Result on success |
| --- | --- |
| `action=list_news_years` | `{success:true, years:["2026"]}` |
| `action=list_articles&year=2026` | `{success:true, articles:[...]}`; year optional |
| `action=article&year=2026&title=Example` | `{success:true, ...articleFields}`; year/title required |
| `action=get_article_excerpt&year=2026&title=Example` | Deprecated: `{excerpt:...}` without standard success key |
| `action=debug_news` | Existing public diagnostic action; do not use as a normal UI contract |

Default action is `list_articles`. List entries include id, title, year, createdDateTime, lastModifiedDateTime and optional thumbnail/excerpt. Article detail includes content and metadata; consult `News::getArticle()` for the current shape. Unknown action or missing article parameters: 400; absent article: 404; caught upstream/configuration error: 500 with `{success:false,error:...}`. Avoid sharing raw errors publicly.

Read-only local example (requires configured test backend):

```sh
curl 'http://localhost:5173/api/php/endpoints/news.php?action=list_articles&year=2026'
```

## Public gallery — `/php/endpoints/gallery.php`

| GET query | Result on success |
| --- | --- |
| `action=list_gallery_years` | `{success:true, years:[...]}` |
| `action=gallery&year=2026&top=20&skip=0` | `{success:true, images:[...], total:..., hasMore:..., year:...}` |
| `id=<drive-item-id>&size=fullhd` | Image bytes and MIME Content-Type; **omit action** |

Year is optional; top defaults to 20 and skip to 0. The current gallery dispatch falls back to listing for unrecognized actions. Image helpers use `large` or `fullhd` sizes. Image IDs refer to SharePoint drive items, not calendar items. Image errors currently return 500 with an `error` key (not necessarily `success:false`). Public lists are not guaranteed to enumerate every Graph page; see [limitations](operations.md#security-and-correctness-limitations).

## Member auth — `/php/endpoints/auth.php`

| Query action | Behavior |
| --- | --- |
| `session` (default) | `{success:true, session:{authenticated,memberEmail,displayName,role,capabilities}}` |
| `login&returnTo=<encoded-url>` | Top-level navigation, redirects to Entra; not an AJAX token request |
| `callback&code=...&state=...` | Entra callback; validates OIDC and redirects back |
| `logout&returnTo=<encoded-url>` | Clears local PHP session and redirects; not a guarantee of global Entra logout |

Anonymous session has authenticated=false, null identity/role, empty capabilities. Unknown action returns 400. A caught session error can return HTTP **200** with `success:false`; callback errors redirect with `authError` in the return URL. Never record callback authorization codes or cookies in docs/log attachments.

### Roles and capabilities

| Capability | member | admin | Enforcement/use |
| --- | --- | --- | --- |
| `calendar:view` | Yes | Yes | UI capability; endpoint GET requires authenticated member |
| `reservation:create` | Yes | Yes | External form button, not an API create operation |
| `reservation:approve` | No | Yes | Required by reservation `update_state` |
| `reservation:cancel` | No | Yes | UI cancel action and canceled-event visibility; update endpoint itself checks `reservation:approve` |
| `club_event:create` | No | Yes | External form button |
| `club_event:delete` | No | Yes | Required by club-event deletion endpoint |

Both roles are resolved in `MemberAuth.php`. UI controls are not a substitute for server capability checks. Existing stored-session capability behavior has a revocation caveat documented in Operations.

## Member calendar — `/php/endpoints/member-calendar.php`

### Read

`GET ?start=<ISO-date-time>&end=<ISO-date-time>` requires a valid member session, end after start and a range no larger than 120 whole days (current implementation uses DateInterval days). Prefer explicit timezones. Returns:

```json
{
  "success": true,
  "member": {"authenticated": true, "role": "member", "capabilities": ["calendar:view", "reservation:create"]},
  "events": [
    {
      "id": "boat_reservation:123",
      "title": "Example boat",
      "start": "2026-06-10T08:00:00+02:00",
      "end": "2026-06-10T18:00:00+02:00",
      "allDay": false,
      "extendedProps": {
        "itemId": "123",
        "source": "boat_reservation",
        "sourceLabel": "Rezervace lodi",
        "state": "Requested",
        "location": null,
        "description": null
      }
    }
  ],
  "warnings": [],
  "range": {"start": "2026-06-01T00:00:00+02:00", "end": "2026-07-01T00:00:00+02:00"}
}
```

The example omits optional member identity/color fields. Display IDs are `boat_reservation:<itemId>` or `club_event:<itemId>`. The underlying raw SharePoint ID is in `extendedProps.itemId`. Results are combined and sorted. Reservation loading failure fails the request; club-list failure yields reservation events plus warnings. The current browser helper returns only `events`, so warnings need inspection in the network response. Basic members do not receive canceled/rejected reservations.

### Mutations

Send `POST` JSON with Content-Type `application/json` and session credentials. The **action belongs in the JSON body**, not query string. Never use prefixed display IDs or browser-chosen SharePoint list IDs.

Reservation state change (requires `reservation:approve`; Graph PATCH of reservation item fields):

```json
{"action":"update_state","id":"123","state":"Confirmed"}
```

Only `Confirmed` and `Canceled` are accepted. Success: `{success:true,member:...,id:"123",state:"Confirmed"}`. No reset-to-Requested API exists.

Club-event hard deletion (requires `club_event:delete`; Graph DELETE of configured club-list item):

```json
{"action":"delete_club_event","id":"456"}
```

Success: `{success:true,member:...,id:"456"}`. This is destructive; use disposable items in a test site and read back the exact target to verify deletion. Reservations are canceled via state, not hard-deleted by this API.

Calendar errors use `{success:false,error:...}`: 401 unauthenticated, 403 denied capability, 400 recognized validation/action/method errors, otherwise 500. Malformed JSON and missing body fields are rejected. Neither event creation nor generic event deletion is implemented; existing historical proposal files do not define current API behavior.
