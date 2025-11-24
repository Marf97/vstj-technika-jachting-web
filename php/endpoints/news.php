<?php
// VSTJ Technika Jachting Web - News Endpoint

require_once __DIR__ . '/../core/Config.php';

// CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, Config::getAllowedOrigins())) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Add Vary header for proper cache segmentation with CORS
header('Vary: Origin');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/GraphAPI.php';
require_once __DIR__ . '/../modules/News.php';

/**
 * Handle HTTP conditional requests and caching headers
 * @param array $data The data array to check (e.g., articles)
 * @param string $dataKey The key in $data that contains modification times (e.g., 'articles', 'years')
 * @return void Exits with 304 if content hasn't changed
 */
function handleConditionalRequest(array $data, string $dataKey = 'articles'): void
{
    // Skip caching for error responses
    if (!isset($data['success']) || !$data['success']) {
        return;
    }

    // Skip if no cacheable data
    if (!isset($data[$dataKey]) || empty($data[$dataKey])) {
        // For empty results, still cache with current time
        $etag = md5(json_encode($data));
        header("ETag: \"{$etag}\"");
        header('Cache-Control: public, max-age=600'); // 10 minutes

        $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
        if ($ifNoneMatch === "\"{$etag}\"") {
            http_response_code(304);
            exit();
        }
        return;
    }

    // Calculate ETag from full response
    $etag = md5(json_encode($data));
    header("ETag: \"{$etag}\"");

    // Calculate Last-Modified from articles' lastModifiedDateTime
    $items = $data[$dataKey];
    $latestTimestamp = 0;

    foreach ($items as $item) {
        if (isset($item['lastModifiedDateTime'])) {
            $timestamp = strtotime($item['lastModifiedDateTime']);
            if ($timestamp > $latestTimestamp) {
                $latestTimestamp = $timestamp;
            }
        }
    }

    // If we found modification times, add Last-Modified header
    if ($latestTimestamp > 0) {
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $latestTimestamp) . ' GMT');
    }

    // Add Cache-Control header - 10 minutes
    header('Cache-Control: public, max-age=600');

    // Check conditional request headers
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
    $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? null;

    // Check If-None-Match (ETag)
    if ($ifNoneMatch === "\"{$etag}\"") {
        http_response_code(304);
        exit();
    }

    // Check If-Modified-Since (only if we have modification time)
    if ($latestTimestamp > 0 && $ifModifiedSince) {
        $ifModifiedSinceTimestamp = strtotime($ifModifiedSince);
        if ($ifModifiedSinceTimestamp >= $latestTimestamp) {
            http_response_code(304);
            exit();
        }
    }
}

try {
    $auth = new Auth();
    $graphAPI = new GraphAPI($auth);
    $news = new News($graphAPI);

    // Route news requests
    $action = $_GET['action'] ?? 'list_articles';

    switch ($action) {
        case 'list_news_years':
            $responseData = [
                'success' => true,
                'years' => $news->getAvailableYears()
            ];

            // For years list, use shorter cache time since it changes rarely
            // but we want it to update relatively quickly when new years are added
            $etag = md5(json_encode($responseData));
            header("ETag: \"{$etag}\"");
            header('Cache-Control: public, max-age=3600'); // 1 hour for years list

            $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
            if ($ifNoneMatch === "\"{$etag}\"") {
                http_response_code(304);
                exit();
            }

            echo json_encode($responseData);
            break;

        case 'list_articles':
            $year = $_GET['year'] ?? null;
            $articles = $news->getArticles($year);

            // Add server-side cache status headers
            if ($news->wasLastCacheHit()) {
                header('X-News-Cache: HIT');
            } else {
                header('X-News-Cache: MISS');
            }

            $responseData = [
                'success' => true,
                'articles' => $articles
            ];

            // Handle conditional request and HTTP caching
            handleConditionalRequest($responseData, 'articles');

            echo json_encode($responseData);
            break;

        case 'article':
            $title = $_GET['title'] ?? '';
            $year = $_GET['year'] ?? '';

            if (!$title || !$year) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing title or year parameter'
                ]);
                break;
            }

            $article = $news->getArticle($title, $year);
            if ($article) {
                $responseData = array_merge(['success' => true], $article);

                // For individual articles, implement caching
                $etag = md5(json_encode($responseData));
                header("ETag: \"{$etag}\"");

                if (isset($article['lastModifiedDateTime'])) {
                    $timestamp = strtotime($article['lastModifiedDateTime']);
                    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $timestamp) . ' GMT');
                }

                // Individual articles can be cached longer since they change less frequently
                header('Cache-Control: public, max-age=1800'); // 30 minutes

                // Check conditional headers
                $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? null;
                $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? null;

                if ($ifNoneMatch === "\"{$etag}\"") {
                    http_response_code(304);
                    exit();
                }

                if (isset($timestamp) && $ifModifiedSince) {
                    $ifModifiedSinceTimestamp = strtotime($ifModifiedSince);
                    if ($ifModifiedSinceTimestamp >= $timestamp) {
                        http_response_code(304);
                        exit();
                    }
                }

                echo json_encode($responseData);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Article not found'
                ]);
            }
            break;

        case 'get_article_excerpt':
            // DEPRECATED: This endpoint is deprecated as of Phase 2 optimization.
            // Excerpts are now included in the list_articles response.
            // This endpoint is kept for backward compatibility only.
            header('X-Deprecated: true');
            header('X-Deprecation-Message: Use list_articles endpoint instead - excerpts are now included in article objects');

            $year  = $_GET['year']  ?? null;
            $title = $_GET['title'] ?? null;

            if (!$year || !$title) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing year or title'
                ]);
                break;
            }

            $excerpt = $news->getArticleExcerpt($year, $title);

            echo json_encode(['excerpt' => $excerpt]);
            break;

        case 'debug_news':
            $debug = $news->debugNewsStructure();
            echo json_encode(['success' => true, 'debug' => $debug]);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Unknown action'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
