# Environment Configuration Guide

This project uses Vite's environment variables to manage API endpoint URLs for different environments.

## Environment Files

### `.env.development`

Used during development (`npm run dev`). Contains localhost URLs:

```
VITE_NEWS_PROXY_URL=http://localhost:8080/php/endpoints/news.php
VITE_GALLERY_PROXY_URL=http://localhost:8080/php/endpoints/gallery.php
```

### `.env.production`

Used during production builds (`npm run build`). Contains production URLs:

```
VITE_NEWS_PROXY_URL=https://your-production-domain.com/php/endpoints/news.php
VITE_GALLERY_PROXY_URL=https://your-production-domain.com/php/endpoints/gallery.php
```

## Setup Instructions

### For Development

1. The `.env.development` file is already configured with localhost URLs
2. Simply run `npm run dev` and it will use these values automatically

### For Production Deployment

**Option 1: Modify `.env.production` directly** (if deploying to a single environment)

1. Edit `.env.production` and replace the URLs with your actual production domain
2. Run `npm run build`

**Option 2: Create `.env.production.local`** (recommended for multiple developers)

1. Create a new file called `.env.production.local` (this file is gitignored)
2. Copy the contents from `.env.production`
3. Replace the URLs with your actual production domain
4. Run `npm run build`

The `.local` file takes precedence over the base file, allowing each developer to have their own production settings without committing them to git.

### Example `.env.production.local`:

```
VITE_NEWS_PROXY_URL=https://vstj-technika.cz/php/endpoints/news.php
VITE_GALLERY_PROXY_URL=https://vstj-technika.cz/php/endpoints/gallery.php
```

## How It Works

1. **Vite automatically loads** the appropriate `.env` file based on the mode:

   - `npm run dev` → uses `.env.development`
   - `npm run build` → uses `.env.production`

2. **Environment variables** are accessed in the code using `import.meta.env.VITE_*`:

   ```typescript
   const PROXY_URL = import.meta.env.VITE_NEWS_PROXY_URL;
   ```

3. **Build-time replacement**: Vite replaces these variables with their actual values during the build process, so the final bundle contains the concrete URLs.

## Files Updated

The following components now use environment variables instead of hardcoded URLs:

- `src/components/News.tsx`
- `src/components/NewsFeed.tsx`
- `src/components/Gallery.tsx`

## Git Configuration

The `.gitignore` file is configured to:

- ✅ **Commit** `.env.development` and `.env.production` (templates for all developers)
- ❌ **Ignore** `.env` and `.env.*.local` (personal/secret configurations)
- ❌ **Ignore** `.env.php` (PHP environment variables)

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about `import.meta.env`, make sure `src/vite-env.d.ts` exists and contains:

```typescript
interface ImportMetaEnv {
  readonly VITE_NEWS_PROXY_URL: string;
  readonly VITE_GALLERY_PROXY_URL: string;
}
```

### Wrong URL Being Used

1. Check which mode you're running in (`dev` vs `build`)
2. Verify the correct `.env` file exists for that mode
3. Restart the dev server or rebuild after changing `.env` files
4. Check for `.env.*.local` files that might be overriding the base files

### Production Build Still Using Localhost

Make sure you've updated `.env.production` or created `.env.production.local` with your production URLs before running `npm run build`.

## PHP Backend Configuration

The PHP backend also uses environment-based configuration for CORS (Cross-Origin Resource Sharing) settings.

### PHP Environment Files

#### `.env.php.development`

Used during local development. Contains localhost origins:

```php
<?php
// Development environment configuration for PHP
return [
    'ALLOWED_ORIGINS' => 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080',
    'ENVIRONMENT' => 'development'
];
```

#### `.env.php.production`

Used in production deployment. Contains production origin:

```php
<?php
// Production environment configuration for PHP
return [
    'ALLOWED_ORIGINS' => 'https://jachting.technika-praha.cz',
    'ENVIRONMENT' => 'production'
];
```

### How PHP Configuration Works

1. **Automatic Loading**: The `Config` class in `php/core/Config.php` automatically loads the appropriate `.env.php` file:

   - First tries to load `.env.php` (for deployment)
   - Falls back to `.env.php.development` (for local development)

2. **CORS Configuration**: The `Config::getAllowedOrigins()` method reads the `ALLOWED_ORIGINS` variable and returns an array of allowed origins.

3. **Usage in Endpoints**: Both `php/endpoints/news.php` and `php/endpoints/gallery.php` use this method:
   ```php
   $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
   if (in_array($origin, Config::getAllowedOrigins())) {
       header('Access-Control-Allow-Origin: ' . $origin);
   }
   ```

### Deployment Instructions

#### For Local Development

- The `.env.php.development` file is already configured
- Simply run your development server and it will work with localhost origins

#### For Production Deployment

**Option 1: Copy to `.env.php`** (recommended)

1. Copy `.env.php.production` to `.env.php` in your production environment
2. The system will automatically use `.env.php` when it exists

**Option 2: Modify production server directly**

1. Create a `.env.php` file on your production server
2. Add your production origin(s):
   ```php
   <?php
   ALLOWED_ORIGINS=https://jachting.technika-praha.cz
   ENVIRONMENT=production
   ```

### PHP Git Configuration

The `.gitignore` file is configured to:

- ✅ **Commit** `.env.php.development` and `.env.php.production` (templates)
- ❌ **Ignore** `.env.php` (actual deployment configuration)

### Files Updated

The following PHP files now use environment-based CORS:

- `php/core/Config.php` - Added `getAllowedOrigins()` method with environment loading
- `php/endpoints/news.php` - Now uses `Config::getAllowedOrigins()`
- `php/endpoints/gallery.php` - Now uses `Config::getAllowedOrigins()`

### PHP Troubleshooting

#### CORS Errors in Production

1. Verify `.env.php` exists on the production server
2. Check that `ALLOWED_ORIGINS` contains your production domain
3. Ensure the domain matches exactly (including https://)

#### CORS Errors in Development

1. Check that `.env.php.development` includes all your development ports
2. The default includes: localhost:5173, 5174, 3000, 8080
3. Add any additional ports if needed
