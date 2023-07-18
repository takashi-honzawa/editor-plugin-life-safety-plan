import { createApp } from 'vue'
import Plugin from './Plugin.vue'

import '@archilogic/ui-components/tailwind/index.css'
import '@archilogic/ui-components/dist/style.css'
import '@archilogic/floor-plan-webgl/dist/style.css'

createApp(Plugin).mount('#app')
