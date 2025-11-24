<?php
// VSTJ Technika Jachting Web - Request Router

class Router
{
    private Gallery $gallery;
    private News $news;

    public function __construct(Gallery $gallery, News $news)
    {
        $this->gallery = $gallery;
        $this->news = $news;
    }

    public function handleRequest(): void
    {
        $action = $_GET['action'] ?? 'gallery';

        try {
            switch ($action) {
                // Gallery endpoints
                case 'list_gallery_years':
                    $this->respond($this->gallery->getAvailableYears());
                    break;

                case 'gallery':
                    $year = $_GET['year'] ?? null;
                    $top = isset($_GET['top']) ? intval($_GET['top']) : Config::DEFAULT_PAGE_SIZE;
                    $skip = isset($_GET['skip']) ? intval($_GET['skip']) : 0;
                    $this->respond($this->gallery->getImages($year, $top, $skip));
                    break;

                // News endpoints
                case 'list_news_years':
                    $this->respond($this->news->getAvailableYears());
                    break;

                case 'list_articles':
                    $year = $_GET['year'] ?? null;
                    $this->respond($this->news->getArticles($year));
                    break;

                case 'article':
                    $title = $_GET['title'] ?? '';
                    $year = $_GET['year'] ?? '';
                    if (!$title || !$year) {
                        $this->respond(['success' => false, 'error' => 'Missing title or year parameter'], 400);
                        break;
                    }
                    $article = $this->news->getArticle($title, $year);
                    if ($article) {
                        $this->respond($article);
                    } else {
                        $this->respond(['success' => false, 'error' => 'Article not found'], 404);
                    }
                    break;

                default:
                    $this->respond(['success' => false, 'error' => 'Unknown action'], 400);
                    break;
            }
        } catch (Exception $e) {
            $this->respond(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function respond(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
