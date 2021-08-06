<template>
  <div class="file-viewer" v-if="show">
    <Sidebar />

    <div class="body">
      <file-toolbar :content="content" />

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
import FileToolbar from '@/components/FileToolbar'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'

import { mapState, mapGetters } from 'vuex'

const _ = require('lodash')

export default {
  name: 'Document',

  components: {
    FileToolbar,
    Sidebar,
    Loading,
  },

  created () {
    this.loadFile(this.contentId)
  },

  beforeUpdate () {
    if (this.isDirectNavigation === 'yes') {
      const hasFile = _.isObject(this.content)
      if (hasFile) {
        this.setSidebarToParentFolder()
        this.isDirectNavigation = 'yes, done' // Flag no longer needed.
      }
    }
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
      this.loadFile(this.contentId)
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
  },

  computed: {
    ...mapState(['contents']), // contents needed for the watcher
    ...mapGetters(['isLoggedIn', 'isReadyNotLoggedIn', 'isInTrashedAncestorFolder']),

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
      return this.content.trashed || this.isInTrashedAncestorFolder(this.content) || this.content.archived
    }
  },

  methods: {
    loadFile (contentId) {
      if (_.isNil(contentId) || !this.isLoggedIn) { return }

      const file = _.find(this.contents, content => content.id === this.contentId)
      if (!_.isNil(file)) {
        console.log('Loaded file:', contentId, file.title)
        this.content = file
        document.title = `Doctoral | ${file.title}`
      }
    },

    setSidebarToParentFolder () {
      if (_.isNil(this.content)) { return }
      this.$store.dispatch('setSidebarFolderAndFocus', this.content.parent)
    },
  } // methods
}
</script>
