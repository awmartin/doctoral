<template>
  <div :class="sidebarFloatingClass" v-if="narrowEnoughToHideSidebar">
    <button @click="toggleSidebar">
      <view-list-icon />
    </button>
  </div>

  <div class="sidebar" v-if="showSidebar">
    <div class="header">
      <div class="location">
        <button @click="navigateToEnclosingFolder" :disabled="cannotNavigateUp">
          <backspace-outline-icon />
        </button>

        <input type="text"
          ref="folder-title"
          class="folder-title"
          v-model="sidebarFolderTitle"
          v-if="sidebarTargetFolder.isEditable"
        />
        <span class="folder-title" v-else v-html="sidebarTargetFolder.title" />
      </div>

      <div class="buttons actions">
        <search-dropdown />

        <button @click="createDocument">
          +<file-document-outline-icon />
        </button>

        <button @click="createFolder">
          +<folder-outline-icon />
        </button>
      </div>

      <div class="buttons operations">
        <filter-bar />
        <folder-bar :folder="sidebarTargetFolder" />
      </div>
    </div>

    <content-list :contents="sidebarFolderContents" 
      :grouping="sortGrouping"
      :direction="sortDirection"
      :field="sortField"
      v-if="!sidebarTargetFolder.isTagsListFolder"
    />

    <tags-list v-else />

    <div class="footer">
      <div class="left">
        <double-press-button :click="trashFolder" v-if="sidebarTargetFolder.isEditable">
          <delete-outline-icon />
        </double-press-button>
      </div>

      <div class="right">
        <sort-bar />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar {
  position: relative;
  height: 100%;
  width: 18%;
  min-width: 250px;
  border-right: 1px solid #eee;
  background-color: white;
}
@media (max-width:1160px) {
  // Hide the sidebar when too narrow.
  .sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    min-width: 250px;
    z-index: 3;
  }
}

.header {
  padding: 5px 10px 10px 10px;
}
.content-list {
  height: calc(100% - 136px - 52px);
}
.footer {
  position: absolute;
  bottom: 0;
  left: 0;

  padding: 10px;
  height: 32px;
  width: calc(100% - 20px);

  display: flex;
  justify-content: space-between;
}

.location {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 1.2rem;
  margin-bottom: 5px;
}
.folder-title {
  margin-left: 3px;
}
input.folder-title {
  font-size: 1.2rem;
  border: none;
  outline: none;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  flex-grow: 2;
  border-bottom: 1px solid lighten(lightskyblue, 20%);
  width: calc(100% - 25px);
}

.actions, .operations {
  display: flex;

  margin-bottom: 5px;
  width: 100%;
  align-items: center;

  button {
    margin-right: 0;
    margin-left: 5px;
  }
}

.operations {
  justify-content: space-between;
}

