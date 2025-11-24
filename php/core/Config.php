<?php
// VSTJ Technika Jachting Web - Configuration Class

class Config
{
    // Site configuration
    public const SITE_HOST = 'technikapraha.sharepoint.com';
    public const SITE_PATH = 'sites/jachting';

    // Content paths
    public const GALLERY_PATH = 'verejne/fotky-verejne';
    public const NEWS_PATH = 'verejne/novinky-verejne';

    // Cache settings
    public const TOKEN_CACHE_TIME = 3000; // 50 minutes
    public const SITE_ID_CACHE_TIME = 86400; // 24 hours
    public const GALLERY_CACHE_TIME = 600; // 10 minutes
    public const NEWS_CACHE_TIME = 600; // 10 minutes

    // Pagination defaults
    public const DEFAULT_PAGE_SIZE = 20;
    public const LOAD_MORE_SIZE = 10;

    // Environment-based configuration
    private static $envLoaded = false;
    private static $allowedOrigins = null;

    /**
     * Load environment configuration
     * Tries to load .env.php or falls back to .env.php.development
     */
    private static function loadEnv()
    {
        if (self::$envLoaded) {
            return;
        }

        $rootDir = dirname(__DIR__, 2); // Go up two levels from php/core to project root

        // Try to load .env.php first (for deployment)
        $envFile = $rootDir . '/.env.php';
        if (!file_exists($envFile)) {
            // Fall back to development environment
            $envFile = $rootDir . '/.env.php.development';
        }

        if (file_exists($envFile)) {
            // Load the PHP file which returns an array
            $config = require $envFile;

            if (is_array($config)) {
                // Store each config value in environment
                foreach ($config as $key => $value) {
                    putenv("$key=$value");
                }
            }
        }

        self::$envLoaded = true;
    }

    /**
     * Get allowed CORS origins from environment
     * @return array
     */
    public static function getAllowedOrigins()
    {
        if (self::$allowedOrigins !== null) {
            return self::$allowedOrigins;
        }

        self::loadEnv();

        $originsEnv = getenv('ALLOWED_ORIGINS');
        if ($originsEnv !== false && !empty($originsEnv)) {
            // Split comma-separated origins
            self::$allowedOrigins = array_map('trim', explode(',', $originsEnv));
        } else {
            // Fallback to default origins
            self::$allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                'https://jachting.technika-praha.cz'
            ];
        }

        return self::$allowedOrigins;
    }
}
