import { createApp, h } from 'vue';
import './assets/scss/app.scss'

import App from './App.vue'
import store from './store'
import router from './router'

// ============================== EDITOR OPTIONS ==============================

// import VueQuillEditor from 'vue-quill-editor'
// import 'quill/dist/quill.core.css' // import styles
// import 'quill/dist/quill.snow.css' // for snow theme
// import 'quill/dist/quill.bubble.css' // for bubble theme
// Vue.use(VueQuillEditor, /* { default global options } */)

// import Editor from 'vue-editor-js'
// Vue.use(Editor)

import CKEditor from '@ckeditor/ckeditor5-vue'

// ============================== BACKEND OPTIONS ==============================

import ExpressBackend from '@/backends/ExpressBackend'
const backend = new ExpressBackend()

createApp({
  render: () => h(App),

  created () {
    store.dispatch('registerBackend', backend)
  }
}).use(router).use(store).use( CKEditor ).mount('#app')
