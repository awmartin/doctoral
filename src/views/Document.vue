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
      <div :class="menuClass">
        <div class="left">
          <div class="warning-message" v-if="showWarning">{{ warningMessage }}</div>

          <breadcrumb :content="content" v-else />
        </div>

        <div class="right">
          <span class="saving" v-if="isSaving">
            <span class="message">Saving…</span>
            <progress-alert-icon class="icon" />
          </span>

          <span class="publishing" v-if="isPublishing">
            <span class="message">Publishing…</span>
            <progress-alert-icon class="icon" />
          </span>

          <button @click="toggleStarDocument" :class="starDocumentClass" :disabled="disabled">
            <star-icon v-if="content.starred" />
            <star-outline-icon v-else />
          </button>

          <move-dropdown :content="content" :direction="'left'" />

          <button @click="publishDocument" class="publish-document" :disabled="isPublishing || isSaving || disabled">
            <publish-icon />
          </button>

          <double-press-button :click="trashDocument" class="trash-document">
            <delete-outline-icon />
          </double-press-button>
        </div>
      </div>

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

.menu {
  height: 32px;
  padding: 10px 0;
  left: 18%;
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  &.warning {
    background-color: lighten(lightcoral, 7%);
  }
  .warning-message {
    color: white;
    font-weight: 500;
    padding-left: 10px;
  }
  .saving {
    margin-right: 10px;
  }
  .message {
    font-style: italic;
    font-size: 0.8rem;
  }
  .star-document {
    margin-right: 5px;
  }

  .left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    button {
      margin-right: 5px;
    }
  }
  .right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    button {
      margin-left: 5px;
    }
  }

  // Some button spacing.
  .publishing {
    color: gray;
  }
  button.trash-document {
    margin-left: 15px;
    margin-right: 10px;
  }
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

import MoveDropdown from '@/components/MoveDropdown'
import Breadcrumb from '@/components/Breadcrumb'
import ContentList from '@/components/ContentList'
import Loading from '@/components/Loading'
import DoublePressButton from '@/components/DoublePressButton'

import ViewListIcon from 'vue-material-design-icons/ViewList'
import DeleteOutlineIcon from 'vue-material-design-icons/DeleteOutline'
import ProgressAlertIcon from 'vue-material-design-icons/ProgressAlert'
import PublishIcon from 'vue-material-design-icons/Publish'
import StarIcon from 'vue-material-design-icons/Star'
import StarOutlineIcon from 'vue-material-design-icons/StarOutline'

import { mapState, mapGetters } from 'vuex'
import util from '@/lib/util'

const fb = require('../firebase')
const _ = require('lodash')
const DocumentEditor = DocumentCkEditor

export default {
  name: 'Home',

  components: {
    ContentList,
    DocumentEditor,
    Loading,
    ViewListIcon,
    MoveDropdown,
    Breadcrumb,
    DoublePressButton,
    StarIcon,
    StarOutlineIcon,
    DeleteOutlineIcon,
    ProgressAlertIcon,
    PublishIcon
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
      narrowEnoughToHideSidebar: false,
      isPublishing: false
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
    ...mapState(['contents', 'manualOverrideShowSidebar']),
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn']),

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

    menuClass () {
      let tr = 'menu'
      if (this.showWarning) {
        tr += ' warning'
      }
      return tr
    },

    isSaving () {
      return !_.isNil(this.timer)
    },

    isTrashed () {
      return !!this.content.trashed
    },

    isInTrashedAncestorFolder () {
      if (_.isNil(this.content)) { return false }

      // If this content isn't trashed and in the home folder, we're ok.
      const contentInHomeFolder = _.isNil(this.content.parent)
      if (contentInHomeFolder) { return false }

      // Look up the ancestor tree to see if one of the containing folders is trashed.
      let parent = this.content

      while (_.isObject(parent)) {
        const inHomeFolder = _.isNil(parent.parent)
        if (inHomeFolder) {
          return false
        }
        // Expecting parent.parent to be a string.
        parent = this.getContent(parent.parent)
      }

      // When the loop breaks, the home folder wasn't reached, thus one
      // of the parents wasn't available in 'contents', which includes
      // all un-trashed docs.
      return true
    },

    warningMessage () {
      if (this.isTrashed) {
        return 'This document is in the Trash. Restore to edit.'
      } else if (this.isInTrashedAncestorFolder) {
        return `This document is in a folder in the Trash. Move it or restore the folder to edit.`
      }
      return ''
    },

    showWarning () {
      return this.isTrashed || this.isInTrashedAncestorFolder
    },

    disabled () {
      return this.isTrashed || this.isInTrashedAncestorFolder
    },

    starDocumentClass () {
      let tr = 'star-document toggle '
      if (this.content.starred) {
        tr += 'selected'
      } else {
        tr += 'unselected'
      }
      return tr
    }
  },

  methods: {
    getContent (id) {
      return _.find(this.contents, content => content.id === id)
    },

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
    },

    publishDocument () {
      const publish = fb.functions.httpsCallable('publishDocument')
      const slug = _.toLower(util.getTitleUrl(this.content))
      const args = {
        documentId: this.document.id,
        slug
      }

      this.isPublishing = true

      publish(args).then(result => {
        console.debug(result)
      }).catch(error => {
        console.error('An error occurred while publishing:', error)
      }).finally(() => {
        this.isPublishing = false
      })
    },

    toggleStarDocument () {
      if (this.disabled) { return }
      if (_.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      const contentData = {
        starred: !this.content.starred,
        updated: new Date()
      }
      contentRef.update(contentData).then(() => {
        console.debug('Toggled star on document:', documentTitle)
      })
    },

    trashDocument () {
      if (_.isNil(this.content)) { return }

      const documentTitle = this.content.title
      const contentRef = fb.getCollection('contents').doc(this.content.id)
      const contentData = {
        trashed: true,
        updated: new Date()
      }
      contentRef.update(contentData).then(() => {
        console.debug('Trashed document', documentTitle)
        this.$router.push({ name: 'Dashboard' })
      })
    }
  } // methods
}
</script>
