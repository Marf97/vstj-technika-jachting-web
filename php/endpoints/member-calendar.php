<?php

require_once __DIR__ . '/../core/Config.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/GraphAPI.php';
require_once __DIR__ . '/../core/MemberAuth.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    throw new ErrorException($message, 0, $severity, $file, $line);
});

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, Config::getAllowedOrigins(), true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getCalendarEnv(string $name): ?string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return null;
    }

    return $value;
}

function requireCalendarSetting(string $name): string
{
    $value = getCalendarEnv($name);
    if ($value === null) {
        throw new Exception('Missing required calendar configuration: ' . $name);
    }

    return $value;
}

function resolveCalendarSiteId(GraphAPI $graphApi, string $host, string $path): string
{
    $cacheFile = sys_get_temp_dir() . '/member_calendar_site_' . md5($host . ':' . $path) . '.json';
    if (file_exists($cacheFile)) {
        $cached = json_decode(@file_get_contents($cacheFile), true);
        if (is_array($cached) && !empty($cached['siteId']) && !empty($cached['expires']) && time() < intval($cached['expires'])) {
            return $cached['siteId'];
        }
    }

    $site = $graphApi->callAPI("https://graph.microsoft.com/v1.0/sites/{$host}:/{$path}");
    $siteId = $site['id'] ?? null;
    if (!$siteId) {
        throw new Exception('Unable to resolve the member calendar SharePoint site.');
    }

    @file_put_contents($cacheFile, json_encode([
        'siteId' => $siteId,
        'expires' => time() + Config::SITE_ID_CACHE_TIME,
    ]));
    @chmod($cacheFile, 0600);

    return $siteId;
}

function resolveConfiguredListId(GraphAPI $graphApi, string $siteId, ?string $listId, ?string $listTitle, string $errorMessage): string
{
    if ($listId !== null) {
        return $listId;
    }

    if ($listTitle === null) {
        throw new Exception($errorMessage);
    }

    $response = $graphApi->callAPI("https://graph.microsoft.com/v1.0/sites/{$siteId}/lists?\$select=id,displayName");
    $lists = $response['value'] ?? [];

    foreach ($lists as $list) {
        if (($list['displayName'] ?? '') === $listTitle) {
            return $list['id'];
        }
    }

    throw new Exception($errorMessage);
}

function resolveCalendarListId(GraphAPI $graphApi, string $siteId): string
{
    return resolveConfiguredListId(
        $graphApi,
        $siteId,
        getCalendarEnv('MEMBER_CALENDAR_LIST_ID'),
        getCalendarEnv('MEMBER_CALENDAR_LIST_TITLE'),
        'Unable to find the configured member calendar list.'
    );
}

function resolveClubEventsListId(GraphAPI $graphApi, string $siteId): string
{
    return resolveConfiguredListId(
        $graphApi,
        $siteId,
        getCalendarEnv('CLUB_EVENTS_LIST_ID'),
        getCalendarEnv('CLUB_EVENTS_LIST_TITLE') ?? 'Klubove udalosti',
        'Unable to find the configured club events list.'
    );
}

function requireDateParam(string $name): string
{
    $value = $_GET[$name] ?? null;
    if (!is_string($value) || trim($value) === '') {
        throw new Exception("Missing required query parameter: {$name}");
    }

    return trim($value);
}

function parseDateParam(string $value, string $name): DateTimeImmutable
{
    try {
        return new DateTimeImmutable($value);
    } catch (Exception $e) {
        throw new Exception("Invalid date parameter: {$name}");
    }
}

function getRequiredFieldName(string $envName, string $defaultValue): string
{
    return getCalendarEnv($envName) ?? $defaultValue;
}

function getOptionalFieldName(string $envName): ?string
{
    return getCalendarEnv($envName);
}

function getStateFieldName(): string
{
    return getRequiredFieldName('MEMBER_CALENDAR_STATE_FIELD', 'State');
}

function formatGraphDateTime(DateTimeImmutable $dateTime): string
{
    return $dateTime->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z');
}

