<template>
  <div class="document" v-if="show">
    <div class="sidebar">
      <ContentList></ContentList>
    </div>

    <DocumentEditor ref="editor"
      class="editor"
      :contentDocumentPair="contentDocumentPair"
      :key="contentDocumentPair.document.id"
      v-if="contentDocumentPair"
    ></DocumentEditor>

    <loading v-if="isLoading" />
  </div>
</template>

<style lang="scss" scoped>
.document {
  position: relative;
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
.loading {
  top: 0;
  bottom: 0;
  left: 18%;
  right: 0;
}

// Responsiveness for sidebar.
@media (max-width:1160px) {
  .editor {
    width: 100%;
  }
  .sidebar {
    display: none;
  }
}
</style>

<script>
import DocumentCkEditor from '@/components/DocumentCkEditor'
// import DocumentEditorJs from '@/components/DocumentEditorJs'
// import DocumentQuillEditor from '@/components/DocumentQuillEditor'
import ContentList from '@/components/ContentList'
import Loading from '@/components/Loading'
import { mapState, mapGetters } from 'vuex'

const fb = require('../firebase')
const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Home',

  components: {
    ContentList,
    DocumentEditor,
    Loading
  },

  created () {
    this.loadNewDocument(this.documentId)
  },

  beforeUpdate () {
    if (this.isDirectNavigation === 'yes') {
      const hasDocument = _.isObject(this.contentDocumentPair)
      if (hasDocument) {
        this.setSidebarToParentFolder()
        this.isDirectNavigation = 'yes, done' // Flag no longer needed.
      }
    }
  },

  beforeDestroy () {
    this.unsubscribe()
  },

  data () {
    return {
      documentUnsubscriber: null, // Function to unsubscribe from doc updates.
      contentDocumentPair: null,
      isDirectNavigation: null,
      isLoading: false
    }
  },

  watch: {
    isReadyNotLoggedIn (newVal) {
      // This view requires a login, so redirect to the Home page when it's known that the user isn't.
      if (newVal) {
        this.$router.push({ name: 'Home' })
      }
    },

    isLoggedIn (newVal, oldVal) {
      this.isDirectNavigation = newVal && !oldVal ? 'yes' : 'no'
      this.loadNewDocument(this.documentId)
    },

    contents () {
      this.loadNewDocument(this.documentId)
    },

    documentId (newDocumentId, oldDocumentId) {
      const isChangingDocs = newDocumentId !== oldDocumentId && !_.isNil(oldDocumentId)
      if (isChangingDocs) {
        // Save the document the user is navigating away from.
        this.$refs.editor.saveDocument()().then(() => {
          this.loadNewDocument(newDocumentId)
        })
      } else {
        this.loadNewDocument(newDocumentId)
      }
    }
  },

  computed: {
    ...mapState(['contents']),
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

    documentId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    show () {
      return this.isLoggedIn
    }
  },

  methods: {
    getContentByDocumentKey (documentKey) {
      return _.find(this.contents, content => content.key === documentKey)
    },

    loadNewDocument (documentKey) {
      if (_.isNil(documentKey)) { return }
      if (!this.isLoggedIn) { return }

      const isAlreadyLookingAtThisDocument = _.isObject(this.contentDocumentPair) && this.contentDocumentPair.document.id === documentKey
      if (isAlreadyLookingAtThisDocument) { return }

      this.unsubscribe()

      const content = this.getContentByDocumentKey(documentKey)
      if (_.isNil(content)) { return }

      this.isLoading = true

      const documentRef = fb.getCollection('documents').doc(content.key)
      this.documentUnsubscriber = documentRef.onSnapshot(doc => {
        if (doc.exists) {
          const document = doc.data()
          document.id = doc.id
          this.contentDocumentPair = { content, document }
          this.isLoading = false
        }
      })
    },

    unsubscribe () {
      if (_.isFunction(this.documentUnsubscriber)) {
        this.documentUnsubscriber()
      }
    },

    setSidebarToParentFolder () {
      if (_.isNil(this.contentDocumentPair)) { return }
      if (_.isNil(this.contentDocumentPair.content)) { return }
      this.$store.commit('setTargetFolder', this.contentDocumentPair.content.parent)
    },

    showTrash () {
      this.$router.push({ name: 'Trash' })
    }
  } // methods
}
</script>
