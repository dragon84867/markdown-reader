import { createApp } from "vue"
import App from "./App.vue"
import { pinia } from "./stores"
import "./styles/main.css"
import "./styles/markdown.css"
import "./styles/highlight.css"

const app = createApp(App)
app.use(pinia)
app.mount("#app")