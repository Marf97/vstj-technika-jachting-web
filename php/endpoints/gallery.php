<?php
// VSTJ Technika Jachting Web - Gallery Endpoint


require_once __DIR__ . '/../core/Config.php';

// CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, Config::ALLOWED_ORIGINS)) {
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
            if ($itemId && !isset($_GET['action'])) {
    // Handle individual image fetching
    
    header('Content-Type: image/jpeg');
    header('Cache-Control: private, max-age=3600');

    require_once __DIR__ . '/../core/Auth.php';
    require_once __DIR__ . '/../core/GraphAPI.php';
    require_once __DIR__ . '/../modules/Gallery.php';

    try {
        $auth = new Auth();
        $graphAPI = new GraphAPI($auth);
        $gallery = new Gallery($graphAPI);

                $startTime = microtime(true);
        $imageResult = $gallery->getImageContent($itemId);
        $fetchTime = microtime(true) - $startTime;


        header('Content-Type: ' . $imageResult['mimeType']);
        header('X-Performance-Fetch-Time: ' . number_format($fetchTime, 3));
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

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/GraphAPI.php';
require_once __DIR__ . '/../modules/Gallery.php';

try {
    $auth = new Auth();
    $graphAPI = new GraphAPI($auth);
    $gallery = new Gallery($graphAPI);

    // Route gallery requests
    $action = $_GET['action'] ?? 'gallery';

    switch ($action) {
        case 'list_gallery_years':
            echo json_encode([
                'success' => true,
                'years' => $gallery->getAvailableYears()
            ]);
            break;

        case 'gallery':
        default:
            $year = $_GET['year'] ?? null;
            $top = isset($_GET['top']) ? intval($_GET['top']) : Config::DEFAULT_PAGE_SIZE;
            $skip = isset($_GET['skip']) ? intval($_GET['skip']) : 0;

            $result = $gallery->getImages($year, $top, $skip);
            echo json_encode(array_merge(['success' => true], $result));
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>