import Vue from 'vue'
import 'vue-material-design-icons/styles.css'
import './assets/scss/app.scss'

import App from './App.vue'
import store from './store'
import router from './router'

// import VueQuillEditor from 'vue-quill-editor'
// import 'quill/dist/quill.core.css' // import styles
// import 'quill/dist/quill.snow.css' // for snow theme
// import 'quill/dist/quill.bubble.css' // for bubble theme
// Vue.use(VueQuillEditor, /* { default global options } */)

// import Editor from 'vue-editor-js'
// Vue.use(Editor)

import CKEditor from '@ckeditor/ckeditor5-vue'
Vue.use( CKEditor )

import firebaseConfig from './firebaseConfig'
import FirebaseBackend from './firebase'
const backend = new FirebaseBackend(firebaseConfig)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
  created () {
    store.dispatch('registerBackend', backend)
  }
}).$mount('#app')
