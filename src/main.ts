import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')
