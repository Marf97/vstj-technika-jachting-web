<?php
// VSTJ Technika Jachting Web - Gallery Endpoint


require_once __DIR__ . '/../core/Config.php';

// CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, Config::getAllowedOrigins())) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check if this is an image content request (no action parameter)
$itemId = $_GET['id'] ?? null;
$size = $_GET['size'] ?? 'fullhd';

if ($itemId && !isset($_GET['action'])) {
    // Handle individual image fetching

    require_once __DIR__ . '/../core/Auth.php';
    require_once __DIR__ . '/../core/GraphAPI.php';
    require_once __DIR__ . '/../modules/Gallery.php';

    try {
        $auth = new Auth();
        $graphAPI = new GraphAPI($auth);
        $gallery = new Gallery($graphAPI);

        $startTime = microtime(true);
        $imageResult = $gallery->getImageContent($itemId, $size);
        $fetchTime = microtime(true) - $startTime;

        // Generate ETag from image data for caching
        $etag = md5($imageResult['data']);

        // Set caching headers
        header('Content-Type: ' . $imageResult['mimeType']);
        header('Cache-Control: public, max-age=86400'); // 24 hours
        header("ETag: \"{$etag}\"");
        header('Vary: Accept-Encoding');
        header('X-Performance-Fetch-Time: ' . number_format($fetchTime, 3));

        // Check If-None-Match for conditional requests
        $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
        if ($ifNoneMatch === "\"{$etag}\"") {
            http_response_code(304);
            exit();
        }

        echo $imageResult['data'];
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Failed to fetch image: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Regular JSON API requests
header('Content-Type: application/json');
header('Vary: Origin');

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/GraphAPI.php';
require_once __DIR__ . '/../modules/Gallery.php';

/**
 * Helper function to handle conditional requests and HTTP caching
 */
function handleConditionalRequest(array $data, int $maxAge, ?string $dataKey = null): void
{
    // Skip caching for error responses
    if (!isset($data['success']) || !$data['success']) {
        return;
    }

    // Generate ETag from response
    $etag = md5(json_encode($data));
    header("ETag: \"{$etag}\"");

    // Generate Last-Modified from latest image timestamp (if available)
    if ($dataKey && isset($data[$dataKey]) && !empty($data[$dataKey])) {
        $timestamps = array_map('strtotime', array_column($data[$dataKey], 'lastModifiedDateTime'));
        if (!empty($timestamps)) {
            $latestTimestamp = max($timestamps);
            header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $latestTimestamp) . ' GMT');
        }
    }

    // Set Cache-Control
    header("Cache-Control: public, max-age={$maxAge}");

    // Check If-None-Match (ETag validation)
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    if ($ifNoneMatch === "\"{$etag}\"") {
        http_response_code(304);
        exit();
    }

    // Check If-Modified-Since (timestamp validation)
    if ($dataKey && isset($data[$dataKey]) && !empty($data[$dataKey])) {
        $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? null;
        if ($ifModifiedSince && isset($latestTimestamp) && strtotime($ifModifiedSince) >= $latestTimestamp) {
            http_response_code(304);
            exit();
        }
    }
}

try {
    $auth = new Auth();
    $graphAPI = new GraphAPI($auth);
    $gallery = new Gallery($graphAPI);

    // Route gallery requests
    $action = $_GET['action'] ?? 'gallery';

    switch ($action) {
        case 'list_gallery_years':
            $data = [
                'success' => true,
                'years' => $gallery->getAvailableYears()
            ];

            // HTTP caching: 1 hour for years list (rarely changes)
            handleConditionalRequest($data, 3600);

            echo json_encode($data);
            break;

        case 'gallery':
        default:
            $year = $_GET['year'] ?? null;
            $top = isset($_GET['top']) ? intval($_GET['top']) : Config::DEFAULT_PAGE_SIZE;
            $skip = isset($_GET['skip']) ? intval($_GET['skip']) : 0;

            $result = $gallery->getImages($year, $top, $skip);
            $data = array_merge(['success' => true], $result);

            // Add cache status header
            if ($gallery->wasLastCacheHit()) {
                header('X-Gallery-Cache: HIT');
            } else {
                header('X-Gallery-Cache: MISS');
            }

            // HTTP caching: 10 minutes for image list
            handleConditionalRequest($data, 600, 'images');

            echo json_encode($data);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
