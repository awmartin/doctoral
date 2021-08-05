<template>
  <div class="file-viewer" v-if="show">
    <Sidebar />

    <div class="body">
      <div class="header">
        <h1>{{ content?.title }}</h1>
      </div>

      <div class="viewer">
        <iframe :src="content.key" v-if="content" />
      </div>
    </div>

    <loading v-if="isLoading" />
  </div>
</template>

<style lang="scss" scoped>
.file-viewer {
  position: relative;
  display: flex;
  height: calc(100% - 36px);
}

.header {
  height: 40px;
  margin: 0 10px;
  h1 {
    font-weight: 500;
  }
}

.viewer {
  width: 100%;
  height: calc(100% - 60px);

  iframe {
    margin: 10px;
    width: calc(100% - 22px);
    height: calc(100% - 22px);
    border: 1px solid lightgray;
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
@media (max-width: 1160px) {
  .body {
    width: 100%;
  }
}
</style>

<script>
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Document',

  components: {
    Sidebar,
    Loading,
  },

  created () {
    this.loadFile(this.contentId)
  },

  beforeUpdate () {
    // if (this.isDirectNavigation === 'yes') {
    //   const hasDocument = _.isObject(this.document)
    //   if (hasDocument) {
    //     this.setSidebarToParentFolder()
    //     this.isDirectNavigation = 'yes, done' // Flag no longer needed.
    //   }
    // }
  },

  data () {
    return {
      content: null,
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
      // this.loadNewDocument(this.documentId)
    },

    contents () {
      // Needed for direct navigation. Load the document when the contents are loaded, since it's
      // needed to complete the content/document pair.
      this.loadFile(this.contentId)
    },

    contentId (newContentId, oldContentId) {
      if (!_.isNil(oldContentId)) {
        this.loadFile(newContentId)
      }
    }

    // documentId (newDocumentId, oldDocumentId) {
    //   if (_.isNil(newDocumentId)) {
    //     // Not loading a new document. Likely navigating somewhere else.
    //     return
    //   }

    //   const isChangingDocs = newDocumentId !== oldDocumentId && !_.isNil(oldDocumentId)
    //   if (isChangingDocs && this.$refs.editor) {
    //     // Save the document the user is navigating away from.
    //     this.$refs.editor.forceSave()
    //     .then(() => {
    //       this.loadNewDocument(newDocumentId)
    //     })
    //     .catch(error => {
    //       console.error('Error when saving a document on route change:', error)
    //     })
    //   } else {
    //     this.loadNewDocument(newDocumentId)
    //   }
    // }
  },

  computed: {
    ...mapState(['contents']), // contents needed for the watcher
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'getContentByDocumentKey', 'isInTrashedAncestorFolder']),

    contentId () {
      if (this.$route.name === 'File') {
        return this.$route.params.id
      } else {
        return null
      }
    },

    show () {
      return this.isLoggedIn
    },

    disabled () {
      return false
      // return this.content.trashed || this.isInTrashedAncestorFolder(this.content) || this.content.archived
    }
  },

  methods: {
    loadFile (contentId) {
      if (_.isNil(contentId) || !this.isLoggedIn) { return }

      // const isAlreadyLookingAtThisDocument = this.contentId === contentId
      // if (isAlreadyLookingAtThisDocument) { return }

      // TODO Audit this approach.
      // Disabled because the current way to look at an archived document is to bypass this check and make a fake table-of-contents entry.

      // const content = this.getContentByDocumentKey(documentKey)
      // if (_.isNil(content)) {
      //   console.warn('Attempted to load a document, but couldn\'t find the associated table-of-contents object:', documentKey)
      //   return
      // }

      // This might show up simultaneously with the Dashboard loading indicator.
      this.isLoading = true

      const file = _.find(this.contents, content => content.id === this.contentId)
      if (!_.isNil(file)) {
        console.log('Loaded file:', contentId, file.title)
        this.content = file
        this.isLoading = false
        document.title = `Doctoral | ${file.title}`
      }
    },

    // setSidebarToParentFolder () {
    //   if (_.isNil(this.document?.content)) { return }
    //   this.$store.dispatch('setSidebarFolderAndFocus', this.content.parent)
    // },

    // showTrash () {
    //   this.$router.push({ name: 'Trash' })
    // },

    // onResize () {
    //   this.narrowEnoughToHideSidebar = window.innerWidth <= 1160
    // }
  } // methods
}
</script>
