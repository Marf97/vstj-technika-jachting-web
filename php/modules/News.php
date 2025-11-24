<?php
// VSTJ Technika Jachting Web - News Module

class News
{
    private GraphAPI $graphAPI;
    private bool $lastCacheHit = false;

    public function __construct(GraphAPI $graphAPI)
    {
        $this->graphAPI = $graphAPI;
    }

    /**
     * Check if cached articles exist and are still valid
     * @param string|null $year Year filter or null for all articles
     * @return array|null Cached articles or null if cache miss
     */
    private function getCachedArticles(?string $year): ?array
    {
        // Cache version - increment this when data structure changes
        $cacheVersion = 'v2';
        $cacheKey = $year ?? 'all';
        $cacheFile = sys_get_temp_dir() . '/news_cache_' . $cacheVersion . '_' . $cacheKey . '_' . md5($cacheKey) . '.json';

        if (!file_exists($cacheFile)) {
            return null;
        }

        $cacheData = json_decode(@file_get_contents($cacheFile), true);
        if (!$cacheData || !isset($cacheData['expires']) || !isset($cacheData['articles'])) {
            return null;
        }

        // Check if cache has expired
        if (time() >= $cacheData['expires']) {
            return null;
        }

        return $cacheData['articles'];
    }

    /**
     * Cache articles list with expiry timestamp
     * @param string|null $year Year filter or null for all articles
     * @param array $articles Articles array to cache
     */
    private function cacheArticles(?string $year, array $articles): void
    {
        // Cache version - increment this when data structure changes
        $cacheVersion = 'v2';
        $cacheKey = $year ?? 'all';
        $cacheFile = sys_get_temp_dir() . '/news_cache_' . $cacheVersion . '_' . $cacheKey . '_' . md5($cacheKey) . '.json';

        $cacheData = [
            'expires' => time() + Config::NEWS_CACHE_TIME,
            'cached_at' => time(),
            'articles' => $articles
        ];

        @file_put_contents($cacheFile, json_encode($cacheData));
        @chmod($cacheFile, 0600);
    }

    /**
     * Get cache hit status from last getArticles() call
     * @return bool True if last call was a cache hit
     */
    public function wasLastCacheHit(): bool
    {
        return $this->lastCacheHit;
    }

    public function getAvailableYears(): array
    {
        $siteId = $this->graphAPI->getSiteId();
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . ":/children?\$select=id,name,folder";

        try {
            $folderData = $this->graphAPI->callAPI($folderUrl);

            // Filter for year folders (numeric names like 2025, 2024, etc.)
            $yearFolders = array_filter($folderData['value'], function ($item) {
                return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
            });

            // Sort years descending (newest first)
            usort($yearFolders, function ($a, $b) {
                return intval($b['name']) - intval($a['name']);
            });

            return array_map(function ($item) {
                return $item['name'];
            }, $yearFolders);
        } catch (Exception $e) {
            return [];
        }
    }

