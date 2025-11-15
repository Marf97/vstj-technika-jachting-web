<?php
// VSTJ Technika Jachting Web - Gallery Module

/**
 * POST-MORTEM: Image Loading Fix (November 2025)
 *
 * Issue: Gallery failed to load full-size images - frontend received HTTP 302 redirects instead of image bytes
 *
 * Root Cause: PHP cURL requests to Microsoft Graph API /content endpoint were not following redirects.
 * Microsoft intentionally returns 302 redirects to pre-authenticated SharePoint/OneDrive download URLs.
 *
 * Detection: Users reported broken full-size images; devtools showed 302 instead of 200 image response.
 *
 * Fix: Enabled redirect following in PHP cURL when calling /content endpoints.
 * - Added CURLOPT_FOLLOWLOCATION = true
 * - Added CURLOPT_MAXREDIRS = 5
 * - Added CURLOPT_RETURNTRANSFER = true
 * - Added CURLOPT_HEADER = false
 * - Enhanced error logging for auth issues (redirects to login.microsoftonline.com)
 *
 * Prevention: Whenever using /content with Graph/SharePoint, always either:
 * (a) Follow redirects server-side (current implementation)
 * (b) Prefer @microsoft.graph.downloadUrl for direct frontend use (alternative commented code available)
 *
 * Alternative Approach Available: Uncomment the block in getImageContent() to return @microsoft.graph.downloadUrl
 * directly to frontend, eliminating server-side proxying entirely.
 */

class Gallery {
    private GraphAPI $graphAPI;

    public function __construct(GraphAPI $graphAPI) {
        $this->graphAPI = $graphAPI;
    }

    public function getAvailableYears(): array {
        $siteId = $this->graphAPI->getSiteId();
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::GALLERY_PATH . ":/children?\$select=id,name,folder";

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
    }

    public function getImages(?string $year, int $top, int $skip): array {
        $siteId = $this->graphAPI->getSiteId();
        $allImages = $this->collectImages($year);

        // Apply pagination
        $paginatedImages = array_slice($allImages, $skip, $top ?: null);

        return [
            'images' => array_values($paginatedImages),
            'total' => count($allImages),
            'hasMore' => ($skip + count($paginatedImages)) < count($allImages),
            'year' => $year
        ];
    }

    private function collectImages(?string $year): array {
        $siteId = $this->graphAPI->getSiteId();
        $allImages = [];

        if ($year) {
            // Year-specific fetching
            $yearFolderPath = Config::GALLERY_PATH . '/' . $year;
            $encodedYearFolderPath = urlencode($yearFolderPath);
            $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedYearFolderPath}:/children?\$select=id,name,createdDateTime,lastModifiedDateTime,webUrl,file,folder&\$expand=thumbnails";

            try {
                $folderData = $this->graphAPI->callAPI($folderUrl);
                $images = $this->filterImages($folderData['value']);

                // Sort images by creation date descending
                usort($images, function($a, $b) {
                    $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                    $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                    return $bTime - $aTime;
                });

                $allImages = $images;
            } catch (Exception $e) {
                $allImages = [];
            }
        } else {
            // Default browsing - collect from all year folders
            $yearFolders = $this->getYearFolders();

            foreach ($yearFolders as $yearFolder) {
                $yearName = $yearFolder['name'];
                $yearFolderPath = Config::GALLERY_PATH . '/' . $yearName;
                $encodedYearFolderPath = urlencode($yearFolderPath);
                $yearFolderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/{$encodedYearFolderPath}:/children?\$select=id,name,createdDateTime,lastModifiedDateTime,webUrl,file,folder&\$expand=thumbnails";

                try {
                    $yearFolderData = $this->graphAPI->callAPI($yearFolderUrl);
                    $images = $this->filterImages($yearFolderData['value']);

                    // Sort images within year and add year metadata
                    usort($images, function($a, $b) {
                        $aTime = isset($a['createdDateTime']) ? strtotime($a['createdDateTime']) : 0;
                        $bTime = isset($b['createdDateTime']) ? strtotime($b['createdDateTime']) : 0;
                        return $bTime - $aTime;
                    });

                    foreach ($images as &$item) {
                        $item['_year'] = $yearName;
                    }

                    $allImages = array_merge($allImages, $images);
                } catch (Exception $e) {
                    error_log("Failed to access gallery year folder {$yearName}: " . $e->getMessage());
                    continue;
                }
            }
        }

