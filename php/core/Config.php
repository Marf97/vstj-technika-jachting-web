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
     * Loads the base .env.php runtime configuration first, then overlays
     * non-sensitive environment-specific settings from .env.php.<environment>.
     */
    private static function loadEnv()
    {
        if (self::$envLoaded) {
            return;
        }

        $rootDir = dirname(__DIR__, 2);
        $baseConfigFile = $rootDir . '/.env.php';

        if (file_exists($baseConfigFile)) {
            self::applyConfig(self::parseConfigFile($baseConfigFile));
        }

        $environment = getenv('ENVIRONMENT');
        if ($environment === false || $environment === '') {
            $environment = 'development';
        }

        $environmentConfigFile = $rootDir . '/.env.php.' . $environment;
        if (file_exists($environmentConfigFile)) {
            self::applyConfig(self::parseConfigFile($environmentConfigFile));
        }

        self::$envLoaded = true;
    }

    private static function parseConfigFile(string $file): array
    {
        $contents = @file_get_contents($file);
        if ($contents === false) {
            return [];
        }

        $trimmed = ltrim($contents);
        if (str_starts_with($trimmed, '<?php')) {
            $config = require $file;
            return is_array($config) ? $config : [];
        }

        $config = [];
        $lines = preg_split('/\r\n|\r|\n/', $contents);

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $separatorPos = strpos($line, '=');
            if ($separatorPos === false) {
                continue;
            }

            $key = trim(substr($line, 0, $separatorPos));
            $value = trim(substr($line, $separatorPos + 1));

            if ($key === '') {
                continue;
            }

            $config[$key] = trim($value, "\"'");
        }

        return $config;
    }

    private static function applyConfig(array $config): void
    {
        foreach ($config as $key => $value) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
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
