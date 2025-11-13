<?php
// VSTJ Technika Jachting Web - PHP Proxy for Microsoft Graph API
// Handles app-only authentication and SharePoint access

// CORS headers - allow both localhost and production
$allowedOrigins = ['http://localhost:5173', 'https://jachting.technika-praha.cz'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration - load from environment variables
$clientId = getenv('CLIENT_ID');
$tenantId = getenv('TENANT_ID');
$clientSecret = getenv('CLIENT_SECRET');

// Validate required environment variables
if (!$clientId || !$tenantId || !$clientSecret) {
    echo json_encode([
        'success' => false,
        'error' => 'Missing required environment variables: CLIENT_ID, TENANT_ID, CLIENT_SECRET'
    ]);
    exit;
}

$siteHost = 'technikapraha.sharepoint.com';
$sitePath = 'sites/jachting';
$folderPath = 'verejne/fotky-verejne';

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

// Make Graph API request
function callGraphAPI($url, $accessToken) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Authorization: Bearer ' . $accessToken,
            'timeout' => 30
        ]
    ]);

    $response = file_get_contents($url, false, $context);

    if ($response === false) {
        throw new Exception('Failed to call Graph API');
    }

    return json_decode($response, true);
}

// Main logic
try {
    // Get access token
    $accessToken = getAccessToken($clientId, $tenantId, $clientSecret);

    // Get site ID
    $siteUrl = "https://graph.microsoft.com/v1.0/sites/{$siteHost}:/{$sitePath}";
    $siteData = callGraphAPI($siteUrl, $accessToken);
    $siteId = $siteData['id'];

    // Get folder contents
    $encodedFolderPath = urlencode($folderPath);
    $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedFolderPath}:/children?\$select=id,name,webUrl,file,folder&\$expand=thumbnails";
    $folderData = callGraphAPI($folderUrl, $accessToken);

    // Filter for images only
    $images = array_filter($folderData['value'], function($item) {
        return isset($item['file']) && isset($item['file']['mimeType']) &&
               strpos($item['file']['mimeType'], 'image/') === 0;
    });

    // Return success response
    echo json_encode([
        'success' => true,
        'images' => array_values($images)
    ]);

} catch (Exception $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'error' => 'Failed to call Graph API'
    ]);
}
?>