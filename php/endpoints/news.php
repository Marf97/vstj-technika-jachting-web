<?php
// VSTJ Technika Jachting Web - News Endpoint

require_once __DIR__ . '/../core/Config.php';

// CORS headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, Config::ALLOWED_ORIGINS)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/GraphAPI.php';
require_once __DIR__ . '/../modules/News.php';

try {
    $auth = new Auth();
    $graphAPI = new GraphAPI($auth);
    $news = new News($graphAPI);

    // Route news requests
    $action = $_GET['action'] ?? 'list_articles';

    switch ($action) {
        case 'list_news_years':
            echo json_encode([
                'success' => true,
                'years' => $news->getAvailableYears()
            ]);
            break;

        case 'list_articles':
            $year = $_GET['year'] ?? null;
            echo json_encode([
                'success' => true,
                'articles' => $news->getArticles($year)
            ]);
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
                echo json_encode(array_merge(['success' => true], $article));
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Article not found'
                ]);
            }
            break;

        case 'get_article_excerpt':
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
?>