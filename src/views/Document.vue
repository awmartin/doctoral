<template>
  <div class="document" v-if="show">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <DocumentEditor :contentDocumentPair="contentDocumentPair" :key="document.id" class="editor" v-if="contentDocumentPair" ref="editor"></DocumentEditor>
  </div>
</template>

<style lang="scss" scoped>
.document {
  display: flex;
  height: calc(100% - 36px);
}
.sidebar {
  position: relative;
  width: 18%;
  height: 100%;
  border-right: 1px solid #eee;
}
.editor {
  width: 82%;
}
</style>

<script>
import DocumentCkEditor from '@/components/DocumentCkEditor'
// import DocumentEditorJs from '@/components/DocumentEditorJs'
// import DocumentQuillEditor from '@/components/DocumentQuillEditor'
import ContentList from '@/components/ContentList'
import { mapState, mapGetters } from 'vuex'

const fb = require('../firebase')
const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Home',

  components: {
    ContentList,
    DocumentEditor
  },

  created () {
    this.loadNewDocument()
  },

  beforeDestroy () {
    this.unsubscribe()
  },

  data () {
    return {
      document: null,
      documentUnsubscriber: null,
      documentEditorData_: null,
      contentJustLoaded: false,
      isDirectNavigation: false
    }
  },

  watch: {
    content (newContent, oldContent) {
      if (_.isObject(newContent) && _.isNil(oldContent)) {
        this.contentJustLoaded = true
      }

      const isLookingAtSameContent = _.isObject(newContent) && _.isObject(oldContent) && newContent.id === oldContent.id
      if (isLookingAtSameContent) { return }

      // The user has navigated to a new document or navigated directly to it.
      // Let's load it and ensure that the previous document is saved.

      if (!_.isNil(this.$refs.editor) && _.isFunction(this.$refs.editor.saveDocument)) {
        this.$refs.editor.saveDocument().then(() => {
          this.loadNewDocument()
        })
      } else {
        this.loadNewDocument()
      }
    },

    isReadyNotLoggedIn (newVal) {
      if (newVal) {
        this.$router.push({ name: 'Home' })
      }
    },

    isLoggedIn (newVal, oldVal) {
      const justLoggedIn = newVal && !oldVal
      if (justLoggedIn) {
        this.isDirectNavigation = true
      }
    },

    contentJustLoadedWhileNavigatingDirectly (newVal, oldVal) {
      // We have enough information to load the sidebar.
      // The user needs to be logged in and the 'content' value has to be loaded.
      if (newVal && !oldVal) {
        this.setSidebarToParentFolder()
      }
    }
  },

  computed: {
    ...mapState(['contents']),
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

    contentJustLoadedWhileNavigatingDirectly () {
      return this.contentJustLoaded && this.isDirectNavigation
    },

    content () {
      return _.find(this.contents, content => content.key === this.routeId)
    },

    routeId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    contentDocumentPair () {
      if (_.isNil(this.document) || _.isNil(this.content)) { return null }
      if (this.content.key !== this.document.id) { return null }
      return {
        content: this.content,
        document: this.document
      }
    },

    show () {
      return this.isLoggedIn
    }
  },

  methods: {
    loadNewDocument () {
      this.unsubscribe()

      if (_.isObject(this.content)) {
        const key = this.content.key
        const documentRef = fb.getCollection('documents').doc(key)
        this.documentUnsubscriber = documentRef.onSnapshot(doc => {
          this.document = doc.data()
          this.document.id = doc.id
        })
      }
    },

    unsubscribe () {
      if (_.isFunction(this.documentUnsubscriber)) {
        this.documentUnsubscriber()
      }
    },

    setSidebarToParentFolder () {
      this.$store.commit('setTargetFolder', this.content.parent)
    },

    showTrash () {
      this.$router.push({ name: 'Trash' })
    }
  } // methods
}
</script>
