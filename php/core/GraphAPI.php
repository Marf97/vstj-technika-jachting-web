<?php
// VSTJ Technika Jachting Web - Graph API Class

class GraphAPI {
    private Auth $auth;
    private ?string $siteId = null;
    private string $siteHost;
    private string $sitePath;

    public function __construct(Auth $auth) {
        $this->auth = $auth;
        $this->siteHost = Config::SITE_HOST;
        $this->sitePath = Config::SITE_PATH;
    }

    public function callAPI(string $url): array {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'Authorization: Bearer ' . $this->auth->getAccessToken(),
                'timeout' => 30
            ]
        ]);

        $response = file_get_contents($url, false, $context);

        if ($response === false) {
            throw new Exception('Failed to call Graph API');
        }

        return json_decode($response, true);
    }

    public function getAccessToken(): string {
        return $this->auth->getAccessToken();
    }

    public function getSiteId(): string {
        if ($this->siteId !== null) {
            return $this->siteId;
        }

        // Check for valid cached site ID
        $siteCacheFile = sys_get_temp_dir() . '/site_id_cache_' . md5($this->siteHost . $this->sitePath) . '.json';

        if (file_exists($siteCacheFile)) {
            $cacheContent = @file_get_contents($siteCacheFile);
            if ($cacheContent !== false) {
                $cache = json_decode($cacheContent, true);
                if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                    $this->siteId = $cache['siteId'];
                    return $this->siteId;
                }
            }
        }

        // Get fresh site ID
        $siteUrl = "https://graph.microsoft.com/v1.0/sites/{$this->siteHost}:/{$this->sitePath}";
        $siteData = $this->callAPI($siteUrl);
        $this->siteId = $siteData['id'];

        // Cache site ID
        $cacheData = json_encode([
            'siteId' => $this->siteId,
            'expires' => time() + Config::SITE_ID_CACHE_TIME
        ]);
        @file_put_contents($siteCacheFile, $cacheData);
        @chmod($siteCacheFile, 0600);

        return $this->siteId;
    }
}
?>