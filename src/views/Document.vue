<template>
  <div class="document" v-if="show">
    <div class="sidebar" v-if="showSidebar">
      <ContentList></ContentList>
    </div>
    <div :class="sidebarFloatingClass" v-if="narrowEnoughToHideSidebar">
      <button @click="toggleSidebar">
        <view-list-icon />
      </button>
    </div>

    <div class="body">
      <DocumentToolbar :contentDocumentPair="contentDocumentPair" />

      <DocumentEditor ref="editor"
        class="editor"
        :contentDocumentPair="contentDocumentPair"
        :key="contentDocumentPair.document.id"
        :disabled="disabled"
        v-if="contentDocumentPair"
      ></DocumentEditor>
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
  position: relative;
  width: 18%;
  height: 100%;
  border-right: 1px solid #eee;
  background-color: white;
}
.sidebar-floating {
  position: absolute;
  left: 10px;
  top: 57px;
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
import ContentList from '@/components/ContentList'
import Loading from '@/components/Loading'

import ViewListIcon from 'vue-material-design-icons/ViewList'

import { mapState, mapGetters } from 'vuex'

const fb = require('../firebase')
const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Document',

  components: {
    DocumentToolbar,
    ContentList,
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
      const hasDocument = _.isObject(this.contentDocumentPair)
      if (hasDocument) {
        this.setSidebarToParentFolder()
        this.isDirectNavigation = 'yes, done' // Flag no longer needed.
      }
    }
  },

  beforeDestroy () {
    this.unsubscribe()
    window.removeEventListener('resize', this.onResize)
  },

  data () {
    return {
      documentUnsubscriber: null, // Function to unsubscribe from doc updates.
      contentDocumentPair: null,
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
      return _.isObject(this.contentDocumentPair) ? this.contentDocumentPair.content : {}
    },

    disabled () {
      return this.content.trashed || this.isInTrashedAncestorFolder(this.content)
    }
  },

  methods: {
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
