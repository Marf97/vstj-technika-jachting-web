# Member Calendar Event Deletion Plan

## Goal

Add a delete action for member calendar events. When a member opens the detail dialog for a calendar event, the dialog should include a button for deleting that event.

The intended user flow:

1. Member opens the member section.
2. Member clicks an event in the calendar.
3. Event detail dialog opens.
4. Dialog shows event details and a delete action.
5. Member clicks the delete button.
6. UI asks for confirmation before deleting.
7. If confirmed, the app deletes the backing SharePoint list item through Microsoft Graph.
8. Calendar refreshes and the deleted event disappears.

## Current State

Calendar events are loaded from SharePoint list items through `php/endpoints/member-calendar.php`.

The endpoint already exposes the SharePoint list item ID as the FullCalendar event ID:

```php
'id' => (string) ($item['id'] ?? uniqid('member-calendar-', true)),
```

On the frontend, this ID is available as:

```js
clickInfo.event.id
```

The current event detail dialog stores title, start, end, description, and location, but does not yet store or display the event ID.

## Product Behavior

The delete button should appear inside the event detail dialog, not directly on the calendar grid. This keeps the destructive action behind an intentional click.

Recommended button label:

```text
Smazat rezervaci
```

If the calendar later contains multiple event types, the label should adapt to the source:

```text
Smazat rezervaci
Smazat událost
```

The delete action must require confirmation. The confirmation copy should include the event title and date so the member understands exactly what will be deleted.

Example confirmation text:

```text
Opravdu chcete smazat rezervaci "Laser Bahia"?
Tuto akci nelze vrátit zpět.
```

## Backend Design

Deletion should be handled by the PHP backend, not directly from the browser. The frontend should never call Microsoft Graph directly for this operation.

Recommended endpoint shape:

```http
POST /php/endpoints/member-calendar.php?action=delete
Content-Type: application/json

{
  "id": "123",
  "source": "boat_reservation"
}
```

For the current single-list implementation, `source` can be omitted. Once multiple calendar sources exist, `source` should identify which configured SharePoint list the item belongs to.

The backend should:

1. Require member authentication with `MemberAuth::requireMember()`.
2. Validate the event/list item ID.
3. Resolve the configured SharePoint site.
4. Resolve the correct SharePoint list.
5. Optionally verify the item exists before deleting.
6. Delete the item through Microsoft Graph.
7. Return a standard JSON response.

Successful response:

```json
{
  "success": true
}
```

Failure response:

```json
{
  "success": false,
  "error": "Unable to delete calendar event."
}
```

## Microsoft Graph Operation

Because the calendar is backed by SharePoint lists, deleting an event means deleting a SharePoint list item.

Graph endpoint:

```http
DELETE https://graph.microsoft.com/v1.0/sites/{siteId}/lists/{listId}/items/{itemId}
```

Microsoft Graph normally returns `204 No Content` for a successful delete.

The current `GraphAPI::callAPI()` helper only supports `GET`. We should add a small generic request method or a dedicated delete method.

Example direction:

```php
public function deleteAPI(string $url): void
{
    // Send DELETE with the existing app access token.
    // Treat HTTP 204 as success.
}
```

## Authorization Concerns

This is the most important open question.

If we expose deletion to all authenticated members, any member may be able to delete any reservation. That may or may not be acceptable.

Before implementation, decide one of these policies:

1. Any authenticated member can delete any reservation.
2. Only selected admin members can delete reservations.
3. Members can delete only reservations they created.
4. Members cannot delete directly; they must request cancellation through a form/workflow.

Recommended senior-engineering default:

Start with admin-only deletion unless the SharePoint list reliably stores the reservation owner in a field that can be matched to the logged-in member email.

If owner-based deletion is desired, the SharePoint list should expose a stable owner field, for example:

```text
CreatedByEmail
ReservedByEmail
MemberEmail
```

The backend should compare that field against `MemberAuth::requireMember()['memberEmail']`.

## Frontend Tasks

1. Store the event ID in `selectedEvent` inside `MemberCalendar.jsx`.
2. Add a delete button to the event detail dialog.
3. Add a confirmation dialog before deleting.
4. Add loading state while deletion is in progress.
5. Disable delete controls while the request is active.
6. Show success/error feedback.
7. Refresh the calendar after successful deletion.

## Backend Tasks

1. Add request-method handling to `member-calendar.php`, or route by `action=delete`.
2. Add a Graph delete helper in `php/core/GraphAPI.php`.
3. Validate the incoming item ID.
4. Resolve the correct list ID.
5. Apply the chosen authorization policy.
6. Call the Graph DELETE endpoint.
7. Return consistent JSON errors without exposing stack traces.

## Multi-List Future

The current calendar implementation is single-list oriented. Since future event types may come from separate SharePoint lists, deletion should be designed with source awareness from the beginning.

Each normalized event should eventually include metadata like:

```php
'extendedProps' => [
    'source' => 'boat_reservation',
    'sourceLabel' => 'Rezervace lodí',
]
```

Then deletion can target the right SharePoint list:

```json
{
  "id": "123",
  "source": "boat_reservation"
}
```

The backend must not trust arbitrary list IDs from the browser. It should accept only a known source key and map it to a server-side configured list ID.

## Acceptance Criteria

- Event detail dialog shows a delete button for users allowed to delete the event.
- Clicking delete opens a confirmation dialog.
- Confirming deletion removes the SharePoint list item through the backend.
- Calendar refreshes after successful deletion.
- Failed deletion shows a clear error and keeps the dialog usable.
- Unauthorized users cannot delete events by manually calling the endpoint.
- The frontend never sends raw SharePoint list IDs chosen by the browser.

## Open Questions

- Who is allowed to delete reservations?
- Does the SharePoint list store the member email or creator email reliably?
- Should deletion be hard delete, or should items be marked cancelled instead?
- Should deleted/cancelled reservations remain visible to admins?
- How should this behave once multiple event sources are shown in the same calendar?
