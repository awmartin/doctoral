<template>
  <div class="document" v-if="show">
    <Sidebar />

    <div class="body">
      <DocumentToolbar :document="focusedDocument" />

      <div class="horizontal-split">
        <DocumentEditor ref="editor"
          class="editor"
          :document="document"
          :key="document.id"
          :disabled="disabled"
          :split-view="!!documentSplit"
          :focus-callback="focusMe"
          v-if="document"
        />

        <DocumentEditor ref="editor-split"
          class="editor right"
          :document="documentSplit"
          :key="documentSplit.id"
          :disabled="disabled"
          :split-view="!!documentSplit"
          :focus-callback="focusMe"
          v-if="documentSplit"
        />
      </div>
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

  &.right {
    border-left: 1px solid #eee;
  }
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

.horizontal-split {
  height: 100%;
  display: flex;
}
</style>

<script>
import DocumentCkEditor from '@/components/DocumentCkEditor'

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
      isLoading: false,
      documentSplit: null,
      focusedDocumentKey: null,
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
      if (this.documentIdSplit) {
        this.loadNewSplitDocument(this.documentIdSplit)
      }
    },

    contents () {
      // Needed for direct navigation. Load the document when the contents are loaded, since it's
      // needed to complete the content/document pair.
      this.loadNewDocument(this.documentId)
      if (this.documentIdSplit) {
        this.loadNewSplitDocument(this.documentIdSplit)
      }
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
    },

    documentIdSplit (documentKey, oldDocumentKey) {
      console.debug('documentIdSplit changed!', documentKey)
      if (_.isNil(documentKey)) {
        // Not loading a new document.
        this.documentSplit = null
        return
      }

      const isChangingSplitDocs = documentKey !== oldDocumentKey && !_.isNil(oldDocumentKey)
      if (isChangingSplitDocs && this.$refs['editor-split']) {
        this.$refs['editor-split'].forceSave()
        .then(() => {
          this.loadNewSplitDocument(documentKey)
        })
        .catch(error => {
          console.error('Error when saving a split document:', error)
        })
      } else {
        this.loadNewSplitDocument(documentKey)
      }
    }
  },

  computed: {
    ...mapState(['contents']), // contents needed for the watcher
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'getContentByDocumentKey', 'isInTrashedAncestorFolder']),

    focusedDocument () {
      if (_.isNil(this.documentSplit)) {
        return this.document
      } else {
        if (this.documentSplit.id === this.focusedDocumentKey) {
          return this.documentSplit
        } else {
          return this.document
        }
      }
    },

    documentId () {
      if (this.$route.name === 'Document' || this.$route.name === 'DocumentSplit' || this.$route.name === 'NewDocument' || this.$route.name === 'Search') {
        const elts = _.split(this.$route.params.id, '-')
        return _.head(elts)
      } else {
        return null
      }
    },

    documentIdSplit () {
      if (this.$route.name === 'DocumentSplit') {
        const elts = _.split(this.$route.params.idsplit, '-')
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

      // This might show up simultaneously with the Dashboard loading indicator.
      this.isLoading = true

      const onSuccess = doc => {
        console.log('Loaded document:', documentKey, doc.title)
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

    loadNewSplitDocument (documentKey) {
      if (_.isNil(documentKey) || !this.isLoggedIn) { return }

      const isAlreadyLookingAtThisDocument = this.documentSplit?.id === documentKey
      if (isAlreadyLookingAtThisDocument) { return }

      this.isLoading = true

      const onSuccess = doc => {
        console.log('Loaded document in split window:', documentKey, doc.title)
        this.documentSplit = doc
        this.isLoading = false
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
    },

    focusMe (key) {
      this.focusedDocumentKey = key
    }
  } // methods
}
</script>
