<?php

require_once __DIR__ . '/../core/Config.php';
require_once __DIR__ . '/../core/MemberAuth.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, Config::getAllowedOrigins(), true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function respondJson(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function respondError(Exception $e, int $statusCode = 400): void
{
    respondJson([
        'success' => false,
        'error' => $e->getMessage(),
    ], $statusCode);
}

function appendAuthErrorToUrl(string $url, string $message): string
{
    $parts = parse_url($url);
    if ($parts === false) {
        return $url;
    }

    $queryParams = [];
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $queryParams);
    }

    $queryParams['authError'] = $message;
    $query = http_build_query($queryParams);

    $rebuilt = '';

    if (!empty($parts['scheme'])) {
        $rebuilt .= $parts['scheme'] . '://';
    }

    if (!empty($parts['host'])) {
        $rebuilt .= $parts['host'];
    }

    if (!empty($parts['port'])) {
        $rebuilt .= ':' . $parts['port'];
    }

    $rebuilt .= $parts['path'] ?? '';

    if ($query !== '') {
        $rebuilt .= '?' . $query;
    }

    if (!empty($parts['fragment'])) {
        $rebuilt .= '#' . $parts['fragment'];
    }

    return $rebuilt;
}

try {
    $auth = new MemberAuth();
    $action = $_GET['action'] ?? 'session';

    switch ($action) {
        case 'login':
            $auth->beginLogin($_GET['returnTo'] ?? null);
            break;

        case 'callback':
            $auth->handleCallback();
            break;

        case 'logout':
            $auth->logout($_GET['returnTo'] ?? null);
            break;

        case 'session':
            respondJson([
                'success' => true,
                'session' => $auth->getSessionState(),
            ]);
            break;

        default:
            respondJson([
                'success' => false,
                'error' => 'Unknown action.',
            ], 400);
            break;
    }
} catch (Exception $e) {
    $action = $_GET['action'] ?? 'session';
    if ($action === 'callback') {
        http_response_code(302);
        $redirectUrl = appendAuthErrorToUrl($auth->getPendingReturnTo(), $e->getMessage());
        header('Location: ' . $redirectUrl);
        exit;
    }

    $statusCode = $action === 'session' ? 200 : 400;
    respondError($e, $statusCode);
}
