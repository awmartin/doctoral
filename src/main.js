import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import 'vue-material-design-icons/styles.css'
import './assets/scss/app.scss'

// import VueQuillEditor from 'vue-quill-editor'
// import 'quill/dist/quill.core.css' // import styles
// import 'quill/dist/quill.snow.css' // for snow theme
// import 'quill/dist/quill.bubble.css' // for bubble theme
// Vue.use(VueQuillEditor, /* { default global options } */)

import CKEditor from '@ckeditor/ckeditor5-vue'
Vue.use( CKEditor )

// import Editor from 'vue-editor-js'
// Vue.use(Editor)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