function normalizeFieldValue($value): ?string
{
    if ($value === null) {
        return null;
    }

    if (is_string($value) || is_numeric($value) || is_bool($value)) {
        $normalized = trim((string) $value);
        if ($normalized !== '' && ($normalized[0] === '[' || $normalized[0] === '{')) {
            $decoded = json_decode($normalized, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return normalizeFieldValue($decoded);
            }
        }
        return $normalized === '' ? null : $normalized;
    }

    if (is_array($value)) {
        $parts = [];

        foreach ($value as $entry) {
            if (is_string($entry) || is_numeric($entry)) {
                $parts[] = trim((string) $entry);
                continue;
            }

            if (is_array($entry)) {
                foreach (['lookupValue', 'Label', 'value', 'email', 'displayName'] as $key) {
                    if (!empty($entry[$key])) {
                        $parts[] = trim((string) $entry[$key]);
                        break;
                    }
                }
            }
        }

        $parts = array_values(array_filter($parts, fn ($part) => $part !== ''));
        if (!empty($parts)) {
            return implode(', ', $parts);
        }

        $json = json_encode($value);
        return $json === false ? null : $json;
    }

    $normalized = trim((string) $value);
    return $normalized === '' ? null : $normalized;
}

function normalizeBooleanValue($value): bool
{
    if ($value === null) {
        return false;
    }

    if (is_bool($value)) {
        return $value;
    }

    if (is_numeric($value)) {
        return intval($value) === 1;
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        return in_array($normalized, ['1', 'true', 'yes'], true);
    }

    return false;
}

function getItemField(array $fields, ?string $fieldName)
{
    if ($fieldName === null || $fieldName === '') {
        return null;
    }

    return $fields[$fieldName] ?? null;
}

function fetchAllCalendarItems(GraphAPI $graphApi, string $siteId, string $listId): array
{
    $items = [];
    $url = "https://graph.microsoft.com/v1.0/sites/{$siteId}/lists/{$listId}/items?\$expand=fields&\$top=200";

    while ($url) {
        $response = $graphApi->callAPI($url);
        $items = array_merge($items, $response['value'] ?? []);
        $url = $response['@odata.nextLink'] ?? null;
    }

    return $items;
}

function fetchCalendarItemsInRange(GraphAPI $graphApi, string $siteId, string $listId, DateTimeImmutable $rangeStart, DateTimeImmutable $rangeEnd, string $startField): array
{
    $items = [];
    $url = "https://graph.microsoft.com/v1.0/sites/{$siteId}/lists/{$listId}/items?" . http_build_query([
        '$expand' => 'fields',
        '$top' => 200,
        '$filter' => "fields/{$startField} ge '" . formatGraphDateTime($rangeStart) . "' and fields/{$startField} lt '" . formatGraphDateTime($rangeEnd) . "'",
    ]);

    while ($url) {
        $response = $graphApi->callAPI($url);
        $items = array_merge($items, $response['value'] ?? []);
        $url = $response['@odata.nextLink'] ?? null;
    }

    return $items;
}

function loadCalendarItems(GraphAPI $graphApi, string $siteId, string $listId, DateTimeImmutable $rangeStart, DateTimeImmutable $rangeEnd, string $startField): array
{
    try {
        return fetchCalendarItemsInRange($graphApi, $siteId, $listId, $rangeStart, $rangeEnd, $startField);
    } catch (Exception $e) {
        return fetchAllCalendarItems($graphApi, $siteId, $listId);
    }
}

function tryParseDateValue($value): ?DateTimeImmutable
{
    if ($value === null || $value === '') {
        return null;
    }

    try {
        return new DateTimeImmutable((string) $value);
    } catch (Exception $e) {
        return null;
    }
}

function memberHasCapability(array $member, string $capability): bool
{
    $capabilities = $member['capabilities'] ?? [];
    return is_array($capabilities) && in_array($capability, $capabilities, true);
}

function getCalendarEventColors(string $state): array
{
    return match ($state) {
        'Requested' => [
            'backgroundColor' => '#757575',
            'borderColor' => '#757575',
            'textColor' => '#ffffff',
        ],
        'Confirmed' => [
            'backgroundColor' => '#2e7d32',
            'borderColor' => '#2e7d32',
            'textColor' => '#ffffff',
        ],
        'Canceled', 'Rejected' => [
            'backgroundColor' => '#c62828',
            'borderColor' => '#c62828',
            'textColor' => '#ffffff',
        ],
        default => [],
    };
}

