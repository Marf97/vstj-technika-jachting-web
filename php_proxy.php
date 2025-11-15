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
$newsFolderPath = 'verejne/novinky-verejne';

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
    $startTime = microtime(true);

    // Get access token
    $accessToken = getAccessToken($clientId, $tenantId, $clientSecret);
    $tokenTime = microtime(true) - $startTime;

    // Get site ID (reuse cached site ID logic from php_get_image.php)
    $siteCacheFile = sys_get_temp_dir() . '/site_id_cache_' . md5($siteHost . $sitePath) . '.json';
    $siteId = null;

    // Check for valid cached site ID (cache for 24 hours)
    if (file_exists($siteCacheFile)) {
        $cacheContent = @file_get_contents($siteCacheFile);
        if ($cacheContent !== false) {
            $cache = json_decode($cacheContent, true);
            if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                $siteId = $cache['siteId'];
            }
        }
    }

    if (!$siteId) {
        // Get fresh site ID
        $siteUrl = "https://graph.microsoft.com/v1.0/sites/{$siteHost}:/{$sitePath}";
        $siteData = callGraphAPI($siteUrl, $accessToken);
        $siteId = $siteData['id'];

        // Cache site ID for 24 hours
        $cacheData = json_encode([
            'siteId' => $siteId,
            'expires' => time() + 86400 // 24 hours
        ]);
        @file_put_contents($siteCacheFile, $cacheData);
        @chmod($siteCacheFile, 0600);
    }

    $siteTime = microtime(true) - $startTime - $tokenTime;

    // Get pagination and year parameters
    $top = isset($_GET['top']) ? intval($_GET['top']) : null;
    $skip = isset($_GET['skip']) ? intval($_GET['skip']) : 0;
    $year = isset($_GET['year']) ? trim($_GET['year']) : null;
    $listYears = isset($_GET['list_years']) && $_GET['list_years'] === '1';

    // News-specific parameters
    $article = isset($_GET['article']) ? trim($_GET['article']) : null;
    $listArticles = isset($_GET['list_articles']) && $_GET['list_articles'] === '1';
    $newsMode = $article !== null || $listArticles || isset($_GET['news']);

    // Handle news mode or gallery mode
    if ($newsMode) {
        // Use news folder path for news operations
        $currentFolderPath = $newsFolderPath;
    } else {
        // Use gallery folder path for gallery operations
        $currentFolderPath = $folderPath;
    }

    // Handle year folder enumeration if requested
    if ($listYears) {
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$currentFolderPath}:/children?\$select=id,name,folder";
        $folderData = callGraphAPI($folderUrl, $accessToken);

        // Filter for year folders (numeric names like 2025, 2024, etc.)
        $yearFolders = array_filter($folderData['value'], function($item) {
            return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
        });

        // Sort years descending (newest first)
        usort($yearFolders, function($a, $b) {
            return intval($b['name']) - intval($a['name']);
        });

        echo json_encode([
            'success' => true,
            'years' => array_map(function($item) { return $item['name']; }, $yearFolders)
        ]);
        exit;
    }

    // Handle article listing if requested
    if ($listArticles) {
        $articles = [];

        if ($year) {
            // List articles for specific year
            $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$newsFolderPath}/{$year}:/children?\$select=id,name,folder,file,createdDateTime,lastModifiedDateTime";
            try {
                $yearFolderData = callGraphAPI($yearFolderUrl, $accessToken);

                // Filter for folders (each article is a folder containing markdown and images)
                $articleFolders = array_filter($yearFolderData['value'], function($item) {
                    return isset($item['folder']);
                });

                // Sort articles by creation date descending (newest first)
                usort($articleFolders, function($a, $b) {
                    $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                    $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                    return $bTime - $aTime;
                });

                $articles = array_map(function($item) use ($year) {
                    return [
                        'id' => $item['id'],
                        'title' => $item['name'],
                        'year' => $year,
                        'createdDateTime' => $item['createdDateTime'],
                        'lastModifiedDateTime' => $item['lastModifiedDateTime']
                    ];
                }, $articleFolders);
            } catch (Exception $e) {
                // Year folder might not exist or be accessible
                $articles = [];
            }
        } else {
            // List all articles across all years
            $newsFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$newsFolderPath}:/children?\$select=id,name,folder";
            $newsFolderData = callGraphAPI($newsFolderUrl, $accessToken);

            // Get year folders
            $yearFolders = array_filter($newsFolderData['value'], function($item) {
                return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
            });

            // Sort years descending
            usort($yearFolders, function($a, $b) {
                return intval($b['name']) - intval($a['name']);
            });

            // Collect articles from all years
            foreach ($yearFolders as $yearFolder) {
                $yearName = $yearFolder['name'];
                $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$newsFolderPath}/{$yearName}:/children?\$select=id,name,folder,createdDateTime,lastModifiedDateTime";

                try {
                    $yearFolderData = callGraphAPI($yearFolderUrl, $accessToken);

                    $articleFolders = array_filter($yearFolderData['value'], function($item) {
                        return isset($item['folder']);
                    });

                    // Sort articles within year
                    usort($articleFolders, function($a, $b) {
                        $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                        $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                        return $bTime - $aTime;
                    });

                    $yearArticles = array_map(function($item) use ($yearName) {
                        return [
                            'id' => $item['id'],
                            'title' => $item['name'],
                            'year' => $yearName,
                            'createdDateTime' => $item['createdDateTime'],
                            'lastModifiedDateTime' => $item['lastModifiedDateTime']
                        ];
                    }, $articleFolders);

                    $articles = array_merge($articles, $yearArticles);
                } catch (Exception $e) {
                    // Skip inaccessible year folders
                    continue;
                }
            }
        }

        echo json_encode([
            'success' => true,
            'articles' => $articles
        ]);
        exit;
    }

    // Handle individual article fetching
    if ($article) {
        $articleData = null;

        if ($year) {
            // Fetch specific article from specific year
            $articleFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$newsFolderPath}/{$year}/{$article}:/children?\$select=id,name,file,mimeType,size,createdDateTime,lastModifiedDateTime,@microsoft.graph.downloadUrl";
            try {
                $articleFolderData = callGraphAPI($articleFolderUrl, $accessToken);

                $markdownFile = null;
                $images = [];

                foreach ($articleFolderData['value'] as $item) {
                    if (isset($item['file'])) {
                        if (strpos($item['mimeType'], 'text/markdown') !== false || pathinfo($item['name'], PATHINFO_EXTENSION) === 'md') {
                            $markdownFile = $item;
                        } elseif (strpos($item['mimeType'], 'image/') === 0) {
                            $images[] = $item;
                        }
                    }
                }

                if ($markdownFile) {
                    // Fetch markdown content
                    $markdownUrl = $markdownFile['@microsoft.graph.downloadUrl'];
                    $markdownContent = file_get_contents($markdownUrl);

                    if ($markdownContent !== false) {
                        $articleData = [
                            'id' => $markdownFile['id'],
                            'title' => $article,
                            'year' => $year,
                            'content' => $markdownContent,
                            'createdDateTime' => $markdownFile['createdDateTime'],
                            'lastModifiedDateTime' => $markdownFile['lastModifiedDateTime'],
                            'images' => $images
                        ];
                    }
                }
            } catch (Exception $e) {
                // Article not found
            }
        }

        if ($articleData) {
            echo json_encode([
                'success' => true,
                'article' => $articleData
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Article not found'
            ]);
        }
        exit;
    }

    // Check cache for gallery data (5-minute cache) - only for gallery mode
    if (!$newsMode) {
        $galleryCacheFile = sys_get_temp_dir() . '/gallery_cache_' . md5($siteId . $folderPath) . '.json';
        $cacheValid = false;
    }

    if (!$newsMode && file_exists($galleryCacheFile)) {
        $cacheContent = @file_get_contents($galleryCacheFile);
        if ($cacheContent !== false) {
            $cache = json_decode($cacheContent, true);
            if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                $folderData = $cache['data'];
                $cacheValid = true;
            }
        }
    }

    // Handle year-specific fetching or default browsing
    if ($year && !$newsMode) {
        // Year-specific mode: fetch from specific year folder
        $yearFolderPath = $folderPath . '/' . $year;
        $encodedYearFolderPath = urlencode($yearFolderPath);
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedYearFolderPath}:/children?\$select=id,name,createdDateTime,lastModifiedDateTime,webUrl,file,folder&\$expand=thumbnails";
        $allFolderData = callGraphAPI($folderUrl, $accessToken);

        // Sort images by creation date descending in PHP
        if (isset($allFolderData['value']) && is_array($allFolderData['value'])) {
            usort($allFolderData['value'], function($a, $b) {
                $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                return $bTime - $aTime; // descending order
            });
        }

        $allImagesCache = $allFolderData['value'];
        $cacheValid = false; // No cache for year-specific requests
    } else {
        // Default mode: implement year-aware fallback browsing
        // Start with current year, then fall back to previous years when exhausted

        // First, get available year folders to determine browsing order
        $yearFoldersUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$currentFolderPath}:/children?\$select=id,name,folder";
        $yearFoldersData = callGraphAPI($yearFoldersUrl, $accessToken);

        // Filter and sort year folders (newest first)
        $yearFolders = array_filter($yearFoldersData['value'], function($item) {
            return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
        });
        usort($yearFolders, function($a, $b) {
            return intval($b['name']) - intval($a['name']);
        });

        // Collect all images from year folders in order (newest year first)
        $allImages = [];
        foreach ($yearFolders as $yearFolder) {
            $yearName = $yearFolder['name'];
            $yearFolderPath = $currentFolderPath . '/' . $yearName;
            $encodedYearFolderPath = urlencode($yearFolderPath);
            $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedYearFolderPath}:/children?\$select=id,name,createdDateTime,lastModifiedDateTime,webUrl,file,folder&\$expand=thumbnails";

            try {
                $yearFolderData = callGraphAPI($yearFolderUrl, $accessToken);
                if (isset($yearFolderData['value']) && is_array($yearFolderData['value'])) {
                    // Sort images within year by creation date descending
                    usort($yearFolderData['value'], function($a, $b) {
                        $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                        $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                        return $bTime - $aTime;
                    });

                    // Add year metadata to each image for fallback logic
                    foreach ($yearFolderData['value'] as &$item) {
                        $item['_year'] = $yearName;
                    }

                    $allImages = array_merge($allImages, $yearFolderData['value']);
                }
            } catch (Exception $e) {
                // Skip folders that can't be accessed
                error_log("Failed to access year folder {$yearName}: " . $e->getMessage());
            }
        }

        // No additional sorting needed - images are already in year order (newest year first)
        // and within each year, newest images first
        $allImagesCache = $allImages;
        $cacheValid = false; // Don't cache dynamic year-based browsing
    }

    // Apply pagination to the cached/sorted results only for gallery mode
    if (!$newsMode) {
        $folderData = ['value' => array_slice($allImagesCache, $skip, $top ?: null)];

        // Filter for images only (exclude folders)
        $images = array_filter($folderData['value'], function($item) {
            return isset($item['file']) && isset($item['file']['mimeType']) &&
                   strpos($item['file']['mimeType'], 'image/') === 0;
        });

        // Handle pagination response
        $totalImages = count($images);
        $paginatedImages = $images;
    }

    $totalTime = microtime(true) - $startTime;
    $filterTime = microtime(true) - $startTime - $tokenTime - $siteTime;

    // Log performance metrics
    error_log(sprintf(
        'Gallery fetch performance - Token time: %.3fs, Site time: %.3fs, Folder time: %.3fs, Filter time: %.3fs, Total: %.3fs',
        $tokenTime, $siteTime, (microtime(true) - $startTime - $tokenTime - $siteTime - $filterTime), $filterTime, $totalTime
    ));

    // Check if there are more results available based on our pagination
    $hasMore = ($skip + count($paginatedImages)) < count($allImagesCache);

    // For year-specific mode, hasMore is based on year folder pagination
    // For default mode, hasMore remains based on total images
    if ($year) {
        $hasMore = ($skip + count($paginatedImages)) < count($allImagesCache);
    }

    // Return success response
    echo json_encode([
        'success' => true,
        'images' => array_values($paginatedImages),
        'total' => count($allImagesCache),
        'hasMore' => $hasMore,
        'year' => $year,
        '_debug' => [
            'performance' => [
                'token_time' => round($tokenTime, 3),
                'site_time' => round($siteTime, 3),
                'total_time' => round($totalTime, 3)
            ],
            'image_count' => count($paginatedImages),
            'total_images' => count($allImagesCache),
            'top' => $top,
            'skip' => $skip,
            'cached' => $cacheValid ? 'gallery' : 'none',
            'has_more' => $hasMore,
            'year_mode' => $year ? 'specific' : 'default'
        ]
    ]);

} catch (Exception $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>