        return $allImages;
    }

    private function getYearFolders(): array {
        $siteId = $this->graphAPI->getSiteId();
        $folderUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/root:/" . Config::GALLERY_PATH . ":/children?\$select=id,name,folder";

        $folderData = $this->graphAPI->callAPI($folderUrl);

        $yearFolders = array_filter($folderData['value'], function($item) {
            return isset($item['folder']) && is_numeric($item['name']) && strlen($item['name']) === 4;
        });

        usort($yearFolders, function($a, $b) {
            return intval($b['name']) - intval($a['name']);
        });

        return $yearFolders;
    }

    private function filterImages(array $items): array {
        return array_filter($items, function($item) {
            return isset($item['file']) &&
                   isset($item['file']['mimeType']) &&
                   strpos($item['file']['mimeType'], 'image/') === 0;
        });
    }

    public function getImageContent(string $itemId): array {
        error_log("DEBUG: Gallery.getImageContent called for item: {$itemId}");

        $siteId = $this->graphAPI->getSiteId();

        // Check for cached image (cache for 1 hour)
        $imageCacheFile = sys_get_temp_dir() . '/image_cache_' . md5($itemId) . '.json';
        if (file_exists($imageCacheFile)) {
            $cacheData = json_decode(@file_get_contents($imageCacheFile), true);
            if ($cacheData && isset($cacheData['expires']) && time() < $cacheData['expires']) {
                error_log("DEBUG: Returning cached image data (" . strlen($cacheData['data']) . " bytes, MIME: {$cacheData['mimeType']})");
                return $cacheData;
            }
        }

        // Alternative: Return @microsoft.graph.downloadUrl for direct frontend use
        // Uncomment to use this simpler approach (fewer server-side redirects)
        /*
        $metadataUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$itemId}?\$select=id,name,@microsoft.graph.downloadUrl,file";
        $metadata = $this->graphAPI->callAPI($metadataUrl);
        if (isset($metadata['@microsoft.graph.downloadUrl'])) {
            return [
                'data' => null, // No server-side download needed
                'mimeType' => $metadata['file']['mimeType'] ?? 'image/jpeg',
                'downloadUrl' => $metadata['@microsoft.graph.downloadUrl'] // Frontend can use this directly
            ];
        }
        */

        // First, try to get the download URL from metadata (more robust)
        $metadataUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$itemId}?\$select=id,name,@microsoft.graph.downloadUrl,file";
        try {
            $metadata = $this->graphAPI->callAPI($metadataUrl);
            error_log("DEBUG: Metadata response: " . json_encode($metadata));
            $downloadUrl = $metadata['@microsoft.graph.downloadUrl'] ?? null;
            $mimeType = $metadata['file']['mimeType'] ?? 'image/jpeg';
            if (!$downloadUrl) {
                error_log("DEBUG: No download URL in metadata, falling back to /content");
                $downloadUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$itemId}/content";
            }
            error_log("DEBUG: Using download URL: {$downloadUrl}, MIME: {$mimeType}");
        } catch (Exception $e) {
            error_log("DEBUG: Failed to get metadata, falling back to /content: " . $e->getMessage());
            $downloadUrl = "https://graph.microsoft.com/v1.0/sites/{$siteId}/drive/items/{$itemId}/content";
            $mimeType = 'image/jpeg'; // fallback
            error_log("DEBUG: Using fallback content URL: {$downloadUrl}, MIME: {$mimeType}");
        }

        error_log("DEBUG: Fetching image from: {$downloadUrl}");

        // Fetch image content using curl with redirect following
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $downloadUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return data as string
        curl_setopt($ch, CURLOPT_HEADER, false); // Don't include headers in response
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Follow redirects
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5); // Max 5 redirects
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->graphAPI->getAccessToken()
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $redirectCount = curl_getinfo($ch, CURLINFO_REDIRECT_COUNT);
        $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        $error = curl_error($ch);

        curl_close($ch);

        error_log("DEBUG: HTTP Code: {$httpCode}, Content-Type: {$contentType}, Redirects: {$redirectCount}, Effective URL: {$effectiveUrl}, Error: {$error}");
        error_log("DEBUG: Response size: " . ($imageData ? strlen($imageData) : 'null') . " bytes");

        if ($httpCode < 200 || $httpCode >= 300 || $imageData === false) {
            $responseBody = substr($imageData ?: '', 0, 500); // Log first 500 chars of response if available
            error_log("ERROR: Image fetch failed - HTTP {$httpCode}, Redirects: {$redirectCount}, Final URL: {$effectiveUrl}, Error: {$error}, Response: {$responseBody}");

            // Special handling for auth redirects (redirect to login instead of download)
            if ($redirectCount > 0 && strpos($effectiveUrl, 'login.microsoftonline.com') !== false) {
                error_log("ERROR: Authentication issue detected - redirecting to login instead of download URL");
            }

            throw new Exception("Failed to fetch image content: HTTP {$httpCode}, Error: {$error}");
        }

        // Use actual Content-Type if available
        if ($contentType) {
            $mimeType = $contentType;
        }

        $result = [
            'data' => $imageData,
            'mimeType' => $mimeType
        ];

        error_log("DEBUG: Successfully fetched image, MIME: {$mimeType}, caching for 1 hour");

        // Cache the result (data and mimeType) for 1 hour
        $cacheData = $result;
        $cacheData['expires'] = time() + 3600;
        @file_put_contents($imageCacheFile, json_encode($cacheData));
        @chmod($imageCacheFile, 0600);

        return $result;
    }
}