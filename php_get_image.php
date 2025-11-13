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

// Secure token encryption/decryption functions
function encryptToken($data, $key) {
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decryptToken($encryptedData, $key) {
    $data = base64_decode($encryptedData);
    $iv = substr($data, 0, 16);
    $encrypted = substr($data, 16);
    return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
}

// Secure token caching with encryption
function getCachedAccessToken($clientId, $tenantId, $clientSecret) {
    $cacheFile = sys_get_temp_dir() . '/msal_token_cache.enc';
    $encryptionKey = hash('sha256', $clientSecret . $tenantId); // Derive encryption key from secrets

    // Check for valid cached token
    if (file_exists($cacheFile)) {
        try {
            $encrypted = @file_get_contents($cacheFile);
            if ($encrypted === false) {
                // File read error, continue to get new token
                goto get_new_token;
            }

            $decrypted = decryptToken($encrypted, $encryptionKey);
            if ($decrypted === false) {
                // Decryption failed (corrupted cache), continue to get new token
                goto get_new_token;
            }

            $cache = json_decode($decrypted, true);
            if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                return $cache['token'];
            }
        } catch (Exception $e) {
            // Any error in reading/decrypting cache, get new token
            goto get_new_token;
        }
    }

    get_new_token:
    // Get new token using client credentials flow
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

    $response = @file_get_contents($tokenUrl, false, $context);

    if ($response === false) {
        throw new Exception('Failed to get access token');
    }

    $data = json_decode($response, true);

    if (isset($data['error'])) {
        throw new Exception('Token error: ' . $data['error_description']);
    }

    $token = $data['access_token'];

    // Encrypt and cache token for 50 minutes (tokens valid for 60 minutes)
    try {
        $cacheData = json_encode([
            'token' => $token,
            'expires' => time() + 3000 // 50 minutes
        ]);

        $encryptedCache = encryptToken($cacheData, $encryptionKey);
        file_put_contents($cacheFile, $encryptedCache);

        // Set restrictive permissions (readable/writable by owner only)
        chmod($cacheFile, 0600);
    } catch (Exception $e) {
        // If caching fails, continue without caching - don't fail the request
        error_log('Token caching failed: ' . $e->getMessage());
    }

    return $token;
}

// Legacy function for backward compatibility
function getAccessToken($clientId, $tenantId, $clientSecret) {
    return getCachedAccessToken($clientId, $tenantId, $clientSecret);
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

    $siteResponse = @file_get_contents($siteUrl, false, $siteContext);
    if ($siteResponse === false) {
        throw new Exception('Failed to get site info');
    }

    $siteData = json_decode($siteResponse, true);
    $siteId = $siteData['id'];

    $contentUrl = "https://graph.microsoft.com/v1.0/sites/" . urlencode($siteId) . "/drive/items/{$itemId}/content";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Authorization: Bearer ' . $accessToken
        ]
    ]);

    $response = @file_get_contents($contentUrl, false, $context);

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
    // Log error and return generic error to avoid corrupting image headers
    error_log('Image fetch error: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Failed to fetch image'
    ]);
}
?>