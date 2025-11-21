import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy PHP files with env vars for production
    {
      name: 'copy-php-with-env',
      generateBundle() {
        // Include PHP files in build
        /* eslint-disable-next-line no-constant-condition */
        if (true) {
          const phpFiles = ['php/endpoints/news.php', 'php/endpoints/gallery.php', 'php/modules/News.php', 'php/modules/Gallery.php', 'php/modules/Router.php', 'php/core/Config.php', 'php/core/Auth.php', 'php/core/GraphAPI.php']
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
})
