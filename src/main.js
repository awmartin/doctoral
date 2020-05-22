import Vue from 'vue'
import 'vue-material-design-icons/styles.css'
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
Vue.use( CKEditor )

// ============================== BACKEND OPTIONS ==============================

import firebaseConfig from '@/backends/firebaseConfig'
import FirebaseBackend from '@/backends/FirebaseBackend'
const backend = new FirebaseBackend(firebaseConfig)

// import ExpressBackend from '@/backends/ExpressBackend'
// const backend = new ExpressBackend()

// ============================== CREATE THE VUE APP ==============================

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
  created () {
    store.dispatch('registerBackend', backend)
  }
}).$mount('#app')
