# Deployment Instructions for VSTJ Technika Jachting Web

## Environment Variables Setup

### 1. PHP Proxy Secrets
Create a `.env.php` file in the project root with your Azure AD secrets:

```bash
CLIENT_ID=your_azure_client_id
TENANT_ID=your_azure_tenant_id
CLIENT_SECRET=your_azure_client_secret
```

**Important:** This file is gitignored and should never be committed to version control.

### 2. Frontend Environment Variables
Update the existing `.env` file with production URLs:

```bash
VITE_AAD_CLIENT_ID=your_frontend_client_id
VITE_AAD_TENANT_ID=your_tenant_id
VITE_SITE_HOST=technikapraha.sharepoint.com
VITE_SITE_PATH=sites/jachting
VITE_FOLDER_PATH=verejne/fotky-verejne
```

## Docker Deployment Options

### Option A: Local Development with Docker
```bash
# Start the PHP proxy server
docker-compose up -d

# Start the React development server
npm run dev
```

### Option B: Production Build
```bash
# Build the React application
npm run build

# Deploy the dist/ folder to your web server
# The PHP proxy should be deployed separately on your server
```

## Production Server Setup

### PHP Proxy Deployment
1. Deploy `php_proxy.php` and `php_get_image.php` to your PHP-enabled server
2. Set environment variables on the server:
   - `CLIENT_ID`
   - `TENANT_ID`
   - `CLIENT_SECRET`
3. Ensure proper CORS headers are set for your production domain

### Static Files Deployment
1. Upload the contents of `dist/` to your web server
2. Configure the server to serve static files
3. Set up HTTPS (recommended)

## Security Notes
- Never commit `.env.php` to version control
- Use strong, unique secrets for production
- Regularly rotate client secrets
- Ensure your web server has proper security headers

## Troubleshooting
- Verify all environment variables are set
- Check PHP server logs for errors
- Ensure CORS is properly configured for production domain
- Test API endpoints independently before full deployment