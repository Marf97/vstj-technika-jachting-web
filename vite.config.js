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
        const runtimeEnvFiles = ['.env.php', '.env.php.production']

        const parseKeyValueEnv = (content) => {
          const result = {}
          const trimmedContent = content.trimStart()

          if (trimmedContent.startsWith('<?php')) {
            const pairRegex = /['"]([A-Z0-9_]+)['"]\s*=>\s*['"]([^'"]*)['"]/g
            let match
            while ((match = pairRegex.exec(content)) !== null) {
              const [, key, value] = match
              result[key] = value
            }
            return result
          }

          content.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
              return
            }
            const separatorIndex = trimmed.indexOf('=')
            const key = trimmed.slice(0, separatorIndex).trim()
            const value = trimmed.slice(separatorIndex + 1).trim()
            if (key) {
              result[key] = value.replace(/^['"]|['"]$/g, '')
            }
          })
          return result
        }

        const buildRuntimeEnvMap = () => {
          const merged = {}

          runtimeEnvFiles.forEach((envPath) => {
            if (!fs.existsSync(envPath)) {
              return
            }
            const raw = fs.readFileSync(envPath, 'utf8')
            const parsed = parseKeyValueEnv(raw)
            Object.assign(merged, parsed)
          })

          Object.entries(process.env).forEach(([key, value]) => {
            if (typeof value === 'string' && value.length > 0) {
              merged[key] = value
            }
          })

          return merged
        }

        const runtimeEnv = buildRuntimeEnvMap()
        const runtimeEnvJson = JSON.stringify(runtimeEnv)
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")

        const envBootstrap = `\n/* Build-time runtime env fallback injection */\n$__VSTJ_BUILD_ENV = json_decode('${runtimeEnvJson}', true);\nif (is_array($__VSTJ_BUILD_ENV)) {\n    foreach ($__VSTJ_BUILD_ENV as $__vstjKey => $__vstjValue) {\n        if (getenv($__vstjKey) === false || getenv($__vstjKey) === '') {\n            putenv($__vstjKey . '=' . $__vstjValue);\n            $_ENV[$__vstjKey] = $__vstjValue;\n            $_SERVER[$__vstjKey] = $__vstjValue;\n        }\n    }\n}\nunset($__VSTJ_BUILD_ENV, $__vstjKey, $__vstjValue);\n`

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
            let source = fs.readFileSync(phpFile, 'utf8')
            source = source.replace(/^<\?php\s*/m, (match) => `${match}${envBootstrap}`)

            this.emitFile({
              type: 'asset',
              fileName: phpFile,
              source
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
