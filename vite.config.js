import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy PHP files with env vars for production
    {
      name: 'copy-php-with-env',
      generateBundle() {
        // Only run in production build
        if (true) { // Always include PHP files in build for now
          const phpFiles = ['php_proxy.php', 'php_get_image.php']
          const envFile = '.env.php'

          // Read environment variables
          let envContent = ''
          if (fs.existsSync(envFile)) {
            envContent = fs.readFileSync(envFile, 'utf8')
          }

          // Copy PHP files to dist
          phpFiles.forEach(phpFile => {
            if (fs.existsSync(phpFile)) {
              let phpContent = fs.readFileSync(phpFile, 'utf8')

              // In production, replace getenv calls with actual values
              if (envContent) {
                const envLines = envContent.split('\n').filter(line => line.trim() && line.includes('='))
                envLines.forEach(line => {
                  const [key, ...valueParts] = line.split('=')
                  const value = valueParts.join('=').trim() // Handle values with = in them
                  if (key && value) {
                    // Replace getenv('KEY') with actual value
                    const regex = new RegExp(`getenv\\('${key.trim()}'\\)`, 'g')
                    phpContent = phpContent.replace(regex, `'${value.replace(/'/g, "\\'")}'`) // Escape single quotes
                  }
                })
              }

              this.emitFile({
                type: 'asset',
                fileName: phpFile,
                source: phpContent
              })
            }
          })
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  define: {
    'import.meta.env': 'import.meta.env',
  },
})