    public function getArticles(?string $year): array
    {
        // Check cache first
        $cachedArticles = $this->getCachedArticles($year);
        if ($cachedArticles !== null) {
            $this->lastCacheHit = true;
            return $cachedArticles;
        }

        // Cache miss - fetch from SharePoint
        $this->lastCacheHit = false;
        $siteId = $this->graphAPI->getSiteId();
        $articles = [];

        if ($year) {
            // List articles for specific year
            $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$year}:/children?\$select=id,name,folder,file,createdDateTime,lastModifiedDateTime";

            try {
                $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);

                // Filter for folders (each article is a folder containing markdown and images)
                $articleFolders = array_filter($yearFolderData['value'], function ($item) {
                    return isset($item['folder']);
                });

                // Sort articles by creation date descending (newest first)
                usort($articleFolders, function ($a, $b) {
                    $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                    $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                    return $bTime - $aTime;
                });

                // Batch fetch thumbnails and excerpts for all articles
                $enrichedData = $this->batchFetchArticleData($articleFolders);

                $articles = array_map(function ($item) use ($year, $enrichedData) {
                    $articleId = $item['id'];
                    return [
                        'id' => $articleId,
                        'title' => $item['name'],
                        'year' => $year,
                        'createdDateTime' => $item['createdDateTime'],
                        'lastModifiedDateTime' => $item['lastModifiedDateTime'],
                        'thumbnail' => $enrichedData[$articleId]['thumbnail'] ?? null,
                        'excerpt' => $enrichedData[$articleId]['excerpt'] ?? null
                    ];
                }, $articleFolders);
            } catch (Exception $e) {
                $articles = [];
            }
        } else {
            // List all articles across all years
            $newsFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . ":/children?\$select=id,name,folder";

            try {
                $newsFolderData = $this->graphAPI->callAPI($newsFolderUrl);

                // Get year folders
                $yearFolders = array_filter($newsFolderData['value'], function ($item) {
                    return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
                });

                // Sort years descending
                usort($yearFolders, function ($a, $b) {
                    return intval($b['name']) - intval($a['name']);
                });

                // Collect all article folders from all years
                $allArticleFolders = [];
                foreach ($yearFolders as $yearFolder) {
                    $yearName = $yearFolder['name'];
                    $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$yearName}:/children?\$select=id,name,folder,createdDateTime,lastModifiedDateTime";

                    try {
                        $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);

                        $articleFolders = array_filter($yearFolderData['value'], function ($item) {
                            return isset($item['folder']);
                        });

                        // Sort articles within year
                        usort($articleFolders, function ($a, $b) {
                            $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                            $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                            return $bTime - $aTime;
                        });

                        // Add year info to each article folder
                        foreach ($articleFolders as &$folder) {
                            $folder['_year'] = $yearName;
                        }

                        $allArticleFolders = array_merge($allArticleFolders, $articleFolders);
                    } catch (Exception $e) {
                        continue;
                    }
                }

                // Batch fetch thumbnails and excerpts for all articles
                $enrichedData = $this->batchFetchArticleData($allArticleFolders);

                $articles = array_map(function ($item) use ($enrichedData) {
                    $articleId = $item['id'];
                    $yearName = $item['_year'];
                    return [
                        'id' => $articleId,
                        'title' => $item['name'],
                        'year' => $yearName,
                        'createdDateTime' => $item['createdDateTime'],
                        'lastModifiedDateTime' => $item['lastModifiedDateTime'],
                        'thumbnail' => $enrichedData[$articleId]['thumbnail'] ?? null,
                        'excerpt' => $enrichedData[$articleId]['excerpt'] ?? null
                    ];
                }, $allArticleFolders);
            } catch (Exception $e) {
                $articles = [];
            }
        }

        // Cache the results before returning
        $this->cacheArticles($year, $articles);

        return $articles;
    }

    /**
     * Batch fetch thumbnails and excerpts for multiple articles in parallel
     * @param array $articleFolders Array of article folder items
     * @return array Associative array with article IDs as keys and data (thumbnail, excerpt) as values
     */
    private function batchFetchArticleData(array $articleFolders): array
    {
        if (empty($articleFolders)) {
            return [];
        }

        $siteId = $this->graphAPI->getSiteId();
        $accessToken = $this->graphAPI->getAccessToken();

        // Initialize curl multi handle for parallel requests
        $multiHandle = curl_multi_init();
        $curlHandles = [];
        $articleIdMap = [];

        // Create curl handles for each article folder's children endpoint
        foreach ($articleFolders as $folder) {
            $articleId = $folder['id'];
            $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$articleId}/children?\$select=id,name,file,mimeType";

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $folderUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            curl_multi_add_handle($multiHandle, $ch);
            $curlHandles[(int)$ch] = $ch;
            $articleIdMap[(int)$ch] = $articleId;
        }

        // Execute all requests in parallel
        $running = null;
        do {
            curl_multi_exec($multiHandle, $running);
            curl_multi_select($multiHandle);
        } while ($running > 0);

        // Collect results and prepare for second batch (thumbnail URLs and markdown content)
        $folderContents = [];
        foreach ($curlHandles as $handleId => $ch) {
            $response = curl_multi_getcontent($ch);
            $articleId = $articleIdMap[$handleId];

            if ($response !== false) {
                $data = json_decode($response, true);
                if ($data && isset($data['value'])) {
                    $folderContents[$articleId] = $data['value'];
                }
            }

            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
        }
        curl_multi_close($multiHandle);

        // Now batch fetch thumbnail URLs and markdown content
        $multiHandle = curl_multi_init();
        $curlHandles = [];
        $requestMap = [];

        foreach ($folderContents as $articleId => $items) {
            $thumbnailFileId = null;
            $markdownFileId = null;

            // Find thumbnail.jpg and .md file
            foreach ($items as $item) {
                if (isset($item['file'])) {
                    if (strtolower($item['name']) === 'thumbnail.jpg') {
                        $thumbnailFileId = $item['id'];
                    } elseif ($this->isMarkdownFile($item)) {
                        $markdownFileId = $item['id'];
                    }
                }
            }

            // Add thumbnail URL request
            if ($thumbnailFileId) {
                $thumbnailUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$thumbnailFileId}?\$select=@microsoft.graph.downloadUrl";

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $thumbnailUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $accessToken
                ]);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);

                curl_multi_add_handle($multiHandle, $ch);
                $curlHandles[(int)$ch] = $ch;
                $requestMap[(int)$ch] = ['type' => 'thumbnail', 'articleId' => $articleId];
            }

            // Add markdown content request
            if ($markdownFileId) {
                $contentUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$markdownFileId}/content";

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $contentUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HEADER, false);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $accessToken
                ]);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);

                curl_multi_add_handle($multiHandle, $ch);
                $curlHandles[(int)$ch] = $ch;
                $requestMap[(int)$ch] = ['type' => 'markdown', 'articleId' => $articleId];
            }
        }

        // Execute all thumbnail and markdown requests in parallel
        $running = null;
        do {
            curl_multi_exec($multiHandle, $running);
            curl_multi_select($multiHandle);
        } while ($running > 0);

        // Collect final results
        $enrichedData = [];
        foreach ($curlHandles as $handleId => $ch) {
            $response = curl_multi_getcontent($ch);
            $requestInfo = $requestMap[$handleId];
            $articleId = $requestInfo['articleId'];

            if (!isset($enrichedData[$articleId])) {
                $enrichedData[$articleId] = ['thumbnail' => null, 'excerpt' => null];
            }

            if ($response !== false) {
                if ($requestInfo['type'] === 'thumbnail') {
                    $data = json_decode($response, true);
                    if ($data && isset($data['@microsoft.graph.downloadUrl'])) {
                        $enrichedData[$articleId]['thumbnail'] = $data['@microsoft.graph.downloadUrl'];
                    }
                } elseif ($requestInfo['type'] === 'markdown') {
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    if ($httpCode >= 200 && $httpCode < 300) {
                        $enrichedData[$articleId]['excerpt'] = $this->createExcerptFromMarkdown($response);
                    }
                }
            }

            curl_multi_remove_handle($multiHandle, $ch);
            curl_close($ch);
        }
        curl_multi_close($multiHandle);

        return $enrichedData;
    }

    /**
     * Get thumbnail URL for a specific article
     * Looks for thumbnail.jpg in the article folder
     */
    private function getArticleThumbnailUrl(string $articleFolderId): ?string
    {
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
            return null;
        }
    }

    public function getArticle(string $title, string $year): ?array
    {
        $siteId = $this->graphAPI->getSiteId();


        // First, find the correct article folder name by listing all articles in the year
        $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::NEWS_PATH . "/{$year}:/children?\$select=id,name,folder";

        try {
            $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);

            // Debug: log all folder names
            foreach ($yearFolderData['value'] as $item) {
                if (isset($item['folder'])) {
                }
            }

            // Find the folder with the matching name (case-insensitive comparison)
            $articleFolder = null;
            foreach ($yearFolderData['value'] as $item) {
                if (isset($item['folder'])) {
                    // Try exact match first
                    if ($item['name'] === $title) {
                        $articleFolder = $item;
                        break;
                    }
                    // Fallback to case-insensitive match
                    if (strtolower($item['name']) === strtolower($title)) {
                        $articleFolder = $item;
                        break;
                    }
                }
            }

            if (!$articleFolder) {
                return null;
            }

            $articleFolderId = $articleFolder['id'];

            // Now fetch the contents of the correct article folder
            $articleFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$articleFolderId}/children?\$select=id,name,file,mimeType,size,createdDateTime,lastModifiedDateTime,@microsoft.graph.downloadUrl";
            $articleFolderData = $this->graphAPI->callAPI($articleFolderUrl);


            $markdownFile = null;
            $images = [];

            foreach ($articleFolderData['value'] as $item) {
                if (isset($item['file'])) {
                    $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? null;
                    if ($this->isMarkdownFile($item)) {
                        $markdownFile = $item;
                    } elseif ($this->isImageFile($item)) {
                        $images[] = $item;
                    }
                }
            }

            if ($markdownFile) {
                // Use the same approach as image fetching - get content via Graph API
                $markdownId = $markdownFile['id'];

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


                    if ($httpCode >= 200 && $httpCode < 300 && $markdownContent !== false) {
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

                        // Special handling for auth redirects
                        if ($redirectCount > 0 && strpos($effectiveUrl, 'login.microsoftonline.com') !== false) {
                        }

                        // Warn if too many redirects
                        if ($redirectCount >= 5) {
                        }
                    }
                } catch (Exception $e) {
                }
            } else {
            }
        } catch (Exception $e) {
        }

        return null;
    }

    public function getArticleExcerpt(string $year, string $articleName): ?string
    {
        $article = $this->getArticle($articleName, $year);

        if (!$article || empty($article['content'])) {
            return null;
        }

        return $this->createExcerptFromMarkdown($article['content']);
    }

    // Debug method to check if news folder exists
    public function debugNewsStructure(): array
    {
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

            $result['years'] = array_map(function ($item) {
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
                $result['articles_in_year'] = array_map(function ($item) {
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

    private function isMarkdownFile(array $item): bool
    {
        $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? '';
        return strpos($mimeType, 'text/markdown') !== false ||
            pathinfo($item['name'], PATHINFO_EXTENSION) === 'md';
    }

    private function isImageFile(array $item): bool
    {
        $mimeType = $item['file']['mimeType'] ?? $item['mimeType'] ?? '';
        return strpos($mimeType, 'image/') === 0;
    }

    private function fetchFileContent(string $url): string
    {
        return file_get_contents($url);
    }

    private function createExcerptFromMarkdown(string $markdown, int $maxLength = 220): string
    {
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
