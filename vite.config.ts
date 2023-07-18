import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __VERSION__: JSON.stringify(version)
  }
})
