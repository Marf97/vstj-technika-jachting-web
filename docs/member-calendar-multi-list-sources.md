# Member Calendar Multi-List Source Plan

## Goal

Refactor the member calendar backend so it can fetch events from multiple SharePoint lists, not only the current boat reservation list.

The calendar should eventually support any number of configured event sources, for example:

- Boat reservations
- Club events
- Training sessions
- Regattas
- Maintenance or brigades
- Private member-only announcements

Each source may be backed by a different SharePoint list and may use different field names.

## Current State

The member calendar endpoint is implemented in:

```text
php/endpoints/member-calendar.php
```

It currently assumes a single calendar list, configured by:

```text
MEMBER_CALENDAR_LIST_ID
```

or resolved by:

```text
MEMBER_CALENDAR_LIST_TITLE
```

The endpoint already contains useful reusable pieces:

- Resolve SharePoint site ID.
- Resolve SharePoint list ID.
- Fetch list items in a date range.
- Fall back to fetching all list items if Graph filtering fails.
- Normalize SharePoint fields into FullCalendar event objects.

However, those functions are currently endpoint-local and tied to one global field map.

## Problem

The current implementation is difficult to extend because:

- Only one list can be configured.
- Field names are global, so every list must use the same field names.
- Events do not include source/type metadata.
- Fetching, normalization, configuration, and HTTP response logic all live in one endpoint file.
- Future delete/update actions will need to know which source list an event came from.

## Target Design

Introduce a calendar source abstraction.

Each source should describe:

- Stable source key
- Human-readable label
- SharePoint site, if different from default
- SharePoint list ID or title
- Field mapping
- Display metadata, such as color or type
- Optional authorization policy

Conceptual example:

```php
[
    [
        'key' => 'boat_reservation',
        'label' => 'Rezervace lodí',
        'listId' => getenv('MEMBER_CALENDAR_BOAT_LIST_ID'),
        'fields' => [
            'title' => 'Title',
            'start' => 'Start',
            'end' => 'End',
            'allDay' => null,
            'location' => null,
            'description' => 'Description',
        ],
        'color' => '#1976d2',
    ],
    [
        'key' => 'club_event',
        'label' => 'Klubové akce',
        'listId' => getenv('MEMBER_CALENDAR_EVENTS_LIST_ID'),
        'fields' => [
            'title' => 'Title',
            'start' => 'EventDate',
            'end' => 'EndDate',
            'allDay' => 'AllDay',
            'location' => 'Location',
            'description' => 'Description',
        ],
        'color' => '#2e7d32',
    ],
]
```

The frontend should still receive a single `events` array, but each event should include source metadata.

Example normalized event:

```json
{
  "id": "123",
  "title": "Laser Bahia",
  "start": "2026-06-10T08:00:00+02:00",
  "end": "2026-06-10T18:00:00+02:00",
  "allDay": false,
  "backgroundColor": "#1976d2",
  "borderColor": "#1976d2",
  "extendedProps": {
    "source": "boat_reservation",
    "sourceLabel": "Rezervace lodí",
    "location": null,
    "description": "..."
  }
}
```

## Recommended Backend Structure

Move calendar logic out of the endpoint into a dedicated module:

```text
php/modules/MemberCalendar.php
```

The endpoint should remain responsible for:

- CORS headers
- Request method handling
- Member authentication
- Query parameter validation
- JSON response formatting

The module should be responsible for:

- Loading configured sources
- Resolving site/list IDs
- Fetching list items
- Normalizing events
- Sorting combined events
- Returning warnings for partially failed sources

Recommended class shape:

```php
class MemberCalendar
{
    public function __construct(GraphAPI $graphApi) {}

    public function getEvents(DateTimeImmutable $start, DateTimeImmutable $end): array {}

    private function getSources(): array {}

    private function fetchSourceItems(array $source, DateTimeImmutable $start, DateTimeImmutable $end): array {}

    private function normalizeSourceItems(array $source, array $items, DateTimeImmutable $start, DateTimeImmutable $end): array {}
}
```

## Configuration Strategy

For the first iteration, prefer explicit environment variables over a complex config parser.

Example:

```text
MEMBER_CALENDAR_SOURCES=boat_reservation,club_event

MEMBER_CALENDAR_BOAT_RESERVATION_LABEL=Rezervace lodí
MEMBER_CALENDAR_BOAT_RESERVATION_LIST_ID=...
MEMBER_CALENDAR_BOAT_RESERVATION_TITLE_FIELD=Title
MEMBER_CALENDAR_BOAT_RESERVATION_START_FIELD=Start
MEMBER_CALENDAR_BOAT_RESERVATION_END_FIELD=End

MEMBER_CALENDAR_CLUB_EVENT_LABEL=Klubové akce
MEMBER_CALENDAR_CLUB_EVENT_LIST_ID=...
MEMBER_CALENDAR_CLUB_EVENT_TITLE_FIELD=Title
MEMBER_CALENDAR_CLUB_EVENT_START_FIELD=EventDate
MEMBER_CALENDAR_CLUB_EVENT_END_FIELD=EndDate
```

The existing single-list variables can remain as backwards-compatible defaults:

```text
MEMBER_CALENDAR_LIST_ID
MEMBER_CALENDAR_LIST_TITLE
MEMBER_CALENDAR_TITLE_FIELD
MEMBER_CALENDAR_START_FIELD
MEMBER_CALENDAR_END_FIELD
```

If no `MEMBER_CALENDAR_SOURCES` value is configured, the module should behave like today and load one default source.

## Error Handling

Multi-source fetching should be resilient.

If one source fails but others succeed, the endpoint should return successful events plus a warning list.

Example response:

```json
{
  "success": true,
  "events": [],
  "warnings": [
    {
      "source": "club_event",
      "message": "Unable to load source."
    }
  ]
}
```

If all sources fail, the endpoint should return an error.

## Security Rules

The browser must never be allowed to provide arbitrary SharePoint list IDs.

The backend may accept source keys, but only if they map to server-side configured sources.

Safe:

```json
{
  "source": "boat_reservation"
}
```

Unsafe:

```json
{
  "listId": "user-controlled-list-id"
}
```

This matters for future delete/update functionality.

## Frontend Considerations

The first backend refactor can preserve the current frontend contract:

```js
events: [...]
```

Later frontend enhancements can use `extendedProps.source` and `extendedProps.sourceLabel` to add:

- Filters by event type
- Color legend
- Source label in event detail
- Different labels for actions like delete/cancel
- Different permissions per event type

## Implementation Tasks

1. Create `php/modules/MemberCalendar.php`.
2. Move reusable functions from `member-calendar.php` into the module.
3. Add source configuration loading.
4. Preserve current single-list behavior as the default.
5. Add support for multiple configured sources.
6. Add source metadata to normalized events.
7. Update `member-calendar.php` to call the module.
8. Ensure range validation remains in the endpoint or a shared helper.
9. Add partial failure warnings.
10. Manually verify current boat reservation calendar still loads.

## Acceptance Criteria

- Current single-list calendar behavior remains unchanged when no multi-source config is present.
- Multiple sources can be configured without code changes.
- Different sources can use different field names.
- Returned events include source metadata.
- Events from all sources are merged and sorted by start date.
- Failure in one source does not hide events from other working sources.
- Future delete/update operations can identify the correct source list from event metadata.

## Open Questions

- Should all event sources live in the same SharePoint site, or should each source support its own site host/path?
- Do we want colors configured in PHP, frontend theme, or both?
- Should some sources be visible only to admins?
- Should some event types be read-only while others support delete/edit?
- Should cancelled events be filtered out, hidden, or shown with a distinct style?
