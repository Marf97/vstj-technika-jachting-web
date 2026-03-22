import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Copy PHP files into the build output without inlining secrets.
    {
      name: 'copy-php-assets',
      generateBundle() {
        const phpFiles = [
          'php/endpoints/news.php',
          'php/endpoints/gallery.php',
          'php/endpoints/auth.php',
          'php/endpoints/member-calendar.php',
          'php/modules/News.php',
          'php/modules/Gallery.php',
          'php/modules/Router.php',
          'php/core/Config.php',
          'php/core/Auth.php',
          'php/core/MemberAuth.php',
          'php/core/GraphAPI.php',
        ]

        phpFiles.forEach((phpFile) => {
          if (fs.existsSync(phpFile)) {
            this.emitFile({
              type: 'asset',
              fileName: phpFile,
              source: fs.readFileSync(phpFile, 'utf8')
            })
          }
        })
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
