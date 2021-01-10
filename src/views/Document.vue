<template>
  <div class="document" v-if="show">
    <Sidebar v-if="showSidebar" />

    <div :class="sidebarFloatingClass" v-if="narrowEnoughToHideSidebar">
      <button @click="toggleSidebar">
        <view-list-icon />
      </button>
    </div>

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
.sidebar {
  background-color: white;
  // height: calc(100% - 36px);
}
.sidebar-floating {
  position: absolute;
  left: 10px;
  top: 52px;
  z-index: 2;

  &.open {
    left: 260px;
  }
}
.body {
  width: 82%;
}

.editor {
  width: 100%;
}
.loading {
  top: 0;
  bottom: 0;
  left: 18%;
  right: 0;
}

// Responsiveness for sidebar.
@media (max-width:1160px) {
  .body {
    width: 100%;
  }
  .sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    min-width: 250px;
    z-index: 3;
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

import { ViewList as ViewListIcon } from 'mdue'
import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Document',

  components: {
    DocumentToolbar,
    Sidebar,
    DocumentEditor,
    Loading,
    ViewListIcon
  },

  created () {
    this.loadNewDocument(this.documentId)
  },

  mounted () {
    // Add a listener for the window size.
    window.addEventListener('resize', this.onResize)
    this.onResize()
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

  beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
  },

  data () {
    return {
      document: null,
      isDirectNavigation: null,
      isLoading: false,
      narrowEnoughToHideSidebar: false
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
      this.resetSidebar()

      const isChangingDocs = newDocumentId !== oldDocumentId && !_.isNil(oldDocumentId)
      if (isChangingDocs && this.$refs.editor) {
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
    ...mapState(['manualOverrideShowSidebar', 'contents']), // contents needed for the watcher
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'getContentByDocumentKey', 'isInTrashedAncestorFolder']),

    documentId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },

    show () {
      return this.isLoggedIn
    },

    showSidebar () {
      return !this.narrowEnoughToHideSidebar || this.manualOverrideShowSidebar
    },

    sidebarFloatingClass () {
      if (this.manualOverrideShowSidebar) {
        return 'sidebar-floating open'
      } else {
        return 'sidebar-floating'
      }
    },

    content () {
      return this.document?.content
    },

    disabled () {
      return this.content.trashed || this.isInTrashedAncestorFolder(this.content)
    }
  },

  methods: {
    loadNewDocument (documentKey) {
      if (_.isNil(documentKey) || !this.isLoggedIn) { return }

      const isAlreadyLookingAtThisDocument = this.document?.id === documentKey
      if (isAlreadyLookingAtThisDocument) { return }

      const content = this.getContentByDocumentKey(documentKey)
      if (_.isNil(content)) {
        console.warn('Attempted to load a document, but couldn\'t find the associated table-of-contents object:', documentKey)
        return
      }

      const onSuccess = document => {
        console.log('Loaded document:', documentKey)
        this.document = document
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
      this.$store.commit('setTargetFolder', this.content.parent)
    },

    showTrash () {
      this.$router.push({ name: 'Trash' })
    },

    onResize () {
      this.narrowEnoughToHideSidebar = window.innerWidth <= 1160
    },

    toggleSidebar () {
      if (this.manualOverrideShowSidebar) {
        this.$store.dispatch('hideSidebar')
      } else {
        this.$store.dispatch('showSidebar')
      }
    },

    resetSidebar () {
      this.$store.dispatch('hideSidebar')
    }
  } // methods
}
</script>
