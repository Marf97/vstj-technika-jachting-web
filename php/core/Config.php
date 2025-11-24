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

    // CORS allowed origins
    public const ALLOWED_ORIGINS = [
        'https://jachting.technika-praha.cz'
    ];

    // Cache settings
    public const TOKEN_CACHE_TIME = 3000; // 50 minutes
    public const SITE_ID_CACHE_TIME = 86400; // 24 hours
    public const GALLERY_CACHE_TIME = 300; // 5 minutes
    public const NEWS_CACHE_TIME = 600; // 10 minutes

    // Pagination defaults
    public const DEFAULT_PAGE_SIZE = 20;
    public const LOAD_MORE_SIZE = 10;
}