.left {
  display: flex;
  justify-content: flex-start;
}
.right {
  display: flex;
  justify-content: flex-end;
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
</style>

<script>
import { mapState, mapGetters } from 'vuex'

import ContentList from '@/components/ContentList'
import SearchDropdown from '@/components/SearchDropdown'
import DoublePressButton from '@/components/DoublePressButton'
import SortBar from '@/components/SortBar'
import FilterBar from '@/components/FilterBar'
import FolderBar from '@/components/FolderBar'
import TagsList from '@/components/TagsList'

import { FileDocumentOutline as FileDocumentOutlineIcon } from 'mdue'
import { FolderOutline as FolderOutlineIcon } from 'mdue'
import { BackspaceOutline as BackspaceOutlineIcon } from 'mdue'
import { DeleteOutline as DeleteOutlineIcon } from 'mdue'
import { ViewList as ViewListIcon } from 'mdue'

const _ = require('lodash')

export default {
  name: 'Sidebar',

  components: {
    FileDocumentOutlineIcon,
    FolderOutlineIcon,
    BackspaceOutlineIcon,
    ContentList,
    TagsList,
    DoublePressButton,
    DeleteOutlineIcon,
    ViewListIcon,
    SearchDropdown,
    SortBar,
    FilterBar,
    FolderBar
  },

  mounted () {
    // Add a listener for the window size.
    window.addEventListener('resize', this.onResize)
    this.onResize()
  },

  beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
  },

  watch: {
    documentId () {
      this.resetSidebar()
    }
  },

  data () {
    return {
      narrowEnoughToHideSidebar: false
    }
  },

  computed: {
    ...mapState(['sidebarTarget', 'sortDirection', 'sortGrouping', 'sortField', 'filterTag', 'manualOverrideShowSidebar']),
    ...mapGetters(['getContent', 'sidebarFolderContents', 'starredContents', 'sidebarTargetFolder']),

    sidebarHasHomeFolderOpen () {
      return this.sidebarTargetFolder.isHomeFolder
    },

    sidebarHasStarredFolderOpen () {
      return this.filterTag === 'starred'
    },

    sidebarHasTagsListOpen () {
      return this.filterTag === 'tagslist'
    },

    sidebarHasAllDocumentsOpen () {
      return this.filterTag === 'all-documents'
    },

    sidebarHasAllFoldersOpen () {
      return this.filterTag === 'all-folders'
    },

    cannotNavigateUp () {
      return this.sidebarHasHomeFolderOpen || this.sidebarHasStarredFolderOpen || this.sidebarHasTagsListOpen || this.sidebarHasAllDocumentsOpen || this.sidebarHasAllFoldersOpen
    },

    sidebarFolderTitle: {
      get () {
        return this.sidebarTargetFolder ? this.sidebarTargetFolder.title : ''
      },
      set: _.debounce(function (newTitle) {
        if (this.sidebarTargetFolder.isEditable) {
          this.sidebarTargetFolder.setTitle(newTitle)
          this.updateFolder()
        }
      }, 500)
    },

    sidebarFloatingClass () {
      if (this.manualOverrideShowSidebar) {
        return 'sidebar-floating open'
      } else {
        return 'sidebar-floating'
      }
    },

    showSidebar () {
      return !this.narrowEnoughToHideSidebar || this.manualOverrideShowSidebar
    },

    documentId () {
      const elts = _.split(this.$route.params.id, '-')
      return _.head(elts)
    },
  },  // computed

  methods: {
    createFolder () {
      const onSuccess = folder => {
        console.log('Created folder:', folder.id)

        this.$store.dispatch('setSidebarFolderAndFocus', folder.id).then(() => {
          this.$refs['folder-title'].select()
        })
      }

      const onError = error => {
        console.error('Error while creating folder:', error)
      }

      this.$store.dispatch('createFolder', {
        parent: this.sidebarTargetFolder,
        onSuccess,
        onError
      })
    },

    createDocument () {
      const onSuccess = document => {
        console.log('Created document:', document.id)
        this.$router.push({ name: 'NewDocument', params: { id: document.urlId() } })
      }

      const onError = error => {
        console.error('Error while creating document:', error)
      }

      this.$store.dispatch('createDocument', {
        parent: this.sidebarTargetFolder,
        onSuccess,
        onError
      })
    },

    navigateToEnclosingFolder () {
      this.$store.dispatch('setSidebarFolderAndFocus', this.sidebarTargetFolder.parent || null)
    },

    updateFolder () {
      if (this.sidebarTargetFolder.isEditable) {
        const onSuccess = () => {
          console.log('Updated folder:', this.sidebarFolderTitle)
        }

        const onError = error => {
          console.error('Error occurred while updating folder:', error)
        }

        this.$store.dispatch('updateFolder', {
          folder: this.sidebarTargetFolder,
          onSuccess,
          onError
        })
      }
    },

    trashFolder () {
      if (this.sidebarTargetFolder.isEditable) { return }

      const folderTitle = this.sidebarTargetFolder.title
      const parentKey = this.sidebarTargetFolder.parent
      const onSuccess = () => {
        console.log('Sent a folder to the trash:', folderTitle)
        this.$store.dispatch('setSidebarFolderAndFocus', parentKey)
      }

      const onError = error => {
        console.error('Error occurred when moving a folder to the trash:', error)
      }

      this.$store.dispatch('trashFolder', {
        folder: this.sidebarTargetFolder,
        onSuccess,
        onError
      })
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

    onResize () {
      this.narrowEnoughToHideSidebar = window.innerWidth <= 1160
    },
  } // methods
}
</script>
