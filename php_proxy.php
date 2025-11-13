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

    // Check cache for gallery data (5-minute cache)
    $galleryCacheFile = sys_get_temp_dir() . '/gallery_cache_' . md5($siteId . $folderPath) . '.json';
    $cacheValid = false;

    if (file_exists($galleryCacheFile)) {
        $cacheContent = @file_get_contents($galleryCacheFile);
        if ($cacheContent !== false) {
            $cache = json_decode($cacheContent, true);
            if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                $folderData = $cache['data'];
                $cacheValid = true;
            }
        }
    }

    if (!$cacheValid) {
        // Get folder contents
        $encodedFolderPath = urlencode($folderPath);
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedFolderPath}:/children?\$select=id,name,webUrl,file,folder&\$expand=thumbnails";
        $folderData = callGraphAPI($folderUrl, $accessToken);

        // Cache the result for 5 minutes
        $cacheData = json_encode([
            'data' => $folderData,
            'expires' => time() + 300 // 5 minutes
        ]);
        @file_put_contents($galleryCacheFile, $cacheData);
        @chmod($galleryCacheFile, 0600);
    }

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