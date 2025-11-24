<?php
// VSTJ Technika Jachting Web - Authentication Class

class Auth
{
    private string $clientId;
    private string $tenantId;
    private string $clientSecret;

    public function __construct()
    {
        $this->clientId = getenv('CLIENT_ID');
        $this->tenantId = getenv('TENANT_ID');
        $this->clientSecret = getenv('CLIENT_SECRET');

        if (!$this->clientId || !$this->tenantId || !$this->clientSecret) {
            throw new Exception('Missing required environment variables: CLIENT_ID, TENANT_ID, CLIENT_SECRET');
        }
    }

    public function getAccessToken(): string
    {
        return $this->getCachedAccessToken();
    }

    private function getCachedAccessToken(): string
    {
        $cacheFile = sys_get_temp_dir() . '/msal_token_cache.enc';
        $encryptionKey = hash('sha256', $this->clientSecret . $this->tenantId);

        // Check for valid cached token
        if (file_exists($cacheFile)) {
            try {
                $encrypted = @file_get_contents($cacheFile);
                if ($encrypted === false) {
                    goto get_new_token;
                }

                $decrypted = $this->decryptToken($encrypted, $encryptionKey);
                if ($decrypted === false) {
                    goto get_new_token;
                }

                $cache = json_decode($decrypted, true);
                if ($cache && isset($cache['expires']) && time() < $cache['expires']) {
                    return $cache['token'];
                }
            } catch (Exception $e) {
                // Continue to get new token
                goto get_new_token;
            }
        }

        get_new_token:
        return $this->fetchNewToken($cacheFile, $encryptionKey);
    }

    private function fetchNewToken(string $cacheFile, string $encryptionKey): string
    {
        $tokenUrl = "https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token";

        $postData = http_build_query([
            'client_id' => $this->clientId,
            'scope' => 'https://graph.microsoft.com/.default',
            'client_secret' => $this->clientSecret,
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

        // Encrypt and cache token
        try {
            $cacheData = json_encode([
                'token' => $token,
                'expires' => time() + Config::TOKEN_CACHE_TIME
            ]);

            $encryptedCache = $this->encryptToken($cacheData, $encryptionKey);
            file_put_contents($cacheFile, $encryptedCache);
            chmod($cacheFile, 0600);
        } catch (Exception $e) {
            error_log('Token caching failed: ' . $e->getMessage());
        }

        return $token;
    }

    private function encryptToken(string $data, string $key): string
    {
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    private function decryptToken(string $encryptedData, string $key): string
    {
        $data = base64_decode($encryptedData);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
}
