<?php
// VSTJ Technika Jachting Web - News Module

class News {
    private GraphAPI $graphAPI;

    public function __construct(GraphAPI $graphAPI) {
        $this->graphAPI = $graphAPI;
    }

    public function getAvailableYears(): array {
        $siteId = $this->graphAPI->getSiteId();
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . ":/children?\$select=id,name,folder";

        try {
            $folderData = $this->graphAPI->callAPI($folderUrl);

            // Filter for year folders (numeric names like 2025, 2024, etc.)
            $yearFolders = array_filter($folderData['value'], function($item) {
                return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
            });

            // Sort years descending (newest first)
            usort($yearFolders, function($a, $b) {
                return intval($b['name']) - intval($a['name']);
            });

            return array_map(function($item) {
                return $item['name'];
            }, $yearFolders);
        } catch (Exception $e) {
            error_log('Failed to get news years: ' . $e->getMessage());
            return [];
        }
    }

    public function getArticles(?string $year): array {
        $siteId = $this->graphAPI->getSiteId();
        $articles = [];

        if ($year) {
            // List articles for specific year
            $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$year}:/children?\$select=id,name,folder,file,createdDateTime,lastModifiedDateTime";

            try {
                $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);

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
                    $thumbnail = $this->getArticleThumbnailUrl($item['id']);
                    return [
                        'id' => $item['id'],
                        'title' => $item['name'],
                        'year' => $year,
                        'createdDateTime' => $item['createdDateTime'],
                        'lastModifiedDateTime' => $item['lastModifiedDateTime'],
                        'thumbnail' => $thumbnail
                    ];
                }, $articleFolders);
            } catch (Exception $e) {
                error_log("Failed to access news year folder {$year}: " . $e->getMessage());
                $articles = [];
            }
        } else {
            // List all articles across all years
            $newsFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . ":/children?\$select=id,name,folder";

            try {
                $newsFolderData = $this->graphAPI->callAPI($newsFolderUrl);

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
                    $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$yearName}:/children?\$select=id,name,folder,createdDateTime,lastModifiedDateTime";

                    try {
                        $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);

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
                            $thumbnail = $this->getArticleThumbnailUrl($item['id']);
                            return [
                                'id' => $item['id'],
                                'title' => $item['name'],
                                'year' => $yearName,
                                'createdDateTime' => $item['createdDateTime'],
                                'lastModifiedDateTime' => $item['lastModifiedDateTime'],
                                'thumbnail' => $thumbnail
                            ];
                        }, $articleFolders);

                        $articles = array_merge($articles, $yearArticles);
                    } catch (Exception $e) {
                        error_log("Failed to access news year folder {$yearName}: " . $e->getMessage());
                        continue;
                    }
                }
            } catch (Exception $e) {
                error_log('Failed to access news folder: ' . $e->getMessage());
                $articles = [];
            }
        }

        return $articles;
    }

    /**
     * Get thumbnail URL for a specific article
     * Looks for thumbnail.jpg in the article folder
     */
    private function getArticleThumbnailUrl(string $articleFolderId): ?string {
        $siteId = $this->graphAPI->getSiteId();

        try {
            // List contents of the article folder to find thumbnail.jpg
            $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$articleFolderId}/children?\$select=id,name,file";
            $folderData = $this->graphAPI->callAPI($folderUrl);

            // Find thumbnail.jpg file
            $thumbnailFile = null;
            foreach ($folderData['value'] as $item) {
                if (isset($item['file']) && strtolower($item['name']) === 'thumbnail.jpg') {
                    $thumbnailFile = $item;
                    break;
                }
            }

            if (!$thumbnailFile) {
                return null; // No thumbnail found
            }

            // Get the download URL for the thumbnail
            $thumbnailId = $thumbnailFile['id'];
            $metadataUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$thumbnailId}?\$select=@microsoft.graph.downloadUrl";
            $metadata = $this->graphAPI->callAPI($metadataUrl);

            return $metadata['@microsoft.graph.downloadUrl'] ?? null;

        } catch (Exception $e) {
            error_log("Failed to get thumbnail for article {$articleName} in {$year}: " . $e->getMessage());
            return null;
        }
    }

    public function getArticle(string $title, string $year): ?array {
        $siteId = $this->graphAPI->getSiteId();

        error_log("DEBUG: Looking for article '{$title}' in year {$year}");

        // First, find the correct article folder name by listing all articles in the year
        $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$year}:/children?\$select=id,name,folder";

        try {
            $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);
            error_log("DEBUG: Found " . count($yearFolderData['value']) . " items in year folder");

            // Debug: log all folder names
            foreach ($yearFolderData['value'] as $item) {
                if (isset($item['folder'])) {
                    error_log("DEBUG: Available folder: '{$item['name']}'");
                }
            }

            // Find the folder with the matching name (case-insensitive comparison)
            $articleFolder = null;
            foreach ($yearFolderData['value'] as $item) {
                if (isset($item['folder'])) {
                    error_log("DEBUG: Comparing '{$item['name']}' with '{$title}'");
                    // Try exact match first
                    if ($item['name'] === $title) {
                        $articleFolder = $item;
                        error_log("DEBUG: Exact match found");
                        break;
                    }
                    // Fallback to case-insensitive match
                    if (strtolower($item['name']) === strtolower($title)) {
                        $articleFolder = $item;
                        error_log("DEBUG: Case-insensitive match found");
                        break;
                    }
                }
            }

            if (!$articleFolder) {
                error_log("DEBUG: Article folder not found for title: {$title} in year: {$year}");
                return null;
            }

            $articleFolderId = $articleFolder['id'];

            // Now fetch the contents of the correct article folder
            $articleFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$articleFolderId}/children?\$select=id,name,file,mimeType,size,createdDateTime,lastModifiedDateTime,@microsoft.graph.downloadUrl";
            $articleFolderData = $this->graphAPI->callAPI($articleFolderUrl);

            error_log("DEBUG: Found " . count($articleFolderData['value']) . " items in article folder");

            $markdownFile = null;
            $images = [];

            foreach ($articleFolderData['value'] as $item) {
                if (isset($item['file'])) {
                    $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? null;
                    error_log("DEBUG: File found: {$item['name']} (type: {$mimeType})");
                    if ($this->isMarkdownFile($item)) {
                        $markdownFile = $item;
                        error_log("DEBUG: Markdown file found: {$item['name']}");
                    } elseif ($this->isImageFile($item)) {
                        $images[] = $item;
                        error_log("DEBUG: Image file found: {$item['name']}");
                    }
                }
            }

            if ($markdownFile) {
                // Use the same approach as image fetching - get content via Graph API
                $markdownId = $markdownFile['id'];
                error_log("DEBUG: Fetching markdown content for item ID: {$markdownId}");

                try {
                    $siteId = $this->graphAPI->getSiteId();
                    $contentUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$markdownId}/content";

                    // Use curl with redirect following (same fix as Gallery module)
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $contentUrl);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return data as string
                    curl_setopt($ch, CURLOPT_HEADER, false); // Don't include headers in response
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Follow redirects
                    curl_setopt($ch, CURLOPT_MAXREDIRS, 5); // Max 5 redirects
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'Authorization: Bearer ' . $this->graphAPI->getAccessToken()
                    ]);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

                    $markdownContent = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    $redirectCount = curl_getinfo($ch, CURLINFO_REDIRECT_COUNT);
                    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
                    $error = curl_error($ch);
                    curl_close($ch);

                    error_log("DEBUG: Content fetch HTTP code: {$httpCode}, Redirects: {$redirectCount}, Final URL: {$effectiveUrl}, Error: {$error}");

                    if ($httpCode >= 200 && $httpCode < 300 && $markdownContent !== false) {
                        error_log("DEBUG: Successfully fetched markdown content (" . strlen($markdownContent) . " characters)");
                        return [
                            'id' => $markdownFile['id'],
                            'title' => $articleFolder['name'],
                            'year' => $year,
                            'content' => $markdownContent,
                            'createdDateTime' => $markdownFile['createdDateTime'],
                            'lastModifiedDateTime' => $markdownFile['lastModifiedDateTime'],
                            'images' => $images
                        ];
                    } else {
                        $responseBody = substr($markdownContent ?: '', 0, 500);
                        error_log("ERROR: Failed to fetch markdown content - HTTP {$httpCode}, Redirects: {$redirectCount}, Final URL: {$effectiveUrl}, Error: {$error}, Response: {$responseBody}");

                        // Special handling for auth redirects
                        if ($redirectCount > 0 && strpos($effectiveUrl, 'login.microsoftonline.com') !== false) {
                            error_log("ERROR: Authentication issue detected - redirecting to login instead of download URL");
                        }

                        // Warn if too many redirects
                        if ($redirectCount >= 5) {
                            error_log("WARNING: Maximum redirects reached ({$redirectCount}) for markdown item {$markdownId}");
                        }
                    }
                } catch (Exception $e) {
                    error_log("DEBUG: Exception fetching markdown content: " . $e->getMessage());
                }
            } else {
                error_log("DEBUG: No markdown file found in article folder: {$articleFolder['name']}");
            }
        } catch (Exception $e) {
            error_log("DEBUG: Exception in getArticle: " . $e->getMessage());
        }

        return null;
    }

    public function getArticleExcerpt(string $year, string $articleName): ?string {
        $article = $this->getArticle($articleName, $year);

        if (!$article || empty($article['content'])) {
            return null;
        }

        return $this->createExcerptFromMarkdown($article['content']);
    }

    // Debug method to check if news folder exists
    public function debugNewsStructure(): array {
        $siteId = $this->graphAPI->getSiteId();

        try {
            // Check if news folder exists
            $newsFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH;
            $newsFolderData = $this->graphAPI->callAPI($newsFolderUrl);

            $result = [
                'news_folder_exists' => true,
                'news_folder_id' => $newsFolderData['id'] ?? null
            ];

            // Check years
            $yearsUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . ":/children?\$select=id,name,folder";
            $yearsData = $this->graphAPI->callAPI($yearsUrl);

            $result['years'] = array_map(function($item) {
                return [
                    'name' => $item['name'],
                    'id' => $item['id'],
                    'is_folder' => isset($item['folder'])
                ];
            }, $yearsData['value']);

            // Check first year if exists
            if (count($result['years']) > 0) {
                $firstYear = $result['years'][0]['name'];
                $articlesUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$firstYear}:/children?\$select=id,name,folder";
                $articlesData = $this->graphAPI->callAPI($articlesUrl);

                $result['sample_year'] = $firstYear;
                $result['articles_in_year'] = array_map(function($item) {
                    return [
                        'name' => $item['name'],
                        'id' => $item['id'],
                        'is_folder' => isset($item['folder'])
                    ];
                }, $articlesData['value']);
            }

            return $result;
        } catch (Exception $e) {
            return [
                'error' => $e->getMessage(),
                'news_path' => Config::NEWS_PATH
            ];
        }
    }

    private function isMarkdownFile(array $item): bool {
        $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? '';
        return strpos($mimeType, 'text/markdown') !== false ||
                pathinfo($item['name'], PATHINFO_EXTENSION) === 'md';
    }

    private function isImageFile(array $item): bool {
        $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? '';
        return strpos($mimeType, 'image/') === 0;
    }

    private function fetchFileContent(string $url): string {
        return file_get_contents($url);
    }

    private function createExcerptFromMarkdown(string $markdown, int $maxLength = 220): string {
        // odstranit obrázky ![alt](url)
        $text = preg_replace('/!\[.*?\]\(.*?\)/', '', $markdown);

        // odkazy [text](url) -> jen "text"
        $text = preg_replace('/\[([^\]]+)\]\([^)]+\)/', '$1', $text);

        // základní markdown znaky pryč
        $text = preg_replace('/[#*_>`-]+/', ' ', $text);

        // sjednotit whitespace
        $text = trim(preg_replace('/\s+/', ' ', $text));

        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $short = mb_substr($text, 0, $maxLength);

        // ustřihnout na poslední mezeře, ať to neřezne uprostřed slova
        $lastSpace = mb_strrpos($short, ' ');
        if ($lastSpace !== false) {
            $short = mb_substr($short, 0, $lastSpace);
        }

        return $short . '…';
    }

}
?>