function normalizeCalendarItems(array $items, array $fieldMap, DateTimeImmutable $rangeStart, DateTimeImmutable $rangeEnd, bool $includeCanceled, array $source): array
{
    $events = [];
    $sourceKey = $source['key'] ?? 'boat_reservation';
    $sourceLabel = $source['label'] ?? 'Rezervace';
    $sourceColors = $source['colors'] ?? null;

    foreach ($items as $item) {
        $fields = $item['fields'] ?? [];
        $state = normalizeFieldValue(getItemField($fields, $fieldMap['state'])) ?? 'Requested';

        if (!$includeCanceled && in_array($state, ['Canceled', 'Rejected'], true)) {
            continue;
        }

        $startDate = tryParseDateValue(getItemField($fields, $fieldMap['start']));
        $endDate = tryParseDateValue(getItemField($fields, $fieldMap['end'])) ?? $startDate;

        if ($startDate === null) {
            continue;
        }

        if ($endDate === null) {
            $endDate = $startDate;
        }

        if ($startDate >= $rangeEnd || $endDate < $rangeStart) {
            continue;
        }

        $title = normalizeFieldValue(getItemField($fields, $fieldMap['title']));
        if ($title === null) {
            $title = normalizeFieldValue($fields['Title'] ?? null) ?: 'Bez nazvu';
        }

        $itemId = (string) ($item['id'] ?? uniqid('member-calendar-', true));
        $event = [
            'id' => $sourceKey . ':' . $itemId,
            'title' => $title,
            'start' => $startDate->format(DateTimeInterface::ATOM),
            'end' => $endDate->format(DateTimeInterface::ATOM),
            'allDay' => normalizeBooleanValue(getItemField($fields, $fieldMap['allDay'])),
            'extendedProps' => [
                'itemId' => $itemId,
                'source' => $sourceKey,
                'sourceLabel' => $sourceLabel,
                'state' => $state,
                'location' => normalizeFieldValue(getItemField($fields, $fieldMap['location'])),
                'description' => normalizeFieldValue(getItemField($fields, $fieldMap['description'])),
            ],
        ];

        $events[] = array_merge($event, $sourceColors ?? getCalendarEventColors($state));
    }

    usort($events, function ($left, $right) {
        return strcmp($left['start'], $right['start']);
    });

    return $events;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        throw new Exception('Missing request body.');
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        throw new Exception('Invalid JSON request body.');
    }

    return $decoded;
}

function requireBodyString(array $body, string $name): string
{
    $value = $body[$name] ?? null;
    if (!is_string($value) || trim($value) === '') {
        throw new Exception("Missing required body field: {$name}");
    }

    return trim($value);
}

function updateCalendarItemState(GraphAPI $graphApi, string $siteId, string $listId, string $itemId, string $stateField, string $state): void
{
    $url = "https://graph.microsoft.com/v1.0/sites/{$siteId}/lists/{$listId}/items/" . rawurlencode($itemId) . '/fields';
    $graphApi->requestJson('PATCH', $url, [
        $stateField => $state,
    ]);
}

function deleteCalendarItem(GraphAPI $graphApi, string $siteId, string $listId, string $itemId): void
{
    $url = "https://graph.microsoft.com/v1.0/sites/{$siteId}/lists/{$listId}/items/" . rawurlencode($itemId);
    $graphApi->requestJson('DELETE', $url);
}

