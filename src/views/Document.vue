<template>
  <div class="document" v-if="show">
    <Sidebar />

    <div class="body">
      <DocumentToolbar :document="document" />

      <DocumentEditor ref="editor"
        class="editor"
        :document="document"
        :key="document.id"
        :disabled="disabled"
        v-if="document"
      />
    </div>

    <loading v-if="isLoading" />
  </div>
</template>

<style lang="scss" scoped>
.document {
  position: relative;
  display: flex;
  height: calc(100% - 36px);
}

.editor {
  width: 100%;
}
.loading {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: max(18%, 250px);
}

.body {
  width: 82%;
}
// Responsiveness for sidebar.
@media (max-width:1160px) {
  .body {
    width: 100%;
  }
}
</style>

<script>
import DocumentCkEditor from '@/components/DocumentCkEditor'
// import DocumentEditorJs from '@/components/DocumentEditorJs'
// import DocumentQuillEditor from '@/components/DocumentQuillEditor'

import DocumentToolbar from '@/components/DocumentToolbar'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Document',

  components: {
    DocumentToolbar,
    Sidebar,
    DocumentEditor,
    Loading
  },

  created () {
    this.loadNewDocument(this.documentId)
  },

  beforeUpdate () {
    if (this.isDirectNavigation === 'yes') {
      const hasDocument = _.isObject(this.document)
      if (hasDocument) {
        this.setSidebarToParentFolder()
        this.isDirectNavigation = 'yes, done' // Flag no longer needed.
      }
    }
  },

  data () {
    return {
      document: null,
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
      // Needed for direct navigation. Load the document when the contents are loaded, since it's
      // needed to complete the content/document pair.
      this.loadNewDocument(this.documentId)
    },

    documentId (newDocumentId, oldDocumentId) {
      if (_.isNil(newDocumentId)) {
        // Not loading a new document. Likely navigating somewhere else.
        return
      }

      const isChangingDocs = newDocumentId !== oldDocumentId && !_.isNil(oldDocumentId)
      if (isChangingDocs && this.$refs.editor) {
        // Save the document the user is navigating away from.
        this.$refs.editor.forceSave()
        .then(() => {
          this.loadNewDocument(newDocumentId)
        })
        .catch(error => {
          console.error('Error when saving a document on route change:', error)
        })
      } else {
        this.loadNewDocument(newDocumentId)
      }
    }
  },

  computed: {
    ...mapState(['contents']), // contents needed for the watcher
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'getContentByDocumentKey', 'isInTrashedAncestorFolder']),

    documentId () {
      if (this.$route.name === 'Document' || this.$route.name === 'NewDocument' || this.$route.name === 'Search') {
        const elts = _.split(this.$route.params.id, '-')
        return _.head(elts)
      } else {
        return null
      }
    },

    show () {
      return this.isLoggedIn
    },

    content () {
      return this.document?.content
    },

    disabled () {
      return this.content.trashed || this.isInTrashedAncestorFolder(this.content) || this.content.archived
    }
  },

  methods: {
    loadNewDocument (documentKey) {
      if (_.isNil(documentKey) || !this.isLoggedIn) { return }

      const isAlreadyLookingAtThisDocument = this.document?.id === documentKey
      if (isAlreadyLookingAtThisDocument) { return }

      // TODO Audit this approach.
      // Disabled because the current way to look at an archived document is to bypass this check and make a fake table-of-contents entry.

      // const content = this.getContentByDocumentKey(documentKey)
      // if (_.isNil(content)) {
      //   console.warn('Attempted to load a document, but couldn\'t find the associated table-of-contents object:', documentKey)
      //   return
      // }

      // This might show up simultaneously with the Dashboard loading indicator.
      this.isLoading = true

      const onSuccess = doc => {
        console.log('Loaded document:', documentKey)
        this.document = doc
        this.isLoading = false
        document.title = `Doctoral | ${doc.title}`
      }

      const onError = error => {
        console.error('Error occured when loading a document:', error)
      }

      this.$store.dispatch('loadDocument', {
        documentKey,
        onSuccess,
        onError
      })
    },

    setSidebarToParentFolder () {
      if (_.isNil(this.document?.content)) { return }
      this.$store.dispatch('setSidebarFolderAndFocus', this.content.parent)
    },

    showTrash () {
      this.$router.push({ name: 'Trash' })
    },

    onResize () {
      this.narrowEnoughToHideSidebar = window.innerWidth <= 1160
    }
  } // methods
}
</script>
