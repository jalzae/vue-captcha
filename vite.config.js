import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    // Dev server configuration for testing
    return {
      plugins: [vue()],
      server: {
        port: 5173,
        open: true
      },
      root: 'test',
      build: {
        outDir: '../dist-test'
      }
    }
  } else {
    // Note: This is for testing/demo only
    // For production module build, use: npm run prepack
    return {
      plugins: [vue()],
      build: {
        lib: {
          entry: 'src/index.js',
          name: 'HumanVerifyVue',
          fileName: (format) => `human-verify-vue.${format}.js`
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue'
            }
          }
        }
      }
    }
  }
})