try {
    Config::getAllowedOrigins();

    $memberAuth = new MemberAuth();
    $member = $memberAuth->requireMember();

    $host = requireCalendarSetting('MEMBER_CALENDAR_SITE_HOST');
    $path = requireCalendarSetting('MEMBER_CALENDAR_SITE_PATH');

    $fieldMap = [
        'title' => getRequiredFieldName('MEMBER_CALENDAR_TITLE_FIELD', 'Title'),
        'start' => getRequiredFieldName('MEMBER_CALENDAR_START_FIELD', 'Start'),
        'end' => getRequiredFieldName('MEMBER_CALENDAR_END_FIELD', 'End'),
        'allDay' => getOptionalFieldName('MEMBER_CALENDAR_ALL_DAY_FIELD'),
        'location' => getOptionalFieldName('MEMBER_CALENDAR_LOCATION_FIELD'),
        'description' => getOptionalFieldName('MEMBER_CALENDAR_DESCRIPTION_FIELD'),
        'state' => getStateFieldName(),
    ];
    $clubEventFieldMap = [
        'title' => getRequiredFieldName('CLUB_EVENTS_TITLE_FIELD', 'Title'),
        'start' => getRequiredFieldName('CLUB_EVENTS_START_FIELD', 'Start'),
        'end' => getRequiredFieldName('CLUB_EVENTS_END_FIELD', 'End'),
        'allDay' => getOptionalFieldName('CLUB_EVENTS_ALL_DAY_FIELD'),
        'location' => getOptionalFieldName('CLUB_EVENTS_LOCATION_FIELD'),
        'description' => getRequiredFieldName('CLUB_EVENTS_NOTE_FIELD', 'Poznamka'),
        'state' => null,
    ];
    $reservationSource = [
        'key' => 'boat_reservation',
        'label' => 'Rezervace lodi',
    ];
    $clubEventSource = [
        'key' => 'club_event',
        'label' => 'Klubove udalosti',
        'colors' => [
            'backgroundColor' => '#1976d2',
            'borderColor' => '#1976d2',
            'textColor' => '#ffffff',
        ],
    ];

    $graphAuth = new Auth();
    $graphApi = new GraphAPI($graphAuth);

    $siteId = resolveCalendarSiteId($graphApi, $host, $path);
    $listId = resolveCalendarListId($graphApi, $siteId);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = readJsonBody();
        $action = requireBodyString($body, 'action');

        if ($action === 'update_state') {
            $memberAuth->requireCapability('reservation:approve');
            $itemId = requireBodyString($body, 'id');
            $state = requireBodyString($body, 'state');

            if (!in_array($state, ['Confirmed', 'Canceled'], true)) {
                throw new Exception('Invalid reservation state.');
            }

            updateCalendarItemState($graphApi, $siteId, $listId, $itemId, $fieldMap['state'], $state);

            echo json_encode([
                'success' => true,
                'member' => $member,
                'id' => $itemId,
                'state' => $state,
            ]);
            exit;
        }

        if ($action === 'delete_club_event') {
            $memberAuth->requireCapability('club_event:delete');
            $itemId = requireBodyString($body, 'id');
            $clubEventsListId = resolveClubEventsListId($graphApi, $siteId);
            deleteCalendarItem($graphApi, $siteId, $clubEventsListId, $itemId);

            echo json_encode([
                'success' => true,
                'member' => $member,
                'id' => $itemId,
            ]);
            exit;
        }

        throw new Exception('Unknown calendar action.');
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Unsupported request method.');
    }

    $rangeStart = parseDateParam(requireDateParam('start'), 'start');
    $rangeEnd = parseDateParam(requireDateParam('end'), 'end');

    if ($rangeEnd <= $rangeStart) {
        throw new Exception('Calendar range end must be after range start.');
    }

    $rangeDays = $rangeStart->diff($rangeEnd)->days;
    if ($rangeDays > 120) {
        throw new Exception('Requested calendar range is too large.');
    }

    $items = loadCalendarItems($graphApi, $siteId, $listId, $rangeStart, $rangeEnd, $fieldMap['start']);
    $events = normalizeCalendarItems(
        $items,
        $fieldMap,
        $rangeStart,
        $rangeEnd,
        memberHasCapability($member, 'reservation:cancel'),
        $reservationSource
    );
    $warnings = [];

    try {
        $clubEventsListId = resolveClubEventsListId($graphApi, $siteId);
        $clubItems = loadCalendarItems($graphApi, $siteId, $clubEventsListId, $rangeStart, $rangeEnd, $clubEventFieldMap['start']);
        $events = array_merge($events, normalizeCalendarItems(
            $clubItems,
            $clubEventFieldMap,
            $rangeStart,
            $rangeEnd,
            true,
            $clubEventSource
        ));
    } catch (Exception $e) {
        $warnings[] = [
            'source' => 'club_event',
            'message' => $e->getMessage(),
        ];
    }

    usort($events, function ($left, $right) {
        return strcmp($left['start'], $right['start']);
    });

    echo json_encode([
        'success' => true,
        'member' => $member,
        'events' => $events,
        'warnings' => $warnings,
        'range' => [
            'start' => $rangeStart->format(DateTimeInterface::ATOM),
            'end' => $rangeEnd->format(DateTimeInterface::ATOM),
        ],
    ]);
} catch (Exception $e) {
    $statusCode = $e->getMessage() === 'Authentication required.' ? 401 : 500;
    if ($e->getMessage() === 'Permission denied.') {
        $statusCode = 403;
    }
    if (
        str_starts_with($e->getMessage(), 'Missing required query parameter')
        || str_starts_with($e->getMessage(), 'Invalid date parameter')
        || $e->getMessage() === 'Calendar range end must be after range start.'
        || $e->getMessage() === 'Requested calendar range is too large.'
        || $e->getMessage() === 'Missing request body.'
        || $e->getMessage() === 'Invalid JSON request body.'
        || str_starts_with($e->getMessage(), 'Missing required body field')
        || $e->getMessage() === 'Unknown calendar action.'
        || $e->getMessage() === 'Invalid reservation state.'
        || $e->getMessage() === 'Unsupported request method.'
    ) {
        $statusCode = 400;
    }

    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
