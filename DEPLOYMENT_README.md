# VŠTJ Technika Jachting Web - Deployment Guide

## 📁 File Structure for Apache Server

Based on your webFiles.JPG, here's how to organize the files on your Apache server:

```
/var/www/html/ (or your web root)
├── jachting/                    # Your subdomain/subfolder
│   ├── index.html              # Built React app (from dist/)
│   ├── assets/                 # React build assets
│   ├── api/                    # PHP API folder
│   │   ├── php_proxy.php       # Main gallery API
│   │   └── php_get_image.php   # Individual image API
│   └── (other React files...)
│
└── (other websites/domains...)
```

## 🚀 Deployment Steps

### 1. Prepare React Build

```bash
npm run build
```

This creates a `dist/` folder with your built React application.

### 2. Upload Files to Server

Upload the following structure to your `jachting` subfolder:

**Frontend Files (from `dist/`):**
- `index.html`
- `assets/` folder
- All other files from the build

**API Files:**
- `php_proxy.php` → `/jachting/api/php_proxy.php`
- `php_get_image.php` → `/jachting/api/php_get_image.php`

### 3. Update PHP Secrets

Edit both PHP files on your server:

```php
// Replace this line in both files:
$clientSecret = 'YOUR_ACTUAL_CLIENT_SECRET_HERE';

// With your actual client secret from Azure AD
```

### 4. Verify File Permissions

Make sure Apache can execute the PHP files:
```bash
chmod 644 /path/to/jachting/api/*.php
```

## 🔧 URL Configuration

Your React app will make requests to:
- `https://jachting.technika-praha.cz/api/php_proxy.php`
- `https://jachting.technika-praha.cz/api/php_get_image.php`

The PHP files are already configured with the correct CORS origin.

## ✅ Testing

1. Visit `https://jachting.technika-praha.cz`
2. Click on "Galerie"
3. Check browser console for any errors
4. Verify images load from SharePoint

## 🔒 Security Notes

- Client secret is stored server-side only
- Never commit PHP files with real secrets to git
- Consider using environment variables for secrets in production PHP setups

## 🆘 Troubleshooting

If you get 500 errors:
- Check PHP error logs: `/var/log/apache2/error.log`
- Verify client secret is correct
- Ensure Azure app has proper permissions

If you get CORS errors:
- Verify the domain in PHP CORS headers matches your setup
- Check that requests are coming from `https://jachting.technika-praha.cz`