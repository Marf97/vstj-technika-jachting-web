<?php
// VSTJ Technika Jachting Web - PHP Proxy for individual image fetching
// Handles requests for full-resolution images

// CORS headers - allow both localhost and production
$allowedOrigins = ['http://localhost:5173', 'https://jachting.technika-praha.cz'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Configuration - load from environment variables
$clientId = getenv('CLIENT_ID');
$tenantId = getenv('TENANT_ID');
$clientSecret = getenv('CLIENT_SECRET');

// Validate required environment variables
if (!$clientId || !$tenantId || !$clientSecret) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Missing required environment variables: CLIENT_ID, TENANT_ID, CLIENT_SECRET'
    ]);
    exit;
}

// Get item ID from query parameter
$itemId = $_GET['id'] ?? null;
if (!$itemId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing item ID']);
    exit;
}

// Get access token using client credentials flow
function getAccessToken($clientId, $tenantId, $clientSecret) {
    $tokenUrl = "https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token";

    $postData = http_build_query([
        'client_id' => $clientId,
        'scope' => 'https://graph.microsoft.com/.default',
        'client_secret' => $clientSecret,
        'grant_type' => 'client_credentials'
    ]);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $postData,
            'ignore_errors' => true
        ]
    ]);

    $response = file_get_contents($tokenUrl, false, $context);

    if ($response === false) {
        throw new Exception('Failed to get access token');
    }

    $data = json_decode($response, true);

    if (isset($data['error'])) {
        throw new Exception('Token error: ' . $data['error_description']);
    }

    return $data['access_token'];
}

// Fetch image content from SharePoint
function fetchImageContent($itemId, $accessToken) {
    // For app-only access, we need to use the site-specific drive endpoint
    // Since we don't have site context in this function, we'll use the general drive endpoint
    $contentUrl = "https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{$itemId}/content";

    // Actually, let's use the sites endpoint with a known site
    $siteHost = 'technikapraha.sharepoint.com';
    $sitePath = 'sites/jachting';

    // First get site and drive info, then get content
    $siteUrl = "https://graph.microsoft.com/v1.0/sites/{$siteHost}:/{$sitePath}";
    $siteContext = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Authorization: Bearer ' . $accessToken
        ]
    ]);

    $siteResponse = file_get_contents($siteUrl, false, $siteContext);
    if ($siteResponse === false) {
        throw new Exception('Failed to get site info');
    }

    $siteData = json_decode($siteResponse, true);
    $siteId = $siteData['id'];

    $contentUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$itemId}/content";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Authorization: Bearer ' . $accessToken
        ]
    ]);

    $response = file_get_contents($contentUrl, false, $context);

    if ($response === false) {
        throw new Exception('Failed to fetch image content');
    }

    return $response;
}

try {
    // Get access token
    $accessToken = getAccessToken($clientId, $tenantId, $clientSecret);

    // Fetch image content
    $imageData = fetchImageContent($itemId, $accessToken);

    // Set appropriate headers for image response
    header('Content-Type: image/jpeg');
    header('Cache-Control: private, max-age=3600'); // Cache for 1 hour

    // Output image data
    echo $imageData;

} catch (Exception $e) {
    // Return error as JSON for debugging
